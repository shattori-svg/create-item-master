/**
 * Cloud SQL for PostgreSQL data access layer.
 *
 * Replaces the former @supabase/supabase-js client. Everything in this app is
 * plain CRUD, so there is no ORM: callers pass SQL with positional parameters.
 *
 * Connection modes (checked in this order):
 *   1. DATABASE_URL              — full libpq URL. Handy for local dev and psql parity.
 *   2. INSTANCE_UNIX_SOCKET      — Cloud Run + `--add-cloudsql-instances`. The Cloud SQL
 *                                  Auth Proxy exposes a socket at
 *                                  /cloudsql/<PROJECT:REGION:INSTANCE>; node-postgres
 *                                  treats a host starting with "/" as a socket directory.
 *                                  TLS is handled by the proxy, so no ssl config here.
 *   3. DB_HOST (+ DB_PORT)       — plain TCP. Used for private IP (Direct VPC egress) or
 *                                  a local Postgres. Set DB_SSL=1 to require TLS.
 *
 * Pool sizing: Cloud Run scales horizontally, so the ceiling that matters is
 * `max instances x DB_POOL_MAX < the instance's max_connections`. Keep DB_POOL_MAX
 * small and cap Cloud Run with --max-instances. See docs/cloudsql-migration.md.
 */
import pg from 'pg';

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL || '';
const INSTANCE_UNIX_SOCKET = process.env.INSTANCE_UNIX_SOCKET || '';
const DB_HOST = process.env.DB_HOST || '';
const DB_PORT = Number(process.env.DB_PORT || 5432);
const DB_USER = process.env.DB_USER || '';
const DB_PASS = process.env.DB_PASS || '';
const DB_NAME = process.env.DB_NAME || '';

// Small on purpose: every Cloud Run instance keeps its own pool.
const DB_POOL_MAX = Number(process.env.DB_POOL_MAX || 5);

function buildPoolConfig() {
  const common = {
    max: DB_POOL_MAX,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
    // Cloud SQL closes idle connections server-side; keepalives surface that as a
    // pool error (handled below) instead of a hung query.
    keepAlive: true,
  };

  if (DATABASE_URL) return { ...common, connectionString: DATABASE_URL };

  if (INSTANCE_UNIX_SOCKET) {
    return { ...common, host: INSTANCE_UNIX_SOCKET, user: DB_USER, password: DB_PASS, database: DB_NAME };
  }

  if (DB_HOST) {
    return {
      ...common,
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASS,
      database: DB_NAME,
      // Cloud SQL's server certificate is signed by a per-instance CA that is not in
      // the system trust store, so verification is opt-in via DB_CA_CERT.
      ssl: process.env.DB_SSL === '1'
        ? (process.env.DB_CA_CERT ? { ca: process.env.DB_CA_CERT } : { rejectUnauthorized: false })
        : undefined,
    };
  }

  return null;
}

const poolConfig = buildPoolConfig();

/** True when enough env vars are present to talk to Postgres. */
export function isDbConfigured() {
  return poolConfig !== null;
}

let pool = null;

function getPool() {
  if (!poolConfig) throw new Error('Database not configured');
  if (!pool) {
    pool = new Pool(poolConfig);
    // An idle client erroring out (server restart, maintenance) emits on the pool.
    // Without a listener Node treats it as an unhandled 'error' event and exits.
    pool.on('error', (err) => {
      console.error('[db] idle client error:', err.message);
    });
    const where = DATABASE_URL ? 'DATABASE_URL' : (INSTANCE_UNIX_SOCKET || `${DB_HOST}:${DB_PORT}`);
    console.log(`[db] pool created (max=${DB_POOL_MAX}) target=${where}`);
  }
  return pool;
}

/**
 * Run a parameterized statement. Returns the pg Result.
 * @param {string} sql SQL with $1..$n placeholders
 * @param {unknown[]} params
 */
export async function query(sql, params = []) {
  return getPool().query(sql, params);
}

/** Rows only. */
export async function queryRows(sql, params = []) {
  const { rows } = await query(sql, params);
  return rows;
}

/** First row, or null when the statement matched nothing. */
export async function queryOne(sql, params = []) {
  const { rows } = await query(sql, params);
  return rows[0] ?? null;
}

/**
 * Run fn inside a transaction on a dedicated client.
 * @param {(client: import('pg').PoolClient) => Promise<T>} fn
 * @returns {Promise<T>}
 * @template T
 */
export async function withTransaction(fn) {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch { /* connection already gone */ }
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Bulk `INSERT ... ON CONFLICT (key) DO UPDATE`, matching the semantics the
 * Supabase `.upsert(rows, { onConflict })` calls had (last row wins, non-conflict
 * columns overwritten, rows absent from the payload left untouched).
 *
 * Callers must de-duplicate on the conflict key first: Postgres rejects a
 * statement that hits the same key twice ("ON CONFLICT DO UPDATE command cannot
 * affect row a second time"). Every call site already does this via a Map.
 *
 * @param {string} table
 * @param {string[]} columns
 * @param {Record<string, unknown>[]} rows
 * @param {string} conflictColumn
 * @param {{ chunkSize?: number }} [opts]
 * @returns {Promise<number>} rows written
 */
export async function bulkUpsert(table, columns, rows, conflictColumn, { chunkSize = 500 } = {}) {
  if (rows.length === 0) return 0;
  const updates = columns
    .filter((c) => c !== conflictColumn)
    .map((c) => `${c} = excluded.${c}`)
    .join(', ');

  let written = 0;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const params = [];
    const tuples = chunk.map((row) => {
      const placeholders = columns.map((c) => {
        params.push(row[c]);
        return `$${params.length}`;
      });
      return `(${placeholders.join(', ')})`;
    });
    const sql = `insert into ${table} (${columns.join(', ')}) values ${tuples.join(', ')}`
      + ` on conflict (${conflictColumn}) do update set ${updates}`;
    await query(sql, params);
    written += chunk.length;
  }
  return written;
}

/** Close the pool. Only used by scripts; Cloud Run instances just get killed. */
export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
