import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import express from 'express';
import session from 'express-session';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import { Storage } from '@google-cloud/storage';
import * as XLSX from 'xlsx';
import * as entraAuth from './entra-auth.js';
import { isBcConfigured } from './bc-client.js';
import { runSync, latestSyncStatus, SYNC_TYPES } from './master-sync.js';
import {
  init as initUsersStore,
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

// --- GCS client (export retention bucket) ---
// 90日 lifecycle のバケットに xlsx を保管。バケット未設定時は保管をスキップして
// 既存の操作ログのみ記録する（後方互換）
const GCS_EXPORTS_BUCKET = process.env.GCS_EXPORTS_BUCKET || '';
const gcsBucket = GCS_EXPORTS_BUCKET ? new Storage().bucket(GCS_EXPORTS_BUCKET) : null;
const SIGNED_URL_TTL_MS = 5 * 60 * 1000;

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

/**
 * GCS に保管する xlsx のオブジェクトパスを生成する。
 * `exports/{YYYY}/{MM}/{DD}/{log_id}_{sanitized_filename}` 形式。
 * ファイル名はパス区切り文字を取り除き、安全側に倒す。
 */
function buildExportObjectPath(logId, filename) {
  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const safeName = String(filename || 'export.xlsx').replace(/[/\\]/g, '_').slice(-200);
  return `exports/${yyyy}/${mm}/${dd}/${logId}_${safeName}`;
}

// Supabase クライアントをユーザーストアに注入
initUsersStore(supabase);

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

function safeEqual(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

/**
 * Master-sync trigger auth: an admin session (manual button) OR a shared
 * X-Sync-Token header (Cloud Scheduler). The token is set via MASTER_SYNC_TOKEN
 * and injected from Secret Manager in production.
 */
function requireAdminOrSyncToken(req, res, next) {
  if (req.session?.loggedIn && req.session?.role === 'admin') return next();
  const expected = process.env.MASTER_SYNC_TOKEN || '';
  const provided = req.get('x-sync-token') || '';
  if (expected && provided && safeEqual(provided, expected)) return next();
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

    let user = await findUserByUsername(email);
    if (!user) user = await createUserFromEmail(email);

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

app.put('/api/me/preferences', requireAuth, async (req, res) => {
  const body = req.body || {};
  const updated = await updateUserPreferences(req.session.userId, {
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
  // Master-sync endpoints carry their own auth (admin session OR X-Sync-Token),
  // so Cloud Scheduler can call them without a session. The route-level
  // requireAdminOrSyncToken / requireAdmin still enforces access.
  if (req.path.startsWith('/api/admin/masters/sync/')) return next();
  return requireAuth(req, res, next);
});

// --- Admin: User Management API ---

app.get('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const users = (await listUsers()).map((u) => ({
      id: u.id,
      username: u.username,
      display_name: u.display_name || '',
      role: u.role || 'user',
      allowed_departments: u.allowed_departments || [],
      created_at: u.created_at,
      updated_at: u.updated_at,
    }));
    return res.json(users);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/users/:id', requireAdmin, async (req, res) => {
  const targetId = Number(req.params.id);
  const body = req.body || {};
  const updates = {};
  if (body.role !== undefined) updates.role = body.role;
  if (body.allowed_departments !== undefined) updates.allowed_departments = body.allowed_departments;
  try {
    const updated = await updateUserByAdmin(targetId, updates);
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

/**
 * 出力イベントを operation_log に記録し、xlsx ファイルが添付されていれば
 * GCS に保管する。multipart/form-data で受ける:
 *   - file: 出力 xlsx 本体（任意。GCS バケット未設定時は無視）
 *   - dept, itemCount, filename: テキストフィールド
 *   - items: JSON 文字列化された配列（互換のため details に保管）
 */
app.post('/api/log/export', requireAuth, upload.single('file'), async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  const dept = String(req.body?.dept || '');
  const itemCount = Number(req.body?.itemCount) || 0;
  const filename = String(req.body?.filename || '');
  let items = [];
  if (req.body?.items) {
    try { items = JSON.parse(req.body.items); }
    catch { items = []; }
  }

  let logId = null;
  try {
    const { data, error } = await supabase
      .from('operation_log')
      .insert({
        username: req.session.username || null,
        user_display_name: req.session.displayName || null,
        action: 'export',
        dept: dept || null,
        item_count: itemCount,
        filename: filename || null,
        details: { items },
      })
      .select('id')
      .single();
    if (error) throw error;
    logId = data.id;
  } catch (err) {
    console.error('POST /api/log/export insert:', err.message);
    return res.status(500).json({ error: 'log_insert_failed' });
  }

  // GCS 保管はバケットとファイルが揃っているときのみ。失敗してもログ自体は残す。
  if (gcsBucket && req.file) {
    const objectPath = buildExportObjectPath(logId, filename);
    try {
      await gcsBucket.file(objectPath).save(req.file.buffer, {
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        resumable: false,
        metadata: {
          metadata: {
            logId: String(logId),
            originalFilename: filename,
            uploadedBy: req.session.username || '',
          },
        },
      });
      const { error: updErr } = await supabase
        .from('operation_log')
        .update({ storage_path: objectPath })
        .eq('id', logId);
      if (updErr) throw updErr;
    } catch (err) {
      console.error('POST /api/log/export gcs upload:', err.message);
      // storage_path 未設定のままログだけ残る → 後方互換と同じ扱い
    }
  }

  return res.json({ ok: true, logId });
});

app.get('/api/admin/logs', requireAdmin, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  try {
    const { data, error } = await supabase
      .from('operation_log')
      .select('id, created_at, username, user_display_name, action, dept, item_count, filename, storage_path')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    return res.json(data || []);
  } catch (err) {
    console.error('GET /api/admin/logs:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * 操作ログから保管済み xlsx を再ダウンロードする。
 * V4 signed URL を5分有効で発行し、302 リダイレクトする。
 * 保管対象外（過去ログ等）や 90日経過で物理削除済みの場合は 404 を返す。
 */
app.get('/api/admin/logs/:id/download', requireAdmin, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  if (!gcsBucket) return res.status(503).json({ error: 'storage_not_configured' });
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'invalid_id' });
  try {
    const { data, error } = await supabase
      .from('operation_log')
      .select('id, filename, storage_path')
      .eq('id', id)
      .single();
    if (error || !data) return res.status(404).json({ error: 'log_not_found' });
    if (!data.storage_path) return res.status(404).json({ error: 'file_not_retained' });

    const file = gcsBucket.file(data.storage_path);
    const [exists] = await file.exists();
    if (!exists) return res.status(404).json({ error: 'file_expired' });

    const downloadName = String(data.filename || 'export.xlsx').replace(/[/\\"]/g, '_');
    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + SIGNED_URL_TTL_MS,
      responseDisposition: `attachment; filename="${downloadName}"`,
    });
    return res.redirect(signedUrl);
  } catch (err) {
    console.error('GET /api/admin/logs/:id/download:', err);
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

// --- Master Auto-Sync from LS-Central (Business Central) ---

/**
 * Trigger a master sync from LS-Central. Used by both the admin "sync now"
 * button (admin session) and Cloud Scheduler (X-Sync-Token header):
 *   - group    -> Retail_Product_Groups_Excel -> group_master   (scheduled daily)
 *   - supplier -> Retail_Vendor_Card_Excel    -> supplier_master (scheduled hourly)
 */
app.post('/api/admin/masters/sync/:type', requireAdminOrSyncToken, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  const type = String(req.params.type || '');
  if (!SYNC_TYPES.includes(type)) return res.status(400).json({ error: 'invalid_type' });
  if (!isBcConfigured()) return res.status(503).json({ error: 'bc_not_configured' });
  try {
    const triggeredBy = req.session?.username || 'scheduler';
    const dryRun = req.query.dryRun === '1' || req.query.dryRun === 'true';
    const result = await runSync(type, supabase, { triggeredBy, dryRun });
    return res.json(result);
  } catch (err) {
    console.error(`POST /api/admin/masters/sync/${type}:`, err.message);
    return res.status(500).json({ error: err.message });
  }
});

/** Latest sync result per master type, for the admin UI. */
app.get('/api/admin/masters/sync/status', requireAdmin, async (_req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  try {
    const status = await latestSyncStatus(supabase);
    return res.json({ bcConfigured: isBcConfigured(), status });
  } catch (err) {
    console.error('GET /api/admin/masters/sync/status:', err.message);
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
