import fs from 'node:fs';
import path from 'node:path';

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
  const users = Array.isArray(parsed.users) ? parsed.users : [];
  return { users };
}

function writeStore(data) {
  ensureStoreFile();
  fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

export function findUserByUsername(username) {
  const target = String(username || '').trim().toLowerCase();
  if (!target) return null;
  const { users } = readStore();
  return users.find((u) => String(u.username || '').toLowerCase() === target) || null;
}

export function listUsers() {
  const { users } = readStore();
  return users;
}

export function createUserFromEmail(email) {
  const target = String(email || '').trim().toLowerCase();
  if (!target) throw new Error('email is required');
  const existing = findUserByUsername(target);
  if (existing) return existing;
  const data = readStore();
  const nextId = data.users.reduce((max, u) => Math.max(max, Number(u.id) || 0), 0) + 1;
  const isFirst = data.users.length === 0;
  const now = new Date().toISOString();
  const user = {
    id: nextId,
    username: target,
    display_name: '',
    role: isFirst ? 'admin' : 'user', // 最初のユーザーは自動的に管理者
    allowed_departments: [],           // 許可部門コードの配列（空 = すべて不可、adminは無視）
    preferred_store: '',
    preferred_department: '',
    created_at: now,
    updated_at: now,
  };
  data.users.push(user);
  writeStore(data);
  return user;
}

export function updateUserPreferences(userId, preferences = {}) {
  const data = readStore();
  const idx = data.users.findIndex((u) => Number(u.id) === Number(userId));
  if (idx < 0) return null;
  const current = data.users[idx];
  const newDept = preferences.preferredDepartment ?? current.preferred_department ?? '';
  // 許可部門が未設定の場合は preferredDepartment を自動的に許可部門に追加する
  const currentAllowed = Array.isArray(current.allowed_departments) ? current.allowed_departments : [];
  const allowedDepartments =
    currentAllowed.length === 0 && newDept
      ? [newDept]
      : currentAllowed;
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

/**
 * 管理者がユーザーのロール・許可部門を更新する
 * @param {number} targetUserId
 * @param {{ role?: string, allowed_departments?: string[] }} updates
 */
export function updateUserByAdmin(targetUserId, updates = {}) {
  const data = readStore();
  const idx = data.users.findIndex((u) => Number(u.id) === Number(targetUserId));
  if (idx < 0) return null;
  const current = data.users[idx];
  const updated = { ...current };
  if (updates.role !== undefined) {
    const valid = ['admin', 'user'];
    if (!valid.includes(updates.role)) throw new Error(`Invalid role: ${updates.role}`);
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
