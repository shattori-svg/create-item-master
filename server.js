import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import session from 'express-session';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import * as entraAuth from './entra-auth.js';
import {
  createUserFromEmail,
  findUserByUsername,
  listUsers,
  updateUserPreferences,
  updateUserByAdmin,
} from './users-store.js';

// --- Supabase client (service role for server-side writes) ---
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const app = express();
const PORT = Number(process.env.PORT || 8080);
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-session-secret-change-me';
const EXTERNAL_AUTH_MODE = entraAuth.isEntraConfigured();
const distDir = path.resolve(process.cwd(), 'dist');

app.set('trust proxy', 1);
app.use(express.json());
app.use(session({
  name: 'item_import_sid',
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000,
  },
}));

function sessionUser(req) {
  return {
    loggedIn: Boolean(req.session.loggedIn),
    role: req.session.role || '',
    userId: req.session.userId || null,
    username: req.session.username || '',
    displayName: req.session.displayName || '',
    preferredStore: req.session.preferredStore || '',
    preferredDepartment: req.session.preferredDepartment || '',
    allowedDepartments: req.session.allowedDepartments || [],
    externalAuth: EXTERNAL_AUTH_MODE,
    needsProfileSetup: Boolean(req.session.needsProfileSetup),
  };
}

function requireAuth(req, res, next) {
  if (req.session?.loggedIn) return next();
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  return res.redirect('/login');
}

function requireAdmin(req, res, next) {
  if (req.session?.loggedIn && req.session?.role === 'admin') return next();
  return res.status(403).json({ error: 'forbidden' });
}

/**
 * 部門コードに対してユーザーが操作権限を持つか確認する。
 * admin ロールはすべての部門を操作可能。
 * user ロールは allowed_departments に含まれる部門のみ。
 */
function canAccessDept(req, dept) {
  if (req.session.role === 'admin') return true;
  const allowed = req.session.allowedDepartments || [];
  return allowed.includes(String(dept));
}

app.get('/healthz', (_req, res) => {
  res.json({ ok: true, externalAuth: EXTERNAL_AUTH_MODE });
});

app.get('/config.js', (_req, res) => {
  // APIキーはサーバー側プロキシ経由で使用するため、クライアントには渡さない
  res.type('application/javascript');
  res.send('window.__APP_CONFIG__ = {};');
});

app.get('/login', (req, res) => {
  if (!EXTERNAL_AUTH_MODE) {
    return res.status(503).send('Entra ID auth is not configured.');
  }
  try {
    const { url } = entraAuth.getAuthorizationUrl();
    return res.redirect(url);
  } catch (err) {
    return res.status(500).send(`Failed to initialize login: ${err.message}`);
  }
});

app.get('/auth/callback', async (req, res) => {
  if (!EXTERNAL_AUTH_MODE) return res.status(503).send('Entra ID auth is not configured.');
  try {
    const code = String(req.query.code || '').trim();
    const state = String(req.query.state || '').trim();
    if (!code || !state) return res.status(400).send('Missing code/state');
    const statePayload = entraAuth.verifySignedState(state);
    if (!statePayload) return res.status(400).send('Invalid or expired state');

    const tokenResponse = await entraAuth.exchangeCodeForTokens(code);
    const payload = await entraAuth.validateIdToken(tokenResponse.id_token);
    const email = entraAuth.getEmailFromPayload(payload);
    if (!email) return res.status(401).send('Email claim is missing');
    if (!entraAuth.isAllowedEmail(email)) return res.status(403).send('This account is not allowed');

    let user = findUserByUsername(email);
    if (!user) user = createUserFromEmail(email);

    req.session.loggedIn = true;
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.displayName = user.display_name || '';
    req.session.role = user.role || 'user';
    req.session.allowedDepartments = Array.isArray(user.allowed_departments) ? user.allowed_departments : [];
    req.session.preferredStore = user.preferred_store || '';
    req.session.preferredDepartment = user.preferred_department || '';
    req.session.needsProfileSetup = !(user.preferred_store && user.preferred_department);

    return res.redirect('/');
  } catch (err) {
    return res.status(500).send(`Authentication failed: ${err.message}`);
  }
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

app.get('/api/auth/status', (req, res) => {
  res.json(sessionUser(req));
});

app.put('/api/me/preferences', requireAuth, (req, res) => {
  const body = req.body || {};
  const updated = updateUserPreferences(req.session.userId, {
    displayName: body.displayName ?? req.session.displayName ?? '',
    preferredStore: body.preferredStore ?? req.session.preferredStore ?? '',
    preferredDepartment: body.preferredDepartment ?? req.session.preferredDepartment ?? '',
  });
  if (!updated) return res.status(404).json({ error: 'user_not_found' });
  req.session.displayName = updated.display_name || '';
  req.session.preferredStore = updated.preferred_store || '';
  req.session.preferredDepartment = updated.preferred_department || '';
  req.session.allowedDepartments = Array.isArray(updated.allowed_departments) ? updated.allowed_departments : [];
  req.session.needsProfileSetup = !(updated.preferred_store && updated.preferred_department);
  return res.json({
    ok: true,
    needsProfileSetup: req.session.needsProfileSetup,
    allowedDepartments: req.session.allowedDepartments,
    preferredDepartment: req.session.preferredDepartment,
  });
});

// Protect all app/API paths except auth entrypoints.
app.use((req, res, next) => {
  const publicPaths = ['/login', '/auth/callback', '/logout', '/healthz', '/config.js'];
  if (publicPaths.includes(req.path)) return next();
  return requireAuth(req, res, next);
});

// --- Admin: User Management API ---

app.get('/api/admin/users', requireAdmin, (req, res) => {
  const users = listUsers().map((u) => ({
    id: u.id,
    username: u.username,
    display_name: u.display_name || '',
    role: u.role || 'user',
    allowed_departments: u.allowed_departments || [],
    created_at: u.created_at,
    updated_at: u.updated_at,
  }));
  return res.json(users);
});

app.put('/api/admin/users/:id', requireAdmin, (req, res) => {
  const targetId = Number(req.params.id);
  const body = req.body || {};
  const updates = {};
  if (body.role !== undefined) updates.role = body.role;
  if (body.allowed_departments !== undefined) updates.allowed_departments = body.allowed_departments;
  try {
    const updated = updateUserByAdmin(targetId, updates);
    if (!updated) return res.status(404).json({ error: 'user_not_found' });
    return res.json({ ok: true, user: updated });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// --- Masters API ---

/**
 * Excelの行オブジェクトから、列名を正規化してマッチングする。
 * 全角/半角括弧、前後スペース、大文字小文字の違いを吸収する。
 */
function findCol(row, ...candidates) {
  const keys = Object.keys(row);
  for (const candidate of candidates) {
    // まず完全一致
    if (row[candidate] !== undefined) return String(row[candidate]);
    // 正規化して一致検索
    const norm = (s) => s.trim().toLowerCase().replace(/[（）\s]/g, (c) => /\s/.test(c) ? ' ' : c === '（' ? '(' : ')').replace(/\s+/g, ' ');
    const normCandidate = norm(candidate);
    const found = keys.find((k) => norm(k) === normCandidate);
    if (found !== undefined) return String(row[found]);
  }
  return '';
}

/** 部門コードから部門digit（分類用: 先頭1文字）を取得 */
function deptDigitGroup(dept) {
  return String(dept || '').replace(/^0+/, '') || '0';
}

/** ファイル内レコードが対象部門のどれに属するかを判定して返す */
function getGroupDeptFromCode(code) {
  // product_group_code の先頭1文字が部門digit
  const digit = String(code || '')[0] || '';
  // 部門コード一覧との対応（digit "1"→"01", "2"→"02", etc.）
  return digit ? digit.padStart(2, '0') : null;
}

function getSupplierDeptFromNo(supplierNo) {
  // supplier_no の2文字目が部門digit
  const digit = String(supplierNo || '')[1] || '';
  return digit ? digit.padStart(2, '0') : null;
}

app.get('/api/masters/groups', requireAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  const dept = String(req.query.dept || '');
  try {
    const digit = deptDigitGroup(dept);
    const { data, error } = await supabase
      .from('group_master')
      .select('product_group_code, description, description_tha, description_jpn')
      .like('product_group_code', `${digit}%`)
      .order('product_group_code');
    if (error) throw error;
    const rows = (data || []).map((r) => ({
      productGroupCode: r.product_group_code,
      description: r.description || '',
      descriptionTha: r.description_tha || '',
      descriptionJpn: r.description_jpn || '',
    }));
    return res.json(rows);
  } catch (err) {
    console.error('GET /api/masters/groups:', err);
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/masters/suppliers', requireAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  const dept = String(req.query.dept || '');
  try {
    const digit = deptDigitGroup(dept);
    const { data, error } = await supabase
      .from('supplier_master')
      .select('supplier_no, abbreviation, name_eng, name_tha')
      .like('supplier_no', `_${digit}%`)
      .order('supplier_no');
    if (error) throw error;
    const rows = (data || []).map((r) => ({
      supplierNo: r.supplier_no,
      abbreviation: r.abbreviation || '',
      nameEng: r.name_eng || '',
      nameTha: r.name_tha || '',
    }));
    return res.json(rows);
  } catch (err) {
    console.error('GET /api/masters/suppliers:', err);
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/masters/groups/import', requireAuth, upload.single('file'), async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
    if (rows.length > 0) console.log('[groups import] columns:', Object.keys(rows[0]));
    const records = rows
      .map((r) => ({
        product_group_code: findCol(r, 'Product Group Code').trim(),
        description: findCol(r, 'Description').trim(),
        description_tha: findCol(r, 'Description (THA)', 'Description（THA）').trim(),
        description_jpn: findCol(r, 'Description (JPN)', 'Description（JPN）').trim(),
      }))
      .filter((r) => r.product_group_code);
    // 同一コードの重複を除去（後勝ち）
    const uniqueRecords = [...new Map(records.map((r) => [r.product_group_code, r])).values()];
    if (uniqueRecords.length === 0) return res.status(400).json({ error: 'No valid rows found' });

    // 部門権限チェック: レコード内の部門がすべて許可されているか確認
    if (req.session.role !== 'admin') {
      const unauthorized = records.find((r) => {
        const dept = getGroupDeptFromCode(r.product_group_code);
        return !dept || !canAccessDept(req, dept);
      });
      if (unauthorized) {
        return res.status(403).json({
          error: `部門 ${getGroupDeptFromCode(unauthorized.product_group_code)} へのアクセス権限がありません`,
        });
      }
    }

    const { error } = await supabase
      .from('group_master')
      .upsert(uniqueRecords, { onConflict: 'product_group_code' });
    if (error) throw error;
    return res.json({ ok: true, count: uniqueRecords.length });
  } catch (err) {
    console.error('POST /api/masters/groups/import:', err);
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/masters/suppliers/import', requireAuth, upload.single('file'), async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
    if (rows.length > 0) console.log('[suppliers import] columns:', Object.keys(rows[0]));
    const records = rows
      .map((r) => ({
        supplier_no: findCol(r, 'Supplier No.', 'Supplier No').trim(),
        abbreviation: findCol(r, 'Abbreviation').trim(),
        name_eng: findCol(r, 'Supplier Official Name (English)', 'Supplier Official Name (English）').trim(),
        name_tha: findCol(r, 'Supplier Official Name (Thai)', 'Supplier Official Name (Thai）').trim(),
      }))
      .filter((r) => r.supplier_no);
    // 同一コードの重複を除去（後勝ち）
    const uniqueRecords = [...new Map(records.map((r) => [r.supplier_no, r])).values()];
    if (uniqueRecords.length === 0) return res.status(400).json({ error: 'No valid rows found' });

    // 部門権限チェック
    if (req.session.role !== 'admin') {
      const unauthorized = records.find((r) => {
        const dept = getSupplierDeptFromNo(r.supplier_no);
        return !dept || !canAccessDept(req, dept);
      });
      if (unauthorized) {
        return res.status(403).json({
          error: `部門 ${getSupplierDeptFromNo(unauthorized.supplier_no)} へのアクセス権限がありません`,
        });
      }
    }

    const { error } = await supabase
      .from('supplier_master')
      .upsert(uniqueRecords, { onConflict: 'supplier_no' });
    if (error) throw error;
    return res.json({ ok: true, count: uniqueRecords.length });
  } catch (err) {
    console.error('POST /api/masters/suppliers/import:', err);
    return res.status(500).json({ error: err.message });
  }
});

// --- Operation Log ---

async function logOperation(req, { action, dept, itemCount, filename, details }) {
  if (!supabase) return;
  try {
    await supabase.from('operation_log').insert({
      username: req.session.username || null,
      user_display_name: req.session.displayName || null,
      action,
      dept: dept || null,
      item_count: itemCount ?? null,
      filename: filename || null,
      details: details || null,
    });
  } catch (err) {
    console.error('logOperation failed:', err.message);
  }
}

app.post('/api/log/export', requireAuth, async (req, res) => {
  const { dept, itemCount, filename, items: exportItems } = req.body || {};
  await logOperation(req, {
    action: 'export',
    dept: String(dept || ''),
    itemCount: Number(itemCount) || 0,
    filename: String(filename || ''),
    details: { items: exportItems || [] },
  });
  return res.json({ ok: true });
});

app.get('/api/admin/logs', requireAdmin, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  try {
    const { data, error } = await supabase
      .from('operation_log')
      .select('id, created_at, username, user_display_name, action, dept, item_count, filename')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    return res.json(data || []);
  } catch (err) {
    console.error('GET /api/admin/logs:', err);
    return res.status(500).json({ error: err.message });
  }
});

// --- Master Export ---

app.get('/api/masters/groups/export', requireAdmin, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  try {
    const { data, error } = await supabase
      .from('group_master')
      .select('product_group_code, description, description_tha, description_jpn')
      .order('product_group_code');
    if (error) throw error;
    const rows = (data || []).map((r) => ({
      'Product Group Code': r.product_group_code,
      'Description': r.description || '',
      'Description (THA)': r.description_tha || '',
      'Description (JPN)': r.description_jpn || '',
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'group_master');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="group_master.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buf);
  } catch (err) {
    console.error('GET /api/masters/groups/export:', err);
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/masters/suppliers/export', requireAdmin, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  try {
    const { data, error } = await supabase
      .from('supplier_master')
      .select('supplier_no, abbreviation, name_eng, name_tha')
      .order('supplier_no');
    if (error) throw error;
    const rows = (data || []).map((r) => ({
      'Supplier No.': r.supplier_no,
      'Abbreviation': r.abbreviation || '',
      'Supplier Official Name (English)': r.name_eng || '',
      'Supplier Official Name (Thai)': r.name_tha || '',
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'supplier_master');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="supplier_master.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buf);
  } catch (err) {
    console.error('GET /api/masters/suppliers/export:', err);
    return res.status(500).json({ error: err.message });
  }
});

// --- Store Master ---

app.get('/api/masters/stores', requireAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  try {
    const { data, error } = await supabase
      .from('store_master')
      .select('store_code, store_name, store_name_eng')
      .eq('active', true)
      .order('store_code');
    if (error) throw error;
    return res.json(data || []);
  } catch (err) {
    console.error('GET /api/masters/stores:', err);
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/masters/stores/import', requireAdmin, upload.single('file'), async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
    const records = rows
      .map((r) => ({
        store_code: String(r['Store Code'] || r['store_code'] || '').trim(),
        store_name: String(r['Store Name'] || r['store_name'] || '').trim(),
        store_name_eng: String(r['Store Name (English)'] || r['store_name_eng'] || '').trim(),
        active: r['active'] !== false && r['active'] !== 0 && r['active'] !== 'false',
      }))
      .filter((r) => r.store_code);
    const unique = [...new Map(records.map((r) => [r.store_code, r])).values()];
    const { error } = await supabase
      .from('store_master')
      .upsert(unique, { onConflict: 'store_code' });
    if (error) throw error;
    return res.json({ count: unique.length });
  } catch (err) {
    console.error('POST /api/masters/stores/import:', err);
    return res.status(500).json({ error: err.message });
  }
});

// --- AI Suggest Proxy ---
app.post('/api/ai-suggest', requireAuth, async (req, res) => {
  const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || '';
  if (!GEMINI_API_KEY) return res.status(503).json({ error: 'AI not configured' });
  const { prompt } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'prompt required' });
  try {
    const apiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );
    if (!apiRes.ok) {
      const errBody = await apiRes.text();
      return res.status(502).json({ error: `Gemini API error: ${apiRes.status}`, detail: errBody });
    }
    const data = await apiRes.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return res.json({ text });
  } catch (err) {
    console.error('POST /api/ai-suggest:', err);
    return res.status(500).json({ error: err.message });
  }
});

if (fs.existsSync(distDir)) {
  app.use('/assets', express.static(path.join(distDir, 'assets'), { immutable: true, maxAge: '1y' }));
  app.use(express.static(distDir));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
} else {
  app.get('*', (_req, res) => {
    res.status(500).send('dist/ not found. Run "npm run build" first.');
  });
}

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server started on :${PORT} (externalAuth=${EXTERNAL_AUTH_MODE})`);
});
