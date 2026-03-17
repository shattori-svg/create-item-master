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

async function sbFindByUsername(username) {
  const { data, error } = await supabase
    .from('user_master')
    .select('*')
    .eq('username', username.toLowerCase())
    .maybeSingle();
  if (error) throw error;
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

async function sbCreateUser(email) {
  const target = email.trim().toLowerCase();
  // 先に件数確認して最初のユーザーは admin にする
  const { count } = await supabase
    .from('user_master')
    .select('id', { count: 'exact', head: true });
  const isFirst = count === 0;
  const { data, error } = await supabase
    .from('user_master')
    .insert({
      username: target,
      display_name: '',
      role: isFirst ? 'admin' : 'user',
      allowed_departments: [],
      preferred_store: '',
      preferred_department: '',
    })
    .select()
    .single();
  if (error) throw error;
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

function jsonListUsers() {
  return readStore().users;
}

function jsonCreateUser(email) {
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
    display_name: '',
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

export async function listUsers() {
  if (supabase) return sbListUsers();
  return jsonListUsers();
}

export async function createUserFromEmail(email) {
  if (supabase) return sbCreateUser(email);
  return jsonCreateUser(email);
}

export async function updateUserPreferences(userId, preferences) {
  if (supabase) return sbUpdatePreferences(userId, preferences);
  return jsonUpdatePreferences(userId, preferences);
}

export async function updateUserByAdmin(targetId, updates) {
  if (supabase) return sbUpdateByAdmin(targetId, updates);
  return jsonUpdateByAdmin(targetId, updates);
}
