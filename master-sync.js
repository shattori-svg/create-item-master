import { queryOData } from './bc-client.js';

// Pulls master data from LS-Central (BC) published OData web services and
// upserts it into Supabase, replacing the manual xlsx upload for these masters.
//
// Field mappings were confirmed against the live tenant on 2026-06-18 (see
// docs/tech-research/20260618-ls-central-master-sync.md). Multilingual fields
// live on the LS Central custom Retail_* pages (THA/JPN), which survive the
// 2027 Wave 1 OData deprecation (that only affects Microsoft first-party pages).
//
// Upsert-only: rows removed in BC are NOT deleted locally (non-destructive,
// matches the existing manual-import behavior). Stale-row handling is a future
// consideration.

const str = (v) => (v == null ? '' : String(v).trim());

export const SYNC_TYPES = ['group', 'supplier'];

const DEFS = {
  group: {
    service: 'Retail_Product_Groups_Excel',
    select: 'Code,Description,CTZ_Description_2,CTZ_Description_3',
    table: 'group_master',
    conflict: 'product_group_code',
    fields: ['description', 'description_tha', 'description_jpn'],
    action: 'sync_group',
    key: (r) => str(r.Code),
    map: (r) => ({
      product_group_code: str(r.Code),
      description: str(r.Description),
      description_tha: str(r.CTZ_Description_2),
      description_jpn: str(r.CTZ_Description_3),
    }),
  },
  supplier: {
    service: 'Retail_Vendor_Card_Excel',
    select: 'No,Search_Name,Name,CTZ_Name_3',
    table: 'supplier_master',
    conflict: 'supplier_no',
    fields: ['abbreviation', 'name_eng', 'name_tha'],
    action: 'sync_supplier',
    key: (r) => str(r.No),
    map: (r) => ({
      supplier_no: str(r.No),
      abbreviation: str(r.Search_Name),
      name_eng: str(r.Name),
      name_tha: str(r.CTZ_Name_3),
    }),
  },
};

const UPSERT_BATCH = 500;

const norm = (v) => (v == null ? '' : String(v).trim());

/** Fetch all rows of the given columns from a table, paging past Supabase's 1000-row cap. */
async function fetchAllExisting(supabase, table, columns) {
  const pageSize = 1000;
  const all = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from(table)
      .select(columns.join(','))
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`${table} select failed: ${error.message}`);
    all.push(...(data || []));
    if (!data || data.length < pageSize) break;
  }
  return all;
}

/**
 * Fetch one master from BC and upsert into Supabase.
 * @param {'group'|'supplier'} type
 * @param {object} supabase service-role client
 * @param {{ triggeredBy?: string, dryRun?: boolean }} opts
 * @returns {Promise<object>} result summary
 */
export async function runSync(type, supabase, { triggeredBy = 'system', dryRun = false } = {}) {
  const def = DEFS[type];
  if (!def) throw new Error(`unknown sync type: ${type}`);
  if (!supabase) throw new Error('Database not configured');

  const startedAt = Date.now();
  const rows = await queryOData(def.service, { select: def.select });

  // Map + drop empty primary key + dedupe (last row wins, matching the manual
  // import endpoints).
  const unique = [
    ...new Map(
      rows.filter((r) => def.key(r)).map((r) => [def.key(r), def.map(r)]),
    ).values(),
  ];

  // Dry run: compare against existing rows and report the diff WITHOUT writing.
  if (dryRun) {
    const existing = await fetchAllExisting(supabase, def.table, [def.conflict, ...def.fields]);
    const byKey = new Map(existing.map((r) => [String(r[def.conflict]), r]));
    let toInsert = 0;
    let toUpdate = 0;
    let unchanged = 0;
    const insertSamples = [];
    const updateSamples = [];
    for (const row of unique) {
      const ex = byKey.get(String(row[def.conflict]));
      if (!ex) {
        toInsert += 1;
        if (insertSamples.length < 5) insertSamples.push(row);
        continue;
      }
      const diffs = def.fields
        .filter((f) => norm(ex[f]) !== norm(row[f]))
        .map((f) => ({ field: f, before: norm(ex[f]), after: norm(row[f]) }));
      if (diffs.length) {
        toUpdate += 1;
        if (updateSamples.length < 5) updateSamples.push({ key: row[def.conflict], diffs });
      } else {
        unchanged += 1;
      }
    }
    return {
      ok: true, type, dryRun: true, service: def.service,
      fetched: rows.length, unique: unique.length, existing: existing.length,
      toInsert, toUpdate, unchanged, insertSamples, updateSamples,
      durationMs: Date.now() - startedAt,
    };
  }

  let upserted = 0;
  for (let i = 0; i < unique.length; i += UPSERT_BATCH) {
    const chunk = unique.slice(i, i + UPSERT_BATCH);
    const { error } = await supabase.from(def.table).upsert(chunk, { onConflict: def.conflict });
    if (error) throw new Error(`${def.table} upsert failed: ${error.message}`);
    upserted += chunk.length;
  }

  const durationMs = Date.now() - startedAt;
  const result = { ok: true, type, service: def.service, fetched: rows.length, upserted, durationMs };

  // Best-effort audit entry, reusing operation_log (no schema change).
  try {
    await supabase.from('operation_log').insert({
      username: triggeredBy,
      action: def.action,
      item_count: upserted,
      details: { fetched: rows.length, service: def.service, durationMs },
    });
  } catch (err) {
    console.error(`[master-sync] operation_log insert failed (${type}):`, err.message);
  }
  return result;
}

/**
 * Latest sync result per type, from operation_log, for the admin UI.
 * @returns {Promise<Record<string, object>>}
 */
export async function latestSyncStatus(supabase) {
  if (!supabase) return {};
  const out = {};
  for (const type of SYNC_TYPES) {
    const { data, error } = await supabase
      .from('operation_log')
      .select('created_at, item_count, username, details')
      .eq('action', DEFS[type].action)
      .order('created_at', { ascending: false })
      .limit(1);
    if (!error && data && data[0]) out[type] = data[0];
  }
  return out;
}
