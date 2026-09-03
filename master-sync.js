import { queryOData } from './bc-client.js';

// Pulls master data from LS-Central (BC) published OData web services and
// upserts it into Cloud SQL (PostgreSQL), replacing the manual xlsx upload for these masters.
//
// Field mappings were confirmed against the live tenant on 2026-06-18 (see
// docs/tech-research/20260618-ls-central-master-sync.md). Multilingual fields
// live on the LS Central custom Retail_* pages (THA/JPN), which survive the
// 2027 Wave 1 OData deprecation (that only affects Microsoft first-party pages).
//
// Full overwrite: each sync upserts every fetched row AND deletes local rows
// whose key is absent from BC, inside one transaction. As a safety net the
// delete is refused when BC returns zero rows (a wiped table is much more
// likely to mean a BC-side problem than an intentionally emptied master).
// The manual xlsx import endpoints stay upsert-only: their files are
// department-scoped, so deleting unmatched rows would drop other departments.

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

/**
 * Fetch all rows of the given columns from a table. Plain SQL has no row cap, so
 * unlike the PostgREST version this needs no paging.
 */
async function fetchAllExisting(db, table, columns) {
  return db.queryRows(`select ${columns.join(', ')} from ${table}`);
}

/**
 * Fetch one master from BC and upsert into Cloud SQL.
 * @param {'group'|'supplier'} type
 * @param {typeof import('./db.js')} db data access module
 * @param {{ triggeredBy?: string, dryRun?: boolean }} opts
 * @returns {Promise<object>} result summary
 */
export async function runSync(type, db, { triggeredBy = 'system', dryRun = false } = {}) {
  const def = DEFS[type];
  if (!def) throw new Error(`unknown sync type: ${type}`);
  if (!db) throw new Error('Database not configured');

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
    const existing = await fetchAllExisting(db, def.table, [def.conflict, ...def.fields]);
    const byKey = new Map(existing.map((r) => [String(r[def.conflict]), r]));
    const sourceKeys = new Set(unique.map((r) => String(r[def.conflict])));
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
    // Full-overwrite: rows present locally but absent from BC would be deleted.
    const deleteKeys = existing
      .map((r) => String(r[def.conflict]))
      .filter((k) => !sourceKeys.has(k));
    return {
      ok: true, type, dryRun: true, service: def.service,
      fetched: rows.length, unique: unique.length, existing: existing.length,
      toInsert, toUpdate, unchanged, toDelete: deleteKeys.length,
      insertSamples, updateSamples, deleteSamples: deleteKeys.slice(0, 5),
      durationMs: Date.now() - startedAt,
    };
  }

  // Refuse the destructive path on an empty fetch: an empty result set almost
  // certainly means a BC-side outage or a broken service, not an emptied master.
  if (unique.length === 0) {
    throw new Error(`${def.service} returned 0 rows; refusing full overwrite of ${def.table}`);
  }

  let upserted = 0;
  let deleted = 0;
  try {
    ({ upserted, deleted } = await db.withTransaction(async (client) => {
      // Delete first so the statement sees only pre-sync rows; the upsert then
      // restores/refreshes everything BC still has.
      const delRes = await client.query(
        `delete from ${def.table} where not (${def.conflict} = any($1::text[]))`,
        [unique.map((r) => r[def.conflict])],
      );
      const written = await db.bulkUpsert(
        def.table,
        [def.conflict, ...def.fields],
        unique,
        def.conflict,
        { chunkSize: UPSERT_BATCH, client },
      );
      return { upserted: written, deleted: delRes.rowCount };
    }));
  } catch (err) {
    throw new Error(`${def.table} full-overwrite sync failed: ${err.message}`);
  }

  const durationMs = Date.now() - startedAt;
  const result = { ok: true, type, service: def.service, fetched: rows.length, upserted, deleted, durationMs };

  // Best-effort audit entry, reusing operation_log (no schema change).
  try {
    // details is passed as an untyped parameter so Postgres coerces it to whatever
    // the column is (json / jsonb / text).
    await db.query(
      `insert into operation_log (username, action, item_count, details)
       values ($1, $2, $3, $4)`,
      [
        triggeredBy,
        def.action,
        upserted,
        JSON.stringify({ fetched: rows.length, deleted, service: def.service, durationMs }),
      ],
    );
  } catch (err) {
    console.error(`[master-sync] operation_log insert failed (${type}):`, err.message);
  }
  return result;
}

/**
 * Latest sync result per type, from operation_log, for the admin UI.
 * @returns {Promise<Record<string, object>>}
 */
export async function latestSyncStatus(db) {
  if (!db) return {};
  const out = {};
  for (const type of SYNC_TYPES) {
    // Best-effort per type: a failure here should not blank out the whole admin panel.
    try {
      const row = await db.queryOne(
        `select created_at, item_count, username, details from operation_log
          where action = $1 order by created_at desc limit 1`,
        [DEFS[type].action],
      );
      if (row) out[type] = row;
    } catch (err) {
      console.error(`[master-sync] latestSyncStatus(${type}) failed:`, err.message);
    }
  }
  return out;
}
