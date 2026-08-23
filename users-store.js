/**
 * ユーザーマスタ管理
 * Cloud SQL (PostgreSQL) の user_master テーブルを使用。
 * DB 未設定時は data/users.json にフォールバック（開発用）。
 */
import fs from 'node:fs';
import path from 'node:path';

// --- DB module (server.js から init() で注入) ---
/** @type {typeof import("./db.js") | null} */
let db = null;

export function init(dbModule) {
  db = dbModule;
}

// --- JSON ファイルフォールバック（開発用） ---
const USERS_FILE = process.env.USERS_FILE
  ? path.resolve(process.env.USERS_FILE)
  : path.resolve(process.cwd(), 'data', 'users.json');

function ensureStoreFile() {
  const dir = path.dirname(USERS_FILE);
  fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify({ users: [] }, null, 2), 'utf8');
  }
}

function readStore() {
  ensureStoreFile();
  const raw = fs.readFileSync(USERS_FILE, 'utf8');
  const parsed = JSON.parse(raw || '{}');
  return { users: Array.isArray(parsed.users) ? parsed.users : [] };
}

function writeStore(data) {
  ensureStoreFile();
  fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// --- PostgreSQL 実装 ---

// Set when Postgres reports "column entra_oid does not exist" (SQLSTATE 42703),
// i.e. docs/db/002_add_entra_oid_to_user_master.sql has not been applied yet.
// The store then keeps working in username-matching mode instead of failing
// every login, so a deploy that lands before the migration does not lock users out.
let entraOidColumnMissing = false;

function isMissingEntraOidColumn(error) {
  if (!error) return false;
  return error.code === '42703' || /entra_oid/.test(error.message || '');
}

function markEntraOidColumnMissing() {
  if (!entraOidColumnMissing) {
    entraOidColumnMissing = true;
    console.warn('[users-store] user_master.entra_oid is missing — falling back to username matching. Apply docs/db/002_add_entra_oid_to_user_master.sql.');
  }
}

async function pgFindByUsername(username) {
  // `order by id limit 1` instead of an error on duplicates: rows created before
  // entra_oid matching existed can still collide (see 003_merge_duplicate_user_master_rows.sql),
  // and the oldest row is the one holding the real role / allowed_departments.
  const row = await db.queryOne(
    'select * from user_master where username = $1 order by id limit 1',
    [String(username || '').toLowerCase()],
  );
  return row ? normalizeRow(row) : null;
}

/** Look up by the immutable Entra object id. Returns null while the column is absent. */
async function pgFindByEntraOid(oid) {
  if (entraOidColumnMissing) return null;
  try {
    const row = await db.queryOne(
      'select * from user_master where entra_oid = $1 order by id limit 1',
      [oid],
    );
    return row ? normalizeRow(row) : null;
  } catch (err) {
    if (isMissingEntraOidColumn(err)) {
      markEntraOidColumnMissing();
      return null;
    }
    throw err;
  }
}

/**
 * Match any of the email-like claims from the ID token.
 * Ordered by id so the oldest row wins — that is the one carrying the
 * role / allowed_departments granted before Entra changed the mail or UPN.
 */
async function pgFindByUsernames(usernames) {
  const row = await db.queryOne(
    'select * from user_master where username = any($1::text[]) order by id limit 1',
    [usernames],
  );
  return row ? normalizeRow(row) : null;
}

/** Persist the Entra-derived identity fields (oid / login id / display name). */
async function pgUpdateIdentity(userId, identity) {
  const sets = ['updated_at = now()'];
  const params = [];
  const username = identity.username ? String(identity.username).trim().toLowerCase() : '';
  if (username) {
    params.push(username);
    sets.push(`username = $${params.length}`);
  }
  if (identity.displayName) {
    params.push(identity.displayName);
    sets.push(`display_name = $${params.length}`);
  }
  if (identity.entraOid && !entraOidColumnMissing) {
    params.push(identity.entraOid);
    sets.push(`entra_oid = $${params.length}`);
  }
  params.push(userId);

  try {
    const row = await db.queryOne(
      `update user_master set ${sets.join(', ')} where id = $${params.length} returning *`,
      params,
    );
    return row ? normalizeRow(row) : null;
  } catch (err) {
    if (isMissingEntraOidColumn(err)) {
      markEntraOidColumnMissing();
      return pgUpdateIdentity(userId, { ...identity, entraOid: '' });
    }
    // Unique violation on username: a duplicate row still holds that login id
    // (see docs/db/003_merge_duplicate_user_master_rows.sql). Keep the current
    // username rather than failing the login.
    if (err.code === '23505' && username) {
      console.warn(`[users-store] username "${username}" already taken by another row; keeping the existing value for user ${userId}.`);
      const { username: _dropped, ...rest } = identity;
      return pgUpdateIdentity(userId, rest);
    }
    throw err;
  }
}

async function pgListUsers() {
  const rows = await db.queryRows('select * from user_master order by id');
  return rows.map(normalizeRow);
}

async function pgCreateUser(email, identity = {}) {
  const target = email.trim().toLowerCase();
  // 先に件数確認して最初のユーザーは admin にする
  const countRow = await db.queryOne('select count(*)::int as count from user_master');
  const isFirst = (countRow?.count ?? 0) === 0;

  const columns = ['username', 'display_name', 'role', 'preferred_store', 'preferred_department'];
  const params = [target, identity.displayName || '', isFirst ? 'admin' : 'user', '', ''];
  const placeholders = params.map((_, i) => `$${i + 1}`);

  // allowed_departments is text[] (see docs/db/000_baseline.sql); node-postgres
  // serializes a JS array into the Postgres array literal the cast expects.
  params.push([]);
  columns.push('allowed_departments');
  placeholders.push(`$${params.length}::text[]`);

  if (identity.entraOid && !entraOidColumnMissing) {
    params.push(identity.entraOid);
    columns.push('entra_oid');
    placeholders.push(`$${params.length}`);
  }

  try {
    const row = await db.queryOne(
      `insert into user_master (${columns.join(', ')}) values (${placeholders.join(', ')}) returning *`,
      params,
    );
    return normalizeRow(row);
  } catch (err) {
    if (isMissingEntraOidColumn(err)) {
      markEntraOidColumnMissing();
      return pgCreateUser(email, { ...identity, entraOid: '' });
    }
    throw err;
  }
}

async function pgUpdatePreferences(userId, preferences) {
  // 現在の allowed_departments を取得
  const current = await db.queryOne(
    'select allowed_departments, preferred_department from user_master where id = $1',
    [userId],
  );
  if (!current) return null;

  const newDept = preferences.preferredDepartment ?? current.preferred_department ?? '';
  const currentAllowed = Array.isArray(current.allowed_departments) ? current.allowed_departments : [];
  const allowedDepartments =
    currentAllowed.length === 0 && newDept ? [newDept] : currentAllowed;
  const row = await db.queryOne(
    `update user_master set
       display_name = $1,
       preferred_store = $2,
       preferred_department = $3,
       allowed_departments = $4::text[],
       updated_at = now()
     where id = $5
     returning *`,
    [
      preferences.displayName ?? '',
      preferences.preferredStore ?? '',
      newDept,
      allowedDepartments,
      userId,
    ],
  );
  return row ? normalizeRow(row) : null;
}

async function pgUpdateByAdmin(targetId, updates) {
  const sets = ['updated_at = now()'];
  const params = [];
  if (updates.role !== undefined) {
    if (!['admin', 'user'].includes(updates.role)) throw new Error(`Invalid role: ${updates.role}`);
    params.push(updates.role);
    sets.push(`role = $${params.length}`);
  }
  if (updates.allowed_departments !== undefined) {
    if (!Array.isArray(updates.allowed_departments)) throw new Error('allowed_departments must be array');
    params.push(updates.allowed_departments.map(String));
    sets.push(`allowed_departments = $${params.length}::text[]`);
  }
  params.push(targetId);

  const row = await db.queryOne(
    `update user_master set ${sets.join(', ')} where id = $${params.length} returning *`,
    params,
  );
  return row ? normalizeRow(row) : null;
}
/** DB の行をアプリ内形式に正規化 */
function normalizeRow(r) {
  return {
    id: r.id,
    username: r.username,
    entra_oid: r.entra_oid || '',
    display_name: r.display_name || '',
    role: r.role || 'user',
    allowed_departments: Array.isArray(r.allowed_departments) ? r.allowed_departments : [],
    preferred_store: r.preferred_store || '',
    preferred_department: r.preferred_department || '',
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

// --- JSON フォールバック実装 ---

function jsonFindByUsername(username) {
  const target = String(username || '').trim().toLowerCase();
  if (!target) return null;
  const { users } = readStore();
  return users.find((u) => String(u.username || '').toLowerCase() === target) || null;
}

function jsonFindByEntraOid(oid) {
  const target = String(oid || '').trim();
  if (!target) return null;
  const { users } = readStore();
  return users.find((u) => String(u.entra_oid || '') === target) || null;
}

function jsonFindByUsernames(usernames) {
  const targets = usernames.map((u) => String(u || '').trim().toLowerCase()).filter(Boolean);
  if (targets.length === 0) return null;
  const { users } = readStore();
  return (
    users
      .filter((u) => targets.includes(String(u.username || '').toLowerCase()))
      .sort((a, b) => Number(a.id) - Number(b.id))[0] || null
  );
}

function jsonUpdateIdentity(userId, identity) {
  const data = readStore();
  const idx = data.users.findIndex((u) => Number(u.id) === Number(userId));
  if (idx < 0) return null;
  const current = data.users[idx];
  const taken = identity.username
    ? data.users.some(
        (u) =>
          Number(u.id) !== Number(userId) &&
          String(u.username || '').toLowerCase() === String(identity.username).trim().toLowerCase()
      )
    : false;
  const updated = {
    ...current,
    username: identity.username && !taken ? String(identity.username).trim().toLowerCase() : current.username,
    entra_oid: identity.entraOid || current.entra_oid || '',
    display_name: identity.displayName || current.display_name || '',
    updated_at: new Date().toISOString(),
  };
  data.users[idx] = updated;
  writeStore(data);
  return updated;
}

function jsonListUsers() {
  return readStore().users;
}

function jsonCreateUser(email, identity = {}) {
  const target = String(email || '').trim().toLowerCase();
  if (!target) throw new Error('email is required');
  const existing = jsonFindByUsername(target);
  if (existing) return existing;
  const data = readStore();
  const nextId = data.users.reduce((max, u) => Math.max(max, Number(u.id) || 0), 0) + 1;
  const isFirst = data.users.length === 0;
  const now = new Date().toISOString();
  const user = {
    id: nextId,
    username: target,
    entra_oid: identity.entraOid || '',
    display_name: identity.displayName || '',
    role: isFirst ? 'admin' : 'user',
    allowed_departments: [],
    preferred_store: '',
    preferred_department: '',
    created_at: now,
    updated_at: now,
  };
  data.users.push(user);
  writeStore(data);
  return user;
}

function jsonUpdatePreferences(userId, preferences) {
  const data = readStore();
  const idx = data.users.findIndex((u) => Number(u.id) === Number(userId));
  if (idx < 0) return null;
  const current = data.users[idx];
  const newDept = preferences.preferredDepartment ?? current.preferred_department ?? '';
  const currentAllowed = Array.isArray(current.allowed_departments) ? current.allowed_departments : [];
  const allowedDepartments = currentAllowed.length === 0 && newDept ? [newDept] : currentAllowed;
  const updated = {
    ...current,
    display_name: preferences.displayName ?? current.display_name ?? '',
    preferred_store: preferences.preferredStore ?? current.preferred_store ?? '',
    preferred_department: newDept,
    allowed_departments: allowedDepartments,
    updated_at: new Date().toISOString(),
  };
  data.users[idx] = updated;
  writeStore(data);
  return updated;
}

function jsonUpdateByAdmin(targetId, updates) {
  const data = readStore();
  const idx = data.users.findIndex((u) => Number(u.id) === Number(targetId));
  if (idx < 0) return null;
  const current = data.users[idx];
  const updated = { ...current };
  if (updates.role !== undefined) {
    if (!['admin', 'user'].includes(updates.role)) throw new Error(`Invalid role: ${updates.role}`);
    updated.role = updates.role;
  }
  if (updates.allowed_departments !== undefined) {
    if (!Array.isArray(updates.allowed_departments)) throw new Error('allowed_departments must be array');
    updated.allowed_departments = updates.allowed_departments.map(String);
  }
  updated.updated_at = new Date().toISOString();
  data.users[idx] = updated;
  writeStore(data);
  return updated;
}

// --- 公開 API（すべて async） ---

export async function findUserByUsername(username) {
  if (db) return pgFindByUsername(username);
  return jsonFindByUsername(username);
}

/** Primary account lookup: immutable Entra object id. */
export async function findUserByEntraOid(oid) {
  const target = String(oid || '').trim();
  if (!target) return null;
  if (db) return pgFindByEntraOid(target);
  return jsonFindByEntraOid(target);
}

/** Fallback lookup for rows created before entra_oid was persisted. */
export async function findUserByAnyUsername(usernames) {
  const targets = [...new Set((usernames || []).map((u) => String(u || '').trim().toLowerCase()).filter(Boolean))];
  if (targets.length === 0) return null;
  if (db) return pgFindByUsernames(targets);
  return jsonFindByUsernames(targets);
}

export async function listUsers() {
  if (db) return pgListUsers();
  return jsonListUsers();
}

export async function createUserFromEmail(email, identity = {}) {
  if (db) return pgCreateUser(email, identity);
  return jsonCreateUser(email, identity);
}

/** Sync entra_oid / username / display_name from the ID token onto an existing row. */
export async function updateUserIdentity(userId, identity) {
  if (db) return pgUpdateIdentity(userId, identity);
  return jsonUpdateIdentity(userId, identity);
}

export async function updateUserPreferences(userId, preferences) {
  if (db) return pgUpdatePreferences(userId, preferences);
  return jsonUpdatePreferences(userId, preferences);
}

export async function updateUserByAdmin(targetId, updates) {
  if (db) return pgUpdateByAdmin(targetId, updates);
  return jsonUpdateByAdmin(targetId, updates);
}
