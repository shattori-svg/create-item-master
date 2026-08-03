/**
 * ユーザーマスタ管理
 * Supabase の user_master テーブルを使用。
 * Supabase 未設定時は data/users.json にフォールバック（開発用）。
 */
import fs from 'node:fs';
import path from 'node:path';

// --- Supabase client (server.js から init() で注入) ---
let supabase = null;

export function init(supabaseClient) {
  supabase = supabaseClient;
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

// --- Supabase 実装 ---

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

async function sbFindByUsername(username) {
  const { data, error } = await supabase
    .from('user_master')
    .select('*')
    .eq('username', username.toLowerCase())
    .maybeSingle();
  if (error) throw error;
  return data ? normalizeRow(data) : null;
}

/** Look up by the immutable Entra object id. Returns null while the column is absent. */
async function sbFindByEntraOid(oid) {
  if (entraOidColumnMissing) return null;
  const { data, error } = await supabase
    .from('user_master')
    .select('*')
    .eq('entra_oid', oid)
    .maybeSingle();
  if (error) {
    if (isMissingEntraOidColumn(error)) {
      markEntraOidColumnMissing();
      return null;
    }
    throw error;
  }
  return data ? normalizeRow(data) : null;
}

/**
 * Match any of the email-like claims from the ID token.
 * Ordered by id so the oldest row wins — that is the one carrying the
 * role / allowed_departments granted before Entra changed the mail or UPN.
 */
async function sbFindByUsernames(usernames) {
  const { data, error } = await supabase
    .from('user_master')
    .select('*')
    .in('username', usernames)
    .order('id')
    .limit(1);
  if (error) throw error;
  return data?.[0] ? normalizeRow(data[0]) : null;
}

/** Persist the Entra-derived identity fields (oid / login id / display name). */
async function sbUpdateIdentity(userId, identity) {
  const patch = { updated_at: new Date().toISOString() };
  if (identity.username) patch.username = String(identity.username).trim().toLowerCase();
  if (identity.displayName) patch.display_name = identity.displayName;
  if (identity.entraOid && !entraOidColumnMissing) patch.entra_oid = identity.entraOid;

  const { data, error } = await supabase
    .from('user_master')
    .update(patch)
    .eq('id', userId)
    .select()
    .maybeSingle();
  if (error) {
    if (isMissingEntraOidColumn(error)) {
      markEntraOidColumnMissing();
      delete patch.entra_oid;
      return sbUpdateIdentity(userId, { ...identity, entraOid: '' });
    }
    // Unique violation on username: a duplicate row still holds that login id
    // (see docs/db/003_merge_duplicate_user_master_rows.sql). Keep the current
    // username rather than failing the login.
    if (error.code === '23505' && patch.username) {
      console.warn(`[users-store] username "${patch.username}" already taken by another row; keeping the existing value for user ${userId}.`);
      const { username, ...rest } = identity;
      return sbUpdateIdentity(userId, rest);
    }
    throw error;
  }
  return data ? normalizeRow(data) : null;
}

async function sbListUsers() {
  const { data, error } = await supabase
    .from('user_master')
    .select('*')
    .order('id');
  if (error) throw error;
  return (data || []).map(normalizeRow);
}

async function sbCreateUser(email, identity = {}) {
  const target = email.trim().toLowerCase();
  // 先に件数確認して最初のユーザーは admin にする
  const { count } = await supabase
    .from('user_master')
    .select('id', { count: 'exact', head: true });
  const isFirst = count === 0;
  const row = {
    username: target,
    display_name: identity.displayName || '',
    role: isFirst ? 'admin' : 'user',
    allowed_departments: [],
    preferred_store: '',
    preferred_department: '',
  };
  if (identity.entraOid && !entraOidColumnMissing) row.entra_oid = identity.entraOid;
  const { data, error } = await supabase
    .from('user_master')
    .insert(row)
    .select()
    .single();
  if (error) {
    if (isMissingEntraOidColumn(error)) {
      markEntraOidColumnMissing();
      return sbCreateUser(email, { ...identity, entraOid: '' });
    }
    throw error;
  }
  return normalizeRow(data);
}

async function sbUpdatePreferences(userId, preferences) {
  // 現在の allowed_departments を取得
  const { data: current, error: fetchErr } = await supabase
    .from('user_master')
    .select('allowed_departments, preferred_department')
    .eq('id', userId)
    .maybeSingle();
  if (fetchErr) throw fetchErr;
  if (!current) return null;

  const newDept = preferences.preferredDepartment ?? current.preferred_department ?? '';
  const currentAllowed = Array.isArray(current.allowed_departments) ? current.allowed_departments : [];
  const allowedDepartments =
    currentAllowed.length === 0 && newDept ? [newDept] : currentAllowed;

  const { data, error } = await supabase
    .from('user_master')
    .update({
      display_name: preferences.displayName ?? '',
      preferred_store: preferences.preferredStore ?? '',
      preferred_department: newDept,
      allowed_departments: allowedDepartments,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return normalizeRow(data);
}

async function sbUpdateByAdmin(targetId, updates) {
  const patch = { updated_at: new Date().toISOString() };
  if (updates.role !== undefined) {
    if (!['admin', 'user'].includes(updates.role)) throw new Error(`Invalid role: ${updates.role}`);
    patch.role = updates.role;
  }
  if (updates.allowed_departments !== undefined) {
    if (!Array.isArray(updates.allowed_departments)) throw new Error('allowed_departments must be array');
    patch.allowed_departments = updates.allowed_departments.map(String);
  }
  const { data, error } = await supabase
    .from('user_master')
    .update(patch)
    .eq('id', targetId)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data ? normalizeRow(data) : null;
}

/** Supabase の行をアプリ内形式に正規化 */
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
  if (supabase) return sbFindByUsername(username);
  return jsonFindByUsername(username);
}

/** Primary account lookup: immutable Entra object id. */
export async function findUserByEntraOid(oid) {
  const target = String(oid || '').trim();
  if (!target) return null;
  if (supabase) return sbFindByEntraOid(target);
  return jsonFindByEntraOid(target);
}

/** Fallback lookup for rows created before entra_oid was persisted. */
export async function findUserByAnyUsername(usernames) {
  const targets = [...new Set((usernames || []).map((u) => String(u || '').trim().toLowerCase()).filter(Boolean))];
  if (targets.length === 0) return null;
  if (supabase) return sbFindByUsernames(targets);
  return jsonFindByUsernames(targets);
}

export async function listUsers() {
  if (supabase) return sbListUsers();
  return jsonListUsers();
}

export async function createUserFromEmail(email, identity = {}) {
  if (supabase) return sbCreateUser(email, identity);
  return jsonCreateUser(email, identity);
}

/** Sync entra_oid / username / display_name from the ID token onto an existing row. */
export async function updateUserIdentity(userId, identity) {
  if (supabase) return sbUpdateIdentity(userId, identity);
  return jsonUpdateIdentity(userId, identity);
}

export async function updateUserPreferences(userId, preferences) {
  if (supabase) return sbUpdatePreferences(userId, preferences);
  return jsonUpdatePreferences(userId, preferences);
}

export async function updateUserByAdmin(targetId, updates) {
  if (supabase) return sbUpdateByAdmin(targetId, updates);
  return jsonUpdateByAdmin(targetId, updates);
}
