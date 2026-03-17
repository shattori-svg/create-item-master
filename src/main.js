/**
 * 商品登録 取り込みファイル作成システム - メイン
 * 基本設計書・要件定義書に基づく Phase1 実装
 */
import { initI18n, setLanguage, t, getLang } from './lib/i18n.js';
import { DEPARTMENTS } from './data/departments.js';
import { PRODUCT_TYPES, PRODUCT_TYPE_MANUFACTURER, PRODUCT_TYPE_SCALE, PRODUCT_TYPE_RAW_MATERIAL } from './data/productType.js';
import { MAX_ITEMS, DEFAULT_SPEC_ENG, DEFAULT_SALES_QTY, DEFAULT_TAX_RATE, DEFAULT_LEAD_TIME, IMPORT_PAGE_URL } from './data/constants.js';
import { setGroupMaster, setSupplierMaster, getGroupMasterForDepartment, getSupplierMasterForDepartment, filterGroup, filterSupplier, suggestGroupByProductName } from './data/masters.js';
import { suggestClassificationWithGenAI, hasGenAIConfig } from './lib/genaiSuggest.js';
import { fetchMastersFromApi, clearMastersCache } from './lib/mastersApi.js';
import { validateFormFields, validateForExport } from './lib/validation.js';
import { exportXlsx, parseItemSheet } from './lib/excel.js';

// --- State ---
const STORAGE_KEY_ITEMS = 'item_import_items_v1';

function saveItemsToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items));
  } catch {
    // ignore
  }
}

function loadItemsFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ITEMS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

let items = loadItemsFromStorage();
let selectedDepartment = '01';
let selectedProductType = PRODUCT_TYPE_MANUFACTURER;
let editingIndex = -1;
let currentAuthStatus = null;

// --- Undo/Redo ---
const MAX_HISTORY = 30;
let undoStack = [];
let redoStack = [];

function saveToHistory() {
  undoStack.push(JSON.stringify(items));
  if (undoStack.length > MAX_HISTORY) undoStack.shift();
  redoStack = [];
  updateHistoryButtons();
}

function updateHistoryButtons() {
  if (el.btnUndo) el.btnUndo.disabled = undoStack.length === 0;
  if (el.btnRedo) el.btnRedo.disabled = redoStack.length === 0;
}

function undo() {
  if (undoStack.length === 0) return;
  redoStack.push(JSON.stringify(items));
  items = JSON.parse(undoStack.pop());
  saveItemsToStorage();
  editingIndex = -1;
  renderTable();
  updateExportButtonState();
  updateHistoryButtons();
}

function redo() {
  if (redoStack.length === 0) return;
  undoStack.push(JSON.stringify(items));
  items = JSON.parse(redoStack.pop());
  saveItemsToStorage();
  editingIndex = -1;
  renderTable();
  updateExportButtonState();
  updateHistoryButtons();
}

// インポートモード用一時保存
let pendingImportItems = null;

// --- DOM ---
const el = {
  department: document.getElementById('department'),
  departmentWarn: document.getElementById('department-warn'),
  productType: document.getElementById('productType'),
  productTypeWarn: document.getElementById('product-type-warn'),
  authUser: document.getElementById('auth-user'),
  btnLogout: document.getElementById('btn-logout'),
  form: document.getElementById('item-form'),
  productGroup: document.getElementById('productGroup'),
  productGroupCode: document.getElementById('productGroupCode'),
  productGroupList: document.getElementById('productGroup-list'),
  barcode: document.getElementById('barcode'),
  nameEng: document.getElementById('nameEng'),
  nameTha: document.getElementById('nameTha'),
  sizeEng: document.getElementById('sizeEng'),
  sizeTha: document.getElementById('sizeTha'),
  taxRate: document.getElementById('taxRate'),
  manufacturingLocation: document.getElementById('manufacturingLocation'),
  supplier: document.getElementById('supplier'),
  supplierCode: document.getElementById('supplierCode'),
  supplierList: document.getElementById('supplier-list'),
  unitCost: document.getElementById('unitCost'),
  orderQty: document.getElementById('orderQty'),
  orderUnit: document.getElementById('orderUnit'),
  leadTime: document.getElementById('leadTime'),
  unitPrice: document.getElementById('unitPrice'),
  salesQty: document.getElementById('salesQty'),
  caseFields: document.getElementById('case-fields'),
  caseBarcode: document.getElementById('caseBarcode'),
  caseName: document.getElementById('caseName'),
  caseSizeEng: document.getElementById('caseSizeEng'),
  caseSizeTha: document.getElementById('caseSizeTha'),
  casePrice: document.getElementById('casePrice'),
  brandEng: document.getElementById('brandEng'),
  brandTha: document.getElementById('brandTha'),
  pluNo: document.getElementById('pluNo'),
  tbody: document.getElementById('item-tbody'),
  theadRow: document.getElementById('item-thead-row'),
  outSecond: document.getElementById('out-second'),
  outSecondLabel: document.getElementById('out-second-label'),
  outSecondWrap: document.getElementById('out-second-wrap'),
  btnDeleteAll: document.getElementById('btn-delete-all'),
  listMaxWarn: document.getElementById('list-max-warn'),
  outItem: document.getElementById('out-item'),
  outAdditional: document.getElementById('out-additional'),
  outputFilename: document.getElementById('outputFilename'),
  btnExport: document.getElementById('btn-export'),
  btnImport: document.getElementById('btn-import'),
  fileImport: document.getElementById('file-import'),
  exportSuccessModal: document.getElementById('export-success-modal'),
  btnGotoImport: document.getElementById('btn-goto-import'),
  btnCloseExportModal: document.getElementById('btn-close-export-modal'),
  exportErrors: document.getElementById('export-errors'),
  btnClear: document.getElementById('btn-clear'),
  btnAdd: document.getElementById('btn-add'),
  masterStatus: document.getElementById('master-status'),
  profileSetupModal: document.getElementById('profile-setup-modal'),
  profileStore: document.getElementById('profile-store'),
  profileDept: document.getElementById('profile-dept'),
  profileError: document.getElementById('profile-error'),
  btnProfileSave: document.getElementById('btn-profile-save'),
  btnAdmin: document.getElementById('btn-admin'),
  adminModal: document.getElementById('admin-modal'),
  adminUserTbody: document.getElementById('admin-user-tbody'),
  adminError: document.getElementById('admin-error'),
  btnCloseAdminModal: document.getElementById('btn-close-admin-modal'),
  adminTabs: document.querySelectorAll('.admin-tab'),
  adminTabUsers: document.getElementById('admin-tab-users'),
  adminTabMasters: document.getElementById('admin-tab-masters'),
  adminTabLogs: document.getElementById('admin-tab-logs'),
  adminLogsContent: document.getElementById('admin-logs-content'),
  btnUndo: document.getElementById('btn-undo'),
  btnRedo: document.getElementById('btn-redo'),
  importModeModal: document.getElementById('import-mode-modal'),
  importModeDesc: document.getElementById('import-mode-desc'),
  btnImportReplace: document.getElementById('btn-import-replace'),
  btnImportMerge: document.getElementById('btn-import-merge'),
  btnCancelImportMode: document.getElementById('btn-cancel-import-mode'),
  sessionExpiredModal: document.getElementById('session-expired-modal'),
  btnSessionReload: document.getElementById('btn-session-reload'),
  inputGroupFile: document.getElementById('input-group-file'),
  btnGroupImport: document.getElementById('btn-group-import'),
  groupImportStatus: document.getElementById('group-import-status'),
  inputSupplierFile: document.getElementById('input-supplier-file'),
  btnSupplierImport: document.getElementById('btn-supplier-import'),
  supplierImportStatus: document.getElementById('supplier-import-status'),
  btnSuggestClassification: document.getElementById('btn-suggest-classification'),
  suggestSourceMsg: document.getElementById('suggest-source-msg'),
  numpad: document.getElementById('numpad'),
  tableOrderCol: document.getElementById('table-order-col'),
};

const errorIds = {
  productGroup: 'err-productGroup',
  barcode: 'err-barcode',
  nameEng: 'err-nameEng',
  nameTha: 'err-nameTha',
  supplier: 'err-supplier',
  orderUnit: 'err-orderUnit',
  unitCost: 'err-unitCost',
  orderQty: 'err-orderQty',
  unitPrice: 'err-unitPrice',
  salesQty: 'err-salesQty',
  pluNo: 'err-pluNo',
  caseBarcode: 'err-caseBarcode',
  casePrice: 'err-casePrice',
};

// --- I18n ---
async function init() {
  await initI18n();
  setLanguage('ja');
  const authOk = await ensureAuthenticated();
  if (!authOk) return;
  function refreshDepartmentOptions() {
  const lang = getLang();
  Array.from(el.department.options).forEach((opt) => {
    const d = DEPARTMENTS.find((x) => x.code === opt.value);
    if (d) {
      const name = lang === 'ja' ? (d.nameJa ?? d.nameTh) : (d.nameTh ?? d.nameJa);
      opt.textContent = `${d.code} ${name}`;
    }
  });
}
  function refreshProductTypeOptions() {
  const lang = getLang();
  Array.from(el.productType.options).forEach((opt) => {
    const pt = PRODUCT_TYPES.find((x) => x.value === opt.value);
    if (pt) opt.textContent = lang === 'ja' ? (pt.nameJa ?? pt.nameTh) : (pt.nameTh ?? pt.nameJa);
  });
}
  document.getElementById('btn-lang-ja').addEventListener('click', () => { setLanguage('ja'); refreshDepartmentOptions(); refreshProductTypeOptions(); applyProductTypeVisibility(); document.querySelectorAll('.lang-btn').forEach((b) => b.classList.remove('active')); document.getElementById('btn-lang-ja').classList.add('active'); });
  document.getElementById('btn-lang-th').addEventListener('click', () => { setLanguage('th'); refreshDepartmentOptions(); refreshProductTypeOptions(); applyProductTypeVisibility(); document.querySelectorAll('.lang-btn').forEach((b) => b.classList.remove('active')); document.getElementById('btn-lang-th').classList.add('active'); });

  fillDepartmentSelect();
  await loadMastersFromApi();
  fillProductTypeSelect();
  applyProductTypeVisibility();
  setDefaultFormValues();
  if (el.outputFilename) el.outputFilename.value = '';
  toggleCaseFields(Number(el.salesQty?.value || 1) >= 2);
  bindForm();
  bindFocusSelectAll();
  bindRequiredFeedback();
  bindClearButton();
  bindSalesQtyToggle();
  bindComboProductGroup();
  bindComboSupplier();
  bindDepartmentChange();
  bindProductTypeChange();
  bindTable();
  bindOutput();
  bindNumpad();
  bindAuth();
  renderTable();
  updateRequiredFeedback();
  updateExportButtonState();
  updateHistoryButtons();
  startSessionPolling();
}

async function ensureAuthenticated() {
  try {
    const res = await fetch('/api/auth/status', { credentials: 'include' });
    if (!res.ok) return true;
    const status = await res.json();
    applyAuthStatus(status);
    if (status.externalAuth && !status.loggedIn) {
      window.location.href = '/login';
      return false;
    }
    if (status.loggedIn && status.needsProfileSetup) {
      await setupInitialProfile(status);
    }
  } catch {
    // Dev mode without auth server.
  }
  return true;
}

function applyAuthStatus(status) {
  if (!status) return;
  currentAuthStatus = status;
  // preferredDepartment を初期選択部門に反映（許可部門外なら最初の許可部門を使用）
  if (status.preferredDepartment) {
    const allowed = status.role === 'admin' ? null : (status.allowedDepartments || []);
    if (!allowed || allowed.length === 0 || allowed.includes(status.preferredDepartment)) {
      selectedDepartment = status.preferredDepartment;
    } else {
      selectedDepartment = allowed[0];
    }
  }
  if (el.authUser) {
    el.authUser.hidden = !status.loggedIn;
    el.authUser.textContent = status.loggedIn ? (status.displayName || status.username || '') : '';
  }
  if (el.btnLogout) {
    el.btnLogout.hidden = !status.loggedIn;
  }
  if (el.btnAdmin) {
    el.btnAdmin.hidden = !(status.loggedIn && status.role === 'admin');
  }
}

function bindAuth() {
  if (el.btnLogout) {
    el.btnLogout.addEventListener('click', async () => {
      await fetch('/logout', { method: 'POST', credentials: 'include' });
      window.location.href = '/login';
    });
  }
  if (el.btnAdmin) {
    el.btnAdmin.addEventListener('click', () => openAdminModal());
  }
  if (el.btnCloseAdminModal) {
    el.btnCloseAdminModal.addEventListener('click', () => closeAdminModal());
  }
  if (el.adminModal) {
    el.adminModal.addEventListener('click', (e) => {
      if (e.target === el.adminModal) closeAdminModal();
    });
  }
  // 管理者タブ切り替え
  el.adminTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      el.adminTabs.forEach((t) => t.classList.remove('admin-tab--active'));
      tab.classList.add('admin-tab--active');
      const target = tab.dataset.tab;
      if (el.adminTabUsers) el.adminTabUsers.hidden = target !== 'users';
      if (el.adminTabMasters) el.adminTabMasters.hidden = target !== 'masters';
      if (el.adminTabLogs) el.adminTabLogs.hidden = target !== 'logs';
      if (target === 'logs') fetchAdminLogs();
    });
  });
  // マスタインポートボタン
  if (el.btnGroupImport) {
    el.btnGroupImport.addEventListener('click', () => importMasterFile('groups'));
  }
  if (el.btnSupplierImport) {
    el.btnSupplierImport.addEventListener('click', () => importMasterFile('suppliers'));
  }
  // Undo/Redo ボタン + キーボードショートカット
  if (el.btnUndo) el.btnUndo.addEventListener('click', undo);
  if (el.btnRedo) el.btnRedo.addEventListener('click', redo);
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') { e.preventDefault(); undo(); }
    if ((e.ctrlKey || e.metaKey) && ((e.shiftKey && e.key === 'z') || e.key === 'y')) { e.preventDefault(); redo(); }
  });
  // インポートモードモーダル
  if (el.btnImportReplace) {
    el.btnImportReplace.addEventListener('click', () => {
      if (pendingImportItems) applyImportReplace(pendingImportItems);
      pendingImportItems = null;
      if (el.importModeModal) el.importModeModal.hidden = true;
    });
  }
  if (el.btnImportMerge) {
    el.btnImportMerge.addEventListener('click', () => {
      if (pendingImportItems) applyImportMerge(pendingImportItems);
      pendingImportItems = null;
      if (el.importModeModal) el.importModeModal.hidden = true;
    });
  }
  if (el.btnCancelImportMode) {
    el.btnCancelImportMode.addEventListener('click', () => {
      pendingImportItems = null;
      if (el.importModeModal) el.importModeModal.hidden = true;
    });
  }
  // セッション切れモーダル
  if (el.btnSessionReload) {
    el.btnSessionReload.addEventListener('click', () => {
      window.location.href = '/login';
    });
  }
}

function closeAdminModal() {
  if (el.adminModal) el.adminModal.hidden = true;
}

async function openAdminModal() {
  if (!el.adminModal) return;
  el.adminModal.hidden = false;
  el.adminError.hidden = true;
  el.adminUserTbody.innerHTML = '<tr><td colspan="5" style="text-align:center">読み込み中…</td></tr>';
  try {
    const res = await fetch('/api/admin/users', { credentials: 'include' });
    if (!res.ok) throw new Error(`${res.status}`);
    const users = await res.json();
    renderAdminUserTable(users);
  } catch (err) {
    el.adminError.textContent = 'ユーザー一覧の取得に失敗しました: ' + err.message;
    el.adminError.hidden = false;
    el.adminUserTbody.innerHTML = '';
  }
}

function renderAdminUserTable(users) {
  const DEPT_CODES = ['01', '02', '03', '04', '05', '06'];
  const DEPT_NAMES = { '01': '食品', '02': '青果', '03': '鮮魚', '04': '精肉', '05': '総菜', '06': '店舗管理' };

  el.adminUserTbody.innerHTML = '';
  users.forEach((user) => {
    const tr = document.createElement('tr');
    tr.dataset.userId = user.id;

    // メール
    const tdEmail = document.createElement('td');
    tdEmail.textContent = user.username;
    tr.appendChild(tdEmail);

    // 表示名
    const tdName = document.createElement('td');
    tdName.textContent = user.display_name || '—';
    tr.appendChild(tdName);

    // ロール
    const tdRole = document.createElement('td');
    const roleSelect = document.createElement('select');
    roleSelect.className = 'admin-select';
    roleSelect.dataset.field = 'role';
    ['admin', 'user'].forEach((r) => {
      const opt = document.createElement('option');
      opt.value = r;
      opt.textContent = r === 'admin' ? '管理者' : '一般';
      opt.selected = user.role === r;
      roleSelect.appendChild(opt);
    });
    tdRole.appendChild(roleSelect);
    tr.appendChild(tdRole);

    // 許可部門（チェックボックス）
    const tdDepts = document.createElement('td');
    tdDepts.className = 'admin-dept-cell';
    const deptWrap = document.createElement('div');
    deptWrap.className = 'admin-dept-wrap';
    DEPT_CODES.forEach((code) => {
      const label = document.createElement('label');
      label.className = 'admin-dept-label';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.value = code;
      cb.dataset.field = 'dept';
      cb.checked = Array.isArray(user.allowed_departments) && user.allowed_departments.includes(code);
      label.appendChild(cb);
      label.appendChild(document.createTextNode(DEPT_NAMES[code] || code));
      deptWrap.appendChild(label);
    });
    tdDepts.appendChild(deptWrap);
    tr.appendChild(tdDepts);

    // 操作ボタン
    const tdActions = document.createElement('td');
    const btnSave = document.createElement('button');
    btnSave.type = 'button';
    btnSave.textContent = '保存';
    btnSave.className = 'btn-admin-save';
    btnSave.addEventListener('click', () => saveUserAdmin(tr, user.id));
    tdActions.appendChild(btnSave);
    tr.appendChild(tdActions);

    el.adminUserTbody.appendChild(tr);
  });
}

async function saveUserAdmin(tr, userId) {
  const roleSelect = tr.querySelector('select[data-field="role"]');
  const deptCheckboxes = tr.querySelectorAll('input[type="checkbox"][data-field="dept"]');
  const role = roleSelect ? roleSelect.value : undefined;
  const allowed_departments = Array.from(deptCheckboxes)
    .filter((cb) => cb.checked)
    .map((cb) => cb.value);
  try {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ role, allowed_departments }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || res.status);
    }
    const saveBtn = tr.querySelector('.btn-admin-save');
    if (saveBtn) {
      saveBtn.textContent = '✓ 保存済み';
      setTimeout(() => { saveBtn.textContent = '保存'; }, 1500);
    }
  } catch (err) {
    alert('保存に失敗しました: ' + err.message);
  }
}

async function fetchAdminLogs() {
  if (!el.adminLogsContent) return;
  el.adminLogsContent.innerHTML = '<p>読み込み中…</p>';
  try {
    const res = await fetch('/api/admin/logs', { credentials: 'include' });
    if (!res.ok) throw new Error(`${res.status}`);
    const logs = await res.json();
    if (logs.length === 0) {
      el.adminLogsContent.innerHTML = '<p>ログはありません。</p>';
      return;
    }
    const rows = logs.map((log) => {
      const date = new Date(log.created_at).toLocaleString('ja-JP');
      const user = escapeHtml(log.user_display_name || log.username || '—');
      const dept = escapeHtml(log.dept || '—');
      const count = log.item_count ?? '—';
      const filename = escapeHtml(log.filename || '—');
      return `<tr><td>${date}</td><td>${user}</td><td>${dept}</td><td>${count}</td><td>${filename}</td></tr>`;
    }).join('');
    el.adminLogsContent.innerHTML = `<table class="admin-logs-table"><thead><tr><th>日時</th><th>ユーザー</th><th>部門</th><th>件数</th><th>ファイル名</th></tr></thead><tbody>${rows}</tbody></table>`;
  } catch (err) {
    el.adminLogsContent.innerHTML = `<p class="admin-logs-error">取得失敗: ${escapeHtml(err.message)}</p>`;
  }
}

async function importMasterFile(type) {
  const isGroup = type === 'groups';
  const fileInput = isGroup ? el.inputGroupFile : el.inputSupplierFile;
  const statusEl = isGroup ? el.groupImportStatus : el.supplierImportStatus;
  const btn = isGroup ? el.btnGroupImport : el.btnSupplierImport;

  if (!fileInput || !fileInput.files.length) {
    alert('ファイルを選択してください。');
    return;
  }
  const file = fileInput.files[0];
  const formData = new FormData();
  formData.append('file', file);

  btn.disabled = true;
  btn.textContent = '処理中…';
  if (statusEl) { statusEl.hidden = true; statusEl.className = 'master-import-status'; }

  try {
    const res = await fetch(`/api/masters/${type}/import`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || res.status);
    if (statusEl) {
      statusEl.textContent = `✓ ${body.count} 件インポートしました`;
      statusEl.className = 'master-import-status master-import-status--ok';
      statusEl.hidden = false;
    }
    fileInput.value = '';
    // マスタキャッシュをクリアして再取得
    clearMastersCache();
    await loadMastersFromApi();
  } catch (err) {
    if (statusEl) {
      statusEl.textContent = 'エラー: ' + err.message;
      statusEl.className = 'master-import-status master-import-status--err';
      statusEl.hidden = false;
    }
  } finally {
    btn.disabled = false;
    btn.textContent = 'インポート';
  }
}

function setupInitialProfile(status) {
  return new Promise((resolve) => {
    // 部門ドロップダウンを構築（許可部門のみ）
    el.profileDept.innerHTML = '<option value="">-- 選択してください --</option>';
    getAllowedDepartments().forEach((d) => {
      const opt = document.createElement('option');
      opt.value = d.code;
      opt.textContent = `${d.code} ${d.nameJa}`;
      if (d.code === (status.preferredDepartment || '')) opt.selected = true;
      el.profileDept.appendChild(opt);
    });

    // 既存値をセット
    el.profileStore.value = status.preferredStore || '';
    el.profileError.hidden = true;
    el.profileSetupModal.hidden = false;
    el.profileStore.focus();

    async function save() {
      const preferredStore = el.profileStore.value.trim();
      const preferredDepartment = el.profileDept.value;
      if (!preferredStore) {
        el.profileError.textContent = '店舗コードを入力してください。';
        el.profileError.hidden = false;
        return;
      }
      if (!preferredDepartment) {
        el.profileError.textContent = '担当部門を選択してください。';
        el.profileError.hidden = false;
        return;
      }
      el.btnProfileSave.disabled = true;
      try {
        await fetch('/api/me/preferences', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ preferredStore, preferredDepartment }),
        });
        el.profileSetupModal.hidden = true;
        resolve();
      } catch {
        el.profileError.textContent = '保存に失敗しました。再度お試しください。';
        el.profileError.hidden = false;
      } finally {
        el.btnProfileSave.disabled = false;
      }
    }

    el.btnProfileSave.onclick = save;
    el.profileStore.onkeydown = (e) => { if (e.key === 'Enter') el.profileDept.focus(); };
  });
}

function getAllowedDepartments() {
  if (!currentAuthStatus || currentAuthStatus.role === 'admin') return DEPARTMENTS;
  const allowed = Array.isArray(currentAuthStatus.allowedDepartments) ? currentAuthStatus.allowedDepartments : [];
  if (allowed.length === 0) return DEPARTMENTS;
  return DEPARTMENTS.filter((d) => allowed.includes(d.code));
}

function fillDepartmentSelect() {
  const lang = getLang();
  const depts = getAllowedDepartments();
  depts.forEach((d) => {
    const opt = document.createElement('option');
    opt.value = d.code;
    const name = lang === 'ja' ? (d.nameJa ?? d.nameTh) : (d.nameTh ?? d.nameJa);
    opt.textContent = `${d.code} ${name}`;
    el.department.appendChild(opt);
  });
  // 許可部門に selectedDepartment が含まれない場合は最初の許可部門に変更
  if (depts.length > 0 && !depts.some((d) => d.code === selectedDepartment)) {
    selectedDepartment = depts[0].code;
  }
  el.department.value = selectedDepartment;
}

function fillProductTypeSelect() {
  if (!el.productType) return;
  const lang = getLang();
  el.productType.innerHTML = '';
  PRODUCT_TYPES.forEach((pt) => {
    const opt = document.createElement('option');
    opt.value = pt.value;
    opt.textContent = lang === 'ja' ? (pt.nameJa ?? pt.nameTh) : (pt.nameTh ?? pt.nameJa);
    el.productType.appendChild(opt);
  });
  el.productType.value = selectedProductType;
}

/** 商品区分に応じてブロック表示・バーコード読取専用・出力オプションラベルを切り替え */
function applyProductTypeVisibility() {
  const app = document.getElementById('app');
  const isScale = selectedProductType === PRODUCT_TYPE_SCALE;
  const isRawMaterial = selectedProductType === PRODUCT_TYPE_RAW_MATERIAL;
  const isManufacturer = selectedProductType === PRODUCT_TYPE_MANUFACTURER;
  app.classList.toggle('product-type-scale', isScale);
  app.classList.toggle('product-type-manufacturer', isManufacturer);
  app.classList.toggle('product-type-raw-material', isRawMaterial);

  document.querySelectorAll('[data-block]').forEach((node) => {
    const block = node.getAttribute('data-block');
    if (block === 'manufacturer') node.hidden = !isManufacturer;
    if (block === 'manufacturer-sales') node.hidden = !isManufacturer;
    if (block === 'scale') node.hidden = !isScale;
    if (block === 'trade') node.hidden = isScale;
    if (block === 'rawMaterial') node.hidden = !isRawMaterial;
  });

  if (el.barcode) {
    el.barcode.readOnly = isScale;
    el.barcode.classList.toggle('readonly', isScale);
  }
  if (el.outSecondWrap) el.outSecondWrap.hidden = isRawMaterial;
  if (isRawMaterial && el.outSecond) el.outSecond.checked = false;
  if (el.tableOrderCol) {
    el.tableOrderCol.textContent = isRawMaterial ? t('table.orderUnit') : t('table.orderQty');
  }
  if (el.outSecondLabel) el.outSecondLabel.textContent = isScale ? 'Ishida Label' : 'Additional Barcode';
  updateRequiredFeedback();
}

function setDefaultFormValues() {
  el.sizeEng.value = DEFAULT_SPEC_ENG;
  el.salesQty.value = String(DEFAULT_SALES_QTY);
  el.taxRate.value = String(DEFAULT_TAX_RATE);
  if (el.orderQty) el.orderQty.value = '1';
  if (el.orderUnit) el.orderUnit.value = 'PCS';
  if (el.manufacturingLocation) el.manufacturingLocation.value = 'instore';
  el.leadTime.value = String(DEFAULT_LEAD_TIME);
}

function sanitizeFilenamePart(value) {
  return String(value || '')
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, '_')
    .trim();
}

function formatDateTimeForFilename(date = new Date()) {
  const yyyy = String(date.getFullYear());
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const sec = String(date.getSeconds()).padStart(2, '0');
  return `${yyyy}${mm}${dd}_${hh}${min}${sec}`;
}

function getDepartmentNameForFilename(departmentCode) {
  const dept = DEPARTMENTS.find((d) => d.code === departmentCode);
  if (!dept) return departmentCode || 'department';
  return dept.nameEn || departmentCode;
}

function buildDefaultOutputFilename(departmentCode = selectedDepartment) {
  const name = sanitizeFilenamePart(getDepartmentNameForFilename(departmentCode));
  return `${name}_${formatDateTimeForFilename()}.xlsx`;
}

function bindForm() {
  /** Enter で次へ進む順（推測ボタンは含めず。計量器時は取引・販売は非表示のため offsetParent でスキップ） */
  const ENTER_FOCUS_ORDER = [
    'barcode', 'nameEng', 'nameTha', 'productGroup',
    'sizeEng', 'sizeTha', 'taxRate', 'manufacturingLocation', 'pluNo',
    'supplier', 'unitCost', 'orderQty', 'orderUnit', 'leadTime', 'unitPrice', 'salesQty',
    'caseBarcode', 'caseName', 'caseSizeEng', 'caseSizeTha', 'casePrice',
    'brandEng', 'brandTha',
  ];
  el.form.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const target = e.target;
    if (target.tagName !== 'INPUT' && target.tagName !== 'SELECT' && target !== el.btnAdd) return;
    if (target.type === 'button' && target !== el.btnAdd) return;
    e.preventDefault();
    const list = [];
    ENTER_FOCUS_ORDER.forEach((id) => {
      const node = document.getElementById(id);
      if (node && node.offsetParent !== null) list.push(node);
    });
    list.push(el.btnAdd);
    const i = list.indexOf(target);
    if (i >= 0 && i < list.length - 1) {
      list[i + 1].focus();
    } else if (i === list.length - 1) {
      el.form.requestSubmit();
    }
  });
  el.form.addEventListener('submit', (e) => {
    e.preventDefault();
    // 編集中はその行のバーコードを重複チェックから除外する
    const existingBarcodes = editingIndex >= 0
      ? items.filter((_, i) => i !== editingIndex).map((it) => it.barcode).filter(Boolean)
      : items.map((it) => it.barcode).filter(Boolean);
    const fields = getFormData();
    const errors = validateFormFields(fields, existingBarcodes, selectedProductType);
    clearFieldErrors();
    if (Object.keys(errors).length > 0) {
      applyFieldErrors(errors);
      return;
    }
    if (items.length >= MAX_ITEMS) {
      showListMaxWarn();
      return;
    }
    const item = formDataToItem(fields);
    saveToHistory();
    if (editingIndex >= 0) {
      const prev = items[editingIndex];
      if (prev._rawItemRow) item._rawItemRow = prev._rawItemRow;
      if (prev.itemNo !== undefined) item.itemNo = prev.itemNo;
      if (prev.barcodeType !== undefined && item.barcodeType === undefined) item.barcodeType = prev.barcodeType;
      if (selectedProductType === PRODUCT_TYPE_SCALE && prev.pluNo !== undefined) item.pluNo = item.pluNo || prev.pluNo;
      items[editingIndex] = item;
      editingIndex = -1;
      el.btnAdd.textContent = t('btn.add');
    } else {
      items.push(item);
    }
    saveItemsToStorage();
    resetForm(true); // 仕入先を保持
    renderTable(); // リスト更新・編集ハイライト解除
  });
}

/** テキスト・数値入力でフォーカス時に全選択し、入力で即置換できるようにする */
function bindFocusSelectAll() {
  el.form.querySelectorAll('input[type="text"], input[type="number"]').forEach((input) => {
    input.addEventListener('focus', function () {
      this.select();
    });
  });
  if (el.outputFilename) {
    el.outputFilename.addEventListener('focus', function () {
      this.select();
    });
  }
}

/** カンマ除去・前後ピリオド補完して数値文字列に正規化 */
function cleanNumeric(val) {
  if (val === '' || val == null) return val;
  let s = String(val).replace(/,/g, ''); // カンマ除去
  if (s === '.' || s === '') return s;
  if (s.startsWith('.')) s = '0' + s;    // .5 → 0.5
  if (s.endsWith('.')) s = s + '0';      // 5. → 5.0
  return s;
}

function getFormData() {
  return {
    productGroup: el.productGroup.value.trim(),
    productGroupCode: el.productGroupCode.value.trim(),
    barcode: el.barcode.value.trim(),
    nameEng: el.nameEng.value.trim(),
    nameTha: el.nameTha.value.trim(),
    sizeEng: el.sizeEng.value.trim() || DEFAULT_SPEC_ENG,
    sizeTha: el.sizeTha.value.trim(),
    taxRate: el.taxRate.value,
    manufacturingLocation: el.manufacturingLocation?.value || 'instore',
    pluNo: el.pluNo ? el.pluNo.value.trim() : '',
    supplier: el.supplier.value.trim(),
    supplierCode: el.supplierCode.value.trim(),
    unitCost: cleanNumeric(el.unitCost.value),
    orderQty: el.orderQty.value,
    orderUnit: el.orderUnit?.value || 'PCS',
    leadTime: el.leadTime.value,
    unitPrice: cleanNumeric(el.unitPrice.value),
    salesQty: el.salesQty.value,
    caseBarcode: el.caseBarcode.value.trim(),
    caseName: el.caseName?.value.trim() ?? '',
    caseSizeEng: el.caseSizeEng?.value.trim() ?? '',
    caseSizeTha: el.caseSizeTha?.value.trim() ?? '',
    casePrice: cleanNumeric(el.casePrice.value),
    brandEng: el.brandEng.value.trim(),
    brandTha: el.brandTha.value.trim(),
  };
}

/** "Name (CODE)" または "Name（CODE）" 形式からコードを抽出する */
function extractCodeFromDisplay(val) {
  if (!val) return val;
  const m = String(val).match(/[（(]([^）)]+)[）)]$/);
  return m ? m[1].trim() : val;
}

function formDataToItem(f) {
  const isRawMaterial = selectedProductType === PRODUCT_TYPE_RAW_MATERIAL;
  const barcode = f.barcode != null ? String(f.barcode).trim() : '';
  // supplierCode が "Name (CODE)" 形式の場合はコード部分だけ取り出す
  const rawSupplierCode = f.supplierCode || f.supplier || '';
  const supplierCode = extractCodeFromDisplay(rawSupplierCode);
  const item = {
    productGroupCode: f.productGroupCode || f.productGroup,
    productGroup: f.productGroup || f.productGroupCode,
    barcode,
    barcodeType: (!barcode || barcode.startsWith('20')) ? 'PLU' : undefined,
    nameEng: f.nameEng,
    nameTha: f.nameTha,
    sizeEng: f.sizeEng || DEFAULT_SPEC_ENG,
    sizeTha: f.sizeTha,
    taxRate: f.taxRate,
    manufacturingLocation: f.manufacturingLocation === 'ckpc' ? 'ckpc' : 'instore',
    pluNo: f.pluNo != null ? String(f.pluNo).trim() : '',
    supplierCode,
    supplier: f.supplier || f.supplierCode,
    unitCost: f.unitCost !== '' ? Number(f.unitCost) : undefined,
    orderQty: !isRawMaterial && f.orderQty !== '' ? Number(f.orderQty) : 1,
    orderUnit: isRawMaterial ? (f.orderUnit || 'PCS') : 'PCS',
    leadTime: f.leadTime !== '' ? Number(f.leadTime) : DEFAULT_LEAD_TIME,
    unitPrice: !isRawMaterial && f.unitPrice !== '' ? Number(f.unitPrice) : undefined,
    salesQty: !isRawMaterial && f.salesQty !== '' ? Number(f.salesQty) : DEFAULT_SALES_QTY,
    caseBarcode: f.caseBarcode,
    caseName: f.caseName || '',
    caseSizeEng: f.caseSizeEng || '',
    caseSizeTha: f.caseSizeTha || '',
    casePrice: f.casePrice !== '' ? Number(f.casePrice) : undefined,
    brandEng: f.brandEng,
    brandTha: f.brandTha,
  };
  return item;
}

/**
 * @param {boolean} [preserveSupplier=false]  true のとき入力完了後のリセットとして仕入先を保持する
 */
function resetForm(preserveSupplier = false) {
  const keepSupplierCode = preserveSupplier ? el.supplierCode.value.trim() : '';
  const keepSupplierDisplay = preserveSupplier ? el.supplier.value.trim() : '';
  el.form.reset();
  setDefaultFormValues();
  el.productGroupCode.value = '';
  el.supplierCode.value = keepSupplierCode;
  el.supplier.value = keepSupplierDisplay;
  if (el.pluNo) el.pluNo.value = '';
  editingIndex = -1;
  el.btnAdd.textContent = t('btn.add');
  toggleCaseFields(Number(el.salesQty.value) >= 2);
  applyProductTypeVisibility();
  updateRequiredFeedback();
  renderTable(); // 編集行のハイライトを外す
}

function bindClearButton() {
  if (!el.btnClear) return;
  el.btnClear.addEventListener('click', () => {
    resetForm();
    clearFieldErrors();
  });
}

function clearFieldErrors() {
  Object.values(errorIds).forEach((id) => {
    const span = document.getElementById(id);
    if (span) span.textContent = '';
  });
  document.querySelectorAll('.error').forEach((e) => e.classList.remove('error'));
}

function applyFieldErrors(errors) {
  Object.entries(errors).forEach(([field, key]) => {
    const msg = t('error.' + key);
    const spanId = errorIds[field];
    const input = el[field] || document.querySelector(`[name="${field}"]`);
    if (spanId && document.getElementById(spanId)) document.getElementById(spanId).textContent = msg;
    if (input) input.classList.add('error');
  });
}

/** 必須項目の入力状態に応じて枠線色・ボタン有効化を更新 */
function updateRequiredFeedback() {
  const isScale = selectedProductType === PRODUCT_TYPE_SCALE;
  const isRawMaterial = selectedProductType === PRODUCT_TYPE_RAW_MATERIAL;
  const caseVisible = !isScale && !isRawMaterial && !el.caseFields.hidden;
  if (isScale) {
    // 呼出番号は1回目インポート後入力のため、必須表示はしない
    [el.nameEng, el.productGroup, el.sizeEng].forEach((input) => {
      if (!input) return;
      const filled = input === el.productGroup
        ? (el.productGroupCode?.value || el.productGroup?.value || '').trim() !== ''
        : input === el.sizeEng
          ? String(el.sizeEng?.value || '').trim() !== ''
          : String(el.nameEng?.value || '').trim() !== '';
      input.classList.toggle('input-required--filled', filled);
    });
    if (el.barcode) el.barcode.classList.toggle('input-required--filled', true);
    if (el.taxRate) el.taxRate.classList.toggle('input-required--filled', true);
    if (el.pluNo) el.pluNo.classList.toggle('input-required--filled', String(el.pluNo?.value || '').trim() !== '');
    el.btnAdd.disabled = !allRequiredFilled();
    return;
  }
  if (isRawMaterial) {
    const requiredInputs = [
      { el: el.nameEng, filled: () => String(el.nameEng?.value || '').trim() !== '' },
      { el: el.productGroup, filled: () => String(el.productGroupCode?.value || el.productGroup?.value || '').trim() !== '' },
      { el: el.sizeEng, filled: () => String(el.sizeEng?.value || '').trim() !== '' },
      { el: el.taxRate, filled: () => true },
      { el: el.supplier, filled: () => String(el.supplierCode?.value || el.supplier?.value || '').trim() !== '' },
      { el: el.unitCost, filled: () => (el.unitCost?.value ?? '') !== '' },
      { el: el.orderUnit, filled: () => String(el.orderUnit?.value || '').trim() !== '' },
    ];
    if (el.barcode) {
      // 原材料: バーコードは任意入力
      el.barcode.classList.toggle('input-required--filled', true);
    }
    requiredInputs.forEach(({ el, filled }) => {
      if (!el) return;
      el.classList.toggle('input-required--filled', filled());
    });
    el.btnAdd.disabled = !allRequiredFilled();
    return;
  }
  const requiredInputs = [
    { el: el.barcode, filled: () => String(el.barcode?.value || '').trim() !== '' },
    { el: el.nameEng, filled: () => String(el.nameEng?.value || '').trim() !== '' },
    { el: el.productGroup, filled: () => String(el.productGroupCode?.value || el.productGroup?.value || '').trim() !== '' },
    { el: el.sizeEng, filled: () => String(el.sizeEng?.value || '').trim() !== '' },
    { el: el.taxRate, filled: () => true },
    { el: el.supplier, filled: () => String(el.supplierCode?.value || el.supplier?.value || '').trim() !== '' },
    { el: el.unitCost, filled: () => (el.unitCost?.value ?? '') !== '' },
    { el: el.orderQty, filled: () => (el.orderQty?.value ?? '') !== '' },
    { el: el.unitPrice, filled: () => (el.unitPrice?.value ?? '') !== '' },
    { el: el.salesQty, filled: () => (el.salesQty?.value ?? '') !== '' },
  ];
  requiredInputs.forEach(({ el, filled }) => {
    if (!el) return;
    el.classList.toggle('input-required--filled', filled());
  });
  if (caseVisible) {
    [el.caseBarcode, el.casePrice].forEach((input) => {
      if (!input) return;
      const filled = input === el.casePrice
        ? (el.casePrice?.value ?? '') !== ''
        : String(el.caseBarcode?.value || '').trim() !== '';
      input.classList.toggle('input-required--filled', filled);
    });
  }
  el.btnAdd.disabled = !allRequiredFilled();
}

function allRequiredFilled() {
  const isScale = selectedProductType === PRODUCT_TYPE_SCALE;
  const isRawMaterial = selectedProductType === PRODUCT_TYPE_RAW_MATERIAL;
  if (isScale) {
    // 呼出番号は1回目インポート後に入力するため、初回登録時は必須にしない
    if (String(el.nameEng?.value || '').trim() === '') return false;
    if ((el.productGroupCode?.value || el.productGroup?.value || '').trim() === '') return false;
    if (String(el.sizeEng?.value || '').trim() === '') return false;
    return true;
  }
  if (isRawMaterial) {
    if (String(el.nameEng?.value || '').trim() === '') return false;
    if (String(el.productGroupCode?.value || el.productGroup?.value || '').trim() === '') return false;
    if (String(el.sizeEng?.value || '').trim() === '') return false;
    if (String(el.supplierCode?.value || el.supplier?.value || '').trim() === '') return false;
    if ((el.unitCost?.value ?? '') === '') return false;
    if (String(el.orderUnit?.value || '').trim() === '') return false;
    return true;
  }
  const caseVisible = !el.caseFields.hidden;
  if (String(el.barcode?.value || '').trim() === '') return false;
  if (String(el.nameEng?.value || '').trim() === '') return false;
  if (String(el.productGroupCode?.value || el.productGroup?.value || '').trim() === '') return false;
  if (String(el.sizeEng?.value || '').trim() === '') return false;
  if (String(el.supplierCode?.value || el.supplier?.value || '').trim() === '') return false;
  if ((el.unitCost?.value ?? '') === '') return false;
  if ((el.orderQty?.value ?? '') === '') return false;
  if ((el.unitPrice?.value ?? '') === '') return false;
  if ((el.salesQty?.value ?? '') === '') return false;
  if (caseVisible) {
    if (String(el.caseBarcode?.value || '').trim() === '') return false;
    if ((el.casePrice?.value ?? '') === '') return false;
  }
  return true;
}

function bindRequiredFeedback() {
  el.form.addEventListener('input', updateRequiredFeedback);
  el.form.addEventListener('change', updateRequiredFeedback);
  el.form.addEventListener('focusout', updateRequiredFeedback);
}

function bindSalesQtyToggle() {
  el.salesQty.addEventListener('input', () => {
    const v = Number(el.salesQty.value);
    toggleCaseFields(v >= 2);
  });
}

function toggleCaseFields(show) {
  el.caseFields.hidden = !show;
  el.form.classList.toggle('case-fields-visible', show);
  updateRequiredFeedback();
}

function bindComboProductGroup() {
  function getOptionsWithSuggestions(q) {
    const dept = selectedDepartment;
    const suggested = suggestGroupByProductName(el.nameEng.value.trim(), el.nameTha.value.trim(), dept);
    const suggestedCodes = new Set(suggested.map((r) => r.productGroupCode));
    const bySearch = filterGroup(q, dept);
    const seen = new Set();
    const merged = [];
    suggested.forEach((r) => {
      if (!seen.has(r.productGroupCode)) {
        seen.add(r.productGroupCode);
        merged.push({ ...r, _suggested: true });
      }
    });
    bySearch.forEach((r) => {
      if (!seen.has(r.productGroupCode)) {
        seen.add(r.productGroupCode);
        merged.push({ ...r, _suggested: false });
      }
    });
    return merged;
  }
  function refreshOptions(q) {
    const merged = getOptionsWithSuggestions(q);
    const prefix = getLang() === 'ja' ? '提案: ' : 'แนะนำ: ';
    el.productGroupList.innerHTML = merged.map((r) => {
      const label = (r.description || r.descriptionTha || '') + ' (' + r.productGroupCode + ')';
      const display = r._suggested ? prefix + label : label;
      return `<option value="${escapeHtml(r.productGroupCode)}">${escapeHtml(display)}</option>`;
    }).join('');
  }
  refreshOptions('');
  el.productGroup.addEventListener('input', () => {
    const q = el.productGroup.value;
    refreshOptions(q);
    const merged = getOptionsWithSuggestions(q);
    const match = merged.find((r) => String(r.productGroupCode) === q.trim());
    if (match) el.productGroupCode.value = match.productGroupCode;
    else el.productGroupCode.value = '';
  });
  el.productGroup.addEventListener('blur', () => {
    const q = el.productGroup.value.trim();
    const merged = getOptionsWithSuggestions(q);
    const match = merged.find((r) => String(r.productGroupCode) === q);
    if (match) {
      el.productGroupCode.value = match.productGroupCode;
      el.productGroup.value = (match.description || match.descriptionTha || match.productGroupCode) + ' (' + match.productGroupCode + ')';
    }
  });
  if (el.btnSuggestClassification) {
    el.btnSuggestClassification.addEventListener('click', async () => {
      const btn = el.btnSuggestClassification;
      const msgEl = el.suggestSourceMsg;
      const nameEng = el.nameEng.value.trim();
      const nameTha = el.nameTha.value.trim();
      if (!nameEng && !nameTha) return;
      if (msgEl) msgEl.textContent = '';

      const groupForDept = getGroupMasterForDepartment(selectedDepartment);
      let result = null;
      let usedAI = false;
      if (hasGenAIConfig()) {
        btn.disabled = true;
        el.btnAdd.disabled = true;
        btn.textContent = t('btn.suggesting') || '...';
        result = await suggestClassificationWithGenAI(nameEng, nameTha, groupForDept);
        if (result) usedAI = true;
        btn.textContent = t('btn.suggest');
        btn.disabled = false;
        el.btnAdd.disabled = false;
        updateRequiredFeedback();
      }
      if (!result) {
        const suggested = suggestGroupByProductName(nameEng, nameTha, selectedDepartment);
        if (suggested.length > 0) result = suggested[0];
      }
      if (result) {
        el.productGroupCode.value = result.productGroupCode;
        el.productGroup.value = (result.description || result.descriptionTha || result.productGroupCode) + ' (' + result.productGroupCode + ')';
        if (msgEl) {
          msgEl.textContent = usedAI ? (t('msg.suggestByAI') || 'AIで推測しました') : (t('msg.suggestByKeyword') || 'キーワードで推測しました');
          msgEl.classList.toggle('suggest-source-msg--keyword', !usedAI);
          setTimeout(() => { msgEl.textContent = ''; msgEl.classList.remove('suggest-source-msg--keyword'); }, 3000);
        }
      }
    });
  }
  /** 商品名入力後、一定時間でキーワード推測を自動実行（AI は使わない） */
  let autoSuggestTimer = null;
  const AUTO_SUGGEST_DELAY_MS = 700;
  /** キーワード推測を実行し、結果があれば分類に反映（分類が入っていても上書き） */
  function runAutoSuggest() {
    const nameEng = el.nameEng.value.trim();
    const nameTha = el.nameTha.value.trim();
    if (!nameEng && !nameTha) return;
    const suggested = suggestGroupByProductName(nameEng, nameTha, selectedDepartment);
    if (suggested.length > 0) {
      const top = suggested[0];
      el.productGroupCode.value = top.productGroupCode;
      el.productGroup.value = (top.description || top.descriptionTha || top.productGroupCode) + ' (' + top.productGroupCode + ')';
      refreshOptions(el.productGroup.value);
    }
  }
  function scheduleAutoSuggest() {
    if (autoSuggestTimer) clearTimeout(autoSuggestTimer);
    autoSuggestTimer = setTimeout(() => {
      autoSuggestTimer = null;
      runAutoSuggest();
    }, AUTO_SUGGEST_DELAY_MS);
  }
  el.nameEng.addEventListener('input', () => {
    refreshOptions(el.productGroup.value);
    scheduleAutoSuggest();
  });
  el.nameTha.addEventListener('input', () => {
    refreshOptions(el.productGroup.value);
    scheduleAutoSuggest();
  });
  /** 商品名からフォーカスが外れたときも推測を実行（入力変更時は分類を上書き） */
  el.nameEng.addEventListener('blur', runAutoSuggest);
  el.nameTha.addEventListener('blur', runAutoSuggest);
}

function bindComboSupplier() {
  function refreshOptions(q) {
    const filtered = filterSupplier(q, selectedDepartment);
    el.supplierList.innerHTML = filtered.map((r) => `<option value="${escapeHtml(r.supplierNo)}">${escapeHtml((r.abbreviation || r.nameEng || '') + ' (' + r.supplierNo + ')')}</option>`).join('');
  }
  function findSupplierMatch(q) {
    const filtered = filterSupplier(q, selectedDepartment);
    let match = filtered.find((r) => String(r.supplierNo) === q);
    if (!match && /\([\d]+\)$/.test(q)) {
      const code = q.replace(/^.*\(([\d]+)\)$/, '$1');
      match = filtered.find((r) => String(r.supplierNo) === code);
    }
    return match;
  }
  refreshOptions('');
  el.supplier.addEventListener('focus', () => {
    el.supplier.select();
  });
  el.supplier.addEventListener('input', () => {
    const q = el.supplier.value;
    refreshOptions(q);
    const match = findSupplierMatch(q.trim());
    if (match) el.supplierCode.value = match.supplierNo;
    else el.supplierCode.value = '';
  });
  el.supplier.addEventListener('blur', () => {
    const q = el.supplier.value.trim();
    if (!q) return;
    const match = findSupplierMatch(q);
    if (match) {
      el.supplierCode.value = match.supplierNo;
      el.supplier.value = (match.abbreviation || match.nameEng || match.supplierNo) + ' (' + match.supplierNo + ')';
    }
  });
}

function bindDepartmentChange() {
  el.department.addEventListener('change', async () => {
    if (items.length > 0) {
      el.departmentWarn.textContent = t('error.departmentLocked');
      el.department.value = selectedDepartment;
      return;
    }
    el.departmentWarn.textContent = '';
    selectedDepartment = el.department.value;
    clearComboSelectionsIfInvalid();
    await loadMastersFromApi(selectedDepartment);
    refreshClassificationCombo();
    refreshSupplierCombo();
    updateExportButtonState();
  });
}

function bindProductTypeChange() {
  if (!el.productType) return;
  el.productType.addEventListener('change', () => {
    if (items.length > 0) {
      el.productTypeWarn.textContent = t('error.productTypeLocked');
      el.productType.value = selectedProductType;
      return;
    }
    el.productTypeWarn.textContent = '';
    selectedProductType = el.productType.value;
    applyProductTypeVisibility();
    renderTable();
    updateExportButtonState();
  });
}

/** 部門変更後: 現在の分類・仕入先が選択部門に属さない場合はクリア */
function clearComboSelectionsIfInvalid() {
  const groups = getGroupMasterForDepartment(selectedDepartment);
  const suppliers = getSupplierMasterForDepartment(selectedDepartment);
  const currentCode = el.productGroupCode.value.trim();
  const currentSupplier = el.supplierCode.value.trim();
  if (currentCode && !groups.some((r) => String(r.productGroupCode) === currentCode)) {
    el.productGroupCode.value = '';
    el.productGroup.value = '';
  }
  if (currentSupplier && !suppliers.some((r) => String(r.supplierNo) === currentSupplier)) {
    el.supplierCode.value = '';
    el.supplier.value = '';
  }
}

function refreshClassificationCombo() {
  const q = el.productGroup.value;
  const merged = (() => {
    const suggested = suggestGroupByProductName(el.nameEng.value.trim(), el.nameTha.value.trim(), selectedDepartment);
    const suggestedCodes = new Set(suggested.map((r) => r.productGroupCode));
    const bySearch = filterGroup(q, selectedDepartment);
    const seen = new Set();
    const result = [];
    suggested.forEach((r) => {
      if (!seen.has(r.productGroupCode)) { seen.add(r.productGroupCode); result.push({ ...r, _suggested: true }); }
    });
    bySearch.forEach((r) => {
      if (!seen.has(r.productGroupCode)) { seen.add(r.productGroupCode); result.push({ ...r, _suggested: false }); }
    });
    return result;
  })();
  const prefix = getLang() === 'ja' ? '提案: ' : 'แนะนำ: ';
  el.productGroupList.innerHTML = merged.map((r) => {
    const label = (r.description || r.descriptionTha || '') + ' (' + r.productGroupCode + ')';
    const display = r._suggested ? prefix + label : label;
    return `<option value="${escapeHtml(r.productGroupCode)}">${escapeHtml(display)}</option>`;
  }).join('');
}

function refreshSupplierCombo() {
  const filtered = filterSupplier(el.supplier.value, selectedDepartment);
  el.supplierList.innerHTML = filtered.map((r) => `<option value="${escapeHtml(r.supplierNo)}">${escapeHtml((r.abbreviation || r.nameEng || '') + ' (' + r.supplierNo + ')')}</option>`).join('');
}

/**
 * クリップボードのテキストをパースしてアイテムを追加（Excelコピー想定: Tab区切り）
 * カラム順: barcode, nameEng, nameTha, productGroupCode, supplierCode, unitCost, unitPrice
 */
function pasteItemsFromText(text) {
  const PASTE_COL_FIELDS = ['barcode', 'nameEng', 'nameTha', 'productGroupCode', 'supplierCode', 'unitCost', 'unitPrice'];
  const NUM_FIELDS = new Set(['unitCost', 'unitPrice', 'orderQty']);
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const added = [];
  for (const line of lines) {
    const cols = line.split('\t');
    if (cols.every((c) => !c.trim())) continue;
    const item = {
      barcode: '',
      nameEng: '',
      nameTha: '',
      productGroupCode: '',
      productGroup: '',
      supplierCode: '',
      supplier: '',
      unitCost: undefined,
      orderQty: 1,
      leadTime: DEFAULT_LEAD_TIME,
      unitPrice: undefined,
      salesQty: DEFAULT_SALES_QTY,
      taxRate: String(DEFAULT_TAX_RATE),
      sizeEng: DEFAULT_SPEC_ENG,
    };
    PASTE_COL_FIELDS.forEach((field, ci) => {
      const raw = (cols[ci] || '').trim();
      if (raw === '') return;
      if (NUM_FIELDS.has(field)) {
        const n = Number(raw);
        if (!isNaN(n)) item[field] = n;
      } else {
        item[field] = raw;
      }
    });
    // supplier / productGroup の同期
    item.supplier = item.supplierCode;
    item.productGroup = item.productGroupCode;
    if (!item.barcode) continue;
    added.push(item);
  }
  if (added.length === 0) return;
  const remaining = MAX_ITEMS - items.length;
  const toAdd = added.slice(0, remaining);
  saveToHistory();
  items.push(...toAdd);
  saveItemsToStorage();
  renderTable();
  if (added.length > toAdd.length) {
    el.listMaxWarn.hidden = false;
    el.listMaxWarn.textContent = t('error.listMax');
  }
}

function bindTable() {
  // テーブルセクションへのペーストイベント（contenteditable セル以外）
  const listSection = el.tbody.closest('section');
  if (listSection) {
    listSection.addEventListener('paste', (e) => {
      if (e.target.isContentEditable) return; // インライン編集中はブラウザのペーストに任せる
      e.preventDefault();
      const text = e.clipboardData.getData('text/plain');
      if (text) pasteItemsFromText(text);
    });
    // テーブルにフォーカス可能属性を付与してペーストを受け取れるようにする
    if (!listSection.hasAttribute('tabindex')) listSection.setAttribute('tabindex', '-1');
  }

  if (el.btnDeleteAll) {
    el.btnDeleteAll.addEventListener('click', () => {
      if (items.length === 0) return;
      if (!confirm(`${items.length}件すべて削除しますか？`)) return;
      saveToHistory();
      items = [];
      editingIndex = -1;
      el.btnAdd.textContent = t('btn.add');
      saveItemsToStorage();
      renderTable();
    });
  }
}

function updateExportButtonState() {
  if (!el.btnExport) return;
  const isScale = selectedProductType === PRODUCT_TYPE_SCALE;
  const requirePluForScale = isScale && el.outSecond?.checked;
  const errs = validateForExport(items, selectedDepartment, selectedProductType, { requirePluForScale });
  el.btnExport.disabled = errs.length > 0;
}

// グリッド直接編集: 列インデックス → アイテムフィールド名のマップ
const GRID_COL_FIELDS = [
  null,               // 0: checkbox
  'barcode',          // 1
  'nameEng',          // 2
  'nameTha',          // 3
  'productGroupCode', // 4
  'pluNo',            // 5
  'supplier',         // 6
  'orderQty',         // 7
  'unitCost',         // 8
  'unitPrice',        // 9
];

function renderTable() {
  const isRawMaterial = selectedProductType === PRODUCT_TYPE_RAW_MATERIAL;
  el.tbody.innerHTML = '';
  items.forEach((item, i) => {
    const tr = document.createElement('tr');
    tr.dataset.index = i;
    tr.classList.toggle('selected', i === editingIndex);
    tr.style.cursor = 'pointer';
    tr.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      startEditRow(i);
    });

    // 個別削除ボタン列
    const tdDel = document.createElement('td');
    tdDel.className = 'col-del-btn';
    const btnRowDel = document.createElement('button');
    btnRowDel.type = 'button';
    btnRowDel.textContent = '削除';
    btnRowDel.className = 'btn-row-delete';
    btnRowDel.addEventListener('click', (e) => {
      e.stopPropagation();
      saveToHistory();
      if (editingIndex === i) {
        resetForm(true);
      } else if (editingIndex > i) {
        editingIndex--;
      }
      items.splice(i, 1);
      saveItemsToStorage();
      renderTable();
    });
    tdDel.appendChild(btnRowDel);
    tr.appendChild(tdDel);

    // データ列
    // 分類コードがマスタに存在するかチェック
    const groupMasterForDept = getGroupMasterForDepartment(selectedDepartment);
    const groupEntry = groupMasterForDept.find((r) => r.productGroupCode === item.productGroupCode);
    const groupCodeValid = !item.productGroupCode || !!groupEntry;
    const groupLabel = item.productGroupCode
      ? (groupEntry ? `${item.productGroupCode} ${groupEntry.description || groupEntry.descriptionTha || ''}`.trimEnd() : item.productGroupCode)
      : '';

    const cols = [
      { cls: 'cell-barcode', val: item.barcode || '' },
      { cls: 'cell-name', val: item.nameEng || '', truncate: 50 },
      { cls: 'cell-name', val: item.nameTha || '', truncate: 50 },
      { cls: groupCodeValid ? '' : 'cell-invalid', val: groupLabel, title: groupCodeValid ? '' : '分類コードがマスタに存在しません', truncate: 40 },
      { cls: 'col-plu', val: item.pluNo != null ? String(item.pluNo) : '' },
      { cls: 'col-supplier cell-name', val: (item.supplier || item.supplierCode || ''), truncate: 30 },
      { cls: 'col-orderQty', val: String(isRawMaterial ? (item.orderUnit || '') : (item.orderQty != null ? item.orderQty : '')) },
      { cls: 'col-cost', val: item.unitCost != null ? String(item.unitCost) : '' },
      { cls: 'col-price', val: item.unitPrice != null ? String(item.unitPrice) : '' },
    ];
    cols.forEach((col) => {
      const td = document.createElement('td');
      if (col.cls) td.className = col.cls;
      if (col.title) td.title = col.title;
      if (col.truncate && col.val.length > col.truncate) {
        td.title = col.val;
        td.textContent = col.val.slice(0, col.truncate) + '…';
      } else {
        td.textContent = col.val;
      }
      tr.appendChild(td);
    });

    // 操作列：行コピーボタン
    const tdAction = document.createElement('td');
    tdAction.className = 'col-action';
    const btnCopy = document.createElement('button');
    btnCopy.type = 'button';
    btnCopy.textContent = 'コピー';
    btnCopy.className = 'btn-row-copy';
    btnCopy.addEventListener('click', () => copyRow(i));
    tdAction.appendChild(btnCopy);
    tr.appendChild(tdAction);

    el.tbody.appendChild(tr);
  });
  el.listMaxWarn.hidden = items.length < MAX_ITEMS;
  if (items.length >= MAX_ITEMS) el.listMaxWarn.textContent = t('error.listMax');
  updateExportButtonState();
}

/**
 * セルをインライン編集モードにする
 * @param {HTMLTableCellElement} td
 * @param {number} itemIndex
 * @param {number} colIndex - GRID_COL_FIELDS のインデックス
 */
function startInlineCellEdit(td, itemIndex, colIndex) {
  const field = GRID_COL_FIELDS[colIndex];
  if (!field) return;
  if (td.contentEditable === 'true') return; // 既に編集中
  const item = items[itemIndex];
  if (!item) return;

  const original = String(item[field] != null ? item[field] : '');
  td.textContent = original;
  td.contentEditable = 'true';
  td.classList.add('cell-editing');
  td.focus();

  // カーソルを末尾に
  const range = document.createRange();
  const sel = window.getSelection();
  range.selectNodeContents(td);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);

  function commitEdit() {
    if (td.contentEditable !== 'true') return;
    td.contentEditable = 'false';
    td.classList.remove('cell-editing');
    const newVal = td.textContent.trim();
    if (field === 'unitCost' || field === 'unitPrice' || field === 'orderQty') {
      const num = newVal === '' ? undefined : Number(newVal);
      item[field] = isNaN(num) ? item[field] : (newVal === '' ? undefined : num);
    } else {
      item[field] = newVal;
      if (field === 'supplier') item.supplierCode = newVal;
      if (field === 'productGroupCode') item.productGroup = newVal;
    }
    saveItemsToStorage();
    const displayVal = item[field] != null ? String(item[field]) : '';
    if (td.className.includes('cell-name') && displayVal.length > 50) {
      td.title = displayVal;
      td.textContent = displayVal.slice(0, 50) + '…';
    } else {
      td.textContent = displayVal;
    }
    updateExportButtonState();
  }

  function cancelEdit() {
    if (td.contentEditable !== 'true') return;
    td.contentEditable = 'false';
    td.classList.remove('cell-editing');
    td.textContent = original;
  }

  // (rowDelta, colDelta) 方向の次セルを取得
  function findNextCell(rowDelta, colDelta) {
    let r = itemIndex + rowDelta;
    let c = colIndex + colDelta;
    if (colDelta !== 0) {
      // null 列をスキップ
      while (c > 0 && c < GRID_COL_FIELDS.length && GRID_COL_FIELDS[c] === null) c += colDelta;
      // 行末/行頭を超えたら次/前の行の先頭/末尾セルへ
      if (c < 1 || c >= GRID_COL_FIELDS.length) {
        r = itemIndex + (colDelta > 0 ? 1 : -1);
        if (colDelta > 0) {
          c = GRID_COL_FIELDS.findIndex((f, idx) => idx > 0 && f !== null);
        } else {
          c = GRID_COL_FIELDS.length - 1;
          while (c > 0 && GRID_COL_FIELDS[c] === null) c--;
        }
      }
    }
    if (r < 0 || r >= items.length) return null;
    if (c < 1 || c >= GRID_COL_FIELDS.length || !GRID_COL_FIELDS[c]) return null;
    const nextTr = el.tbody.rows[r];
    if (!nextTr) return null;
    return { td: nextTr.cells[c], itemIndex: r, colIndex: c };
  }

  td.addEventListener('blur', commitEdit, { once: true });

  const onKeydown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      td.removeEventListener('keydown', onKeydown);
      commitEdit();
      const next = findNextCell(0, e.shiftKey ? -1 : 1);
      if (next) startInlineCellEdit(next.td, next.itemIndex, next.colIndex);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      td.removeEventListener('keydown', onKeydown);
      commitEdit();
      const next = findNextCell(e.shiftKey ? -1 : 1, 0);
      if (next) startInlineCellEdit(next.td, next.itemIndex, next.colIndex);
    } else if (e.key === 'Escape') {
      td.removeEventListener('keydown', onKeydown);
      cancelEdit();
    }
  };
  td.addEventListener('keydown', onKeydown);
}

function startEditRow(i) {
  editingIndex = i;
  fillForm(items[i]);
  el.btnAdd.textContent = t('btn.edit');
  el.tbody.querySelectorAll('tr').forEach((row, idx) => {
    row.classList.toggle('selected', idx === i);
  });
}

function copyRow(i) {
  const copy = { ...items[i], barcode: '' }; // バーコードはクリア（一意性確保）
  editingIndex = -1;
  el.btnAdd.textContent = t('btn.add');
  fillForm(copy);
  clearFieldErrors();
  renderTable();
  el.barcode.focus();
}

function applyImportReplace(parsed) {
  saveToHistory();
  items = parsed.slice();
  saveItemsToStorage();
  editingIndex = -1;
  el.btnAdd.textContent = t('btn.add');
  renderTable();
  el.exportErrors.hidden = true;
  updateHistoryButtons();
}

function applyImportMerge(parsed) {
  saveToHistory();
  const barcodeMap = new Map(items.map((item, idx) => [item.barcode, idx]));
  for (const imported of parsed) {
    if (imported.barcode && barcodeMap.has(imported.barcode)) {
      items[barcodeMap.get(imported.barcode)] = { ...items[barcodeMap.get(imported.barcode)], ...imported };
    } else {
      if (items.length < MAX_ITEMS) items.push(imported);
    }
  }
  saveItemsToStorage();
  renderTable();
  el.exportErrors.hidden = true;
  updateHistoryButtons();
}

async function logExportToServer(dept, exportItems, filename) {
  try {
    await fetch('/api/log/export', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dept,
        itemCount: exportItems.length,
        filename,
        items: exportItems.map((it) => ({
          barcode: it.barcode,
          nameEng: it.nameEng,
          nameTha: it.nameTha,
          productGroupCode: it.productGroupCode,
          supplierCode: it.supplierCode,
          unitCost: it.unitCost,
          unitPrice: it.unitPrice,
        })),
      }),
    });
  } catch {
    // ログ失敗は無視
  }
}

function startSessionPolling() {
  setInterval(async () => {
    try {
      const res = await fetch('/api/auth/status', { credentials: 'include' });
      if (!res.ok) return;
      const status = await res.json();
      if (status.externalAuth && !status.loggedIn) {
        if (el.sessionExpiredModal) el.sessionExpiredModal.hidden = false;
      }
    } catch {
      // ネットワークエラーは無視
    }
  }, 5 * 60 * 1000);
}

function fillForm(item) {
  el.productGroupCode.value = item.productGroupCode || '';
  el.productGroup.value = (item.productGroup || item.productGroupCode) || '';
  el.barcode.value = item.barcode || '';
  el.nameEng.value = item.nameEng || '';
  el.nameTha.value = item.nameTha || '';
  el.sizeEng.value = item.sizeEng || DEFAULT_SPEC_ENG;
  el.sizeTha.value = item.sizeTha || '';
  el.taxRate.value = item.taxRate ?? String(DEFAULT_TAX_RATE);
  if (el.manufacturingLocation) el.manufacturingLocation.value = item.manufacturingLocation === 'ckpc' ? 'ckpc' : 'instore';
  el.supplierCode.value = item.supplierCode || '';
  el.supplier.value = item.supplier || item.supplierCode || '';
  el.unitCost.value = item.unitCost != null ? item.unitCost : '';
  el.orderQty.value = item.orderQty != null ? item.orderQty : '';
  if (el.orderUnit) el.orderUnit.value = item.orderUnit || 'PCS';
  el.leadTime.value = item.leadTime != null ? item.leadTime : DEFAULT_LEAD_TIME;
  el.unitPrice.value = item.unitPrice != null ? item.unitPrice : '';
  el.salesQty.value = item.salesQty != null ? item.salesQty : DEFAULT_SALES_QTY;
  el.caseBarcode.value = item.caseBarcode || '';
  if (el.caseName) el.caseName.value = item.caseName || '';
  if (el.caseSizeEng) el.caseSizeEng.value = item.caseSizeEng || '';
  if (el.caseSizeTha) el.caseSizeTha.value = item.caseSizeTha || '';
  el.casePrice.value = item.casePrice != null ? item.casePrice : '';
  el.brandEng.value = item.brandEng || '';
  el.brandTha.value = item.brandTha || '';
  if (el.pluNo) el.pluNo.value = item.pluNo != null ? item.pluNo : '';
  toggleCaseFields(Number(el.salesQty.value) >= 2);
  applyProductTypeVisibility();
  updateRequiredFeedback();
}

function showListMaxWarn() {
  el.listMaxWarn.hidden = false;
  el.listMaxWarn.textContent = t('error.listMax');
}

function showExportSuccessModal() {
  if (el.exportSuccessModal) {
    if (el.btnGotoImport) el.btnGotoImport.href = IMPORT_PAGE_URL;
    el.exportSuccessModal.hidden = false;
  }
}

function hideExportSuccessModal() {
  if (el.exportSuccessModal) el.exportSuccessModal.hidden = true;
}

function bindOutput() {
  if (el.outItem) el.outItem.addEventListener('change', updateExportButtonState);
  if (el.outSecond) el.outSecond.addEventListener('change', updateExportButtonState);
  el.btnExport.addEventListener('click', () => {
    const isScale = selectedProductType === PRODUCT_TYPE_SCALE;
    const isRawMaterial = selectedProductType === PRODUCT_TYPE_RAW_MATERIAL;
    const requirePluForScale = isScale && el.outSecond?.checked;
    const errs = validateForExport(items, selectedDepartment, selectedProductType, { requirePluForScale });
    if (errs.length > 0) {
      el.exportErrors.hidden = false;
      const prefix = getLang() === 'ja' ? '出力できません: ' : 'Cannot export: ';
      el.exportErrors.textContent = prefix + errs.join(', ');
      return;
    }
    el.exportErrors.hidden = true;
    const name = el.outputFilename.value.trim();
    const exportFilename = name || buildDefaultOutputFilename(selectedDepartment);
    exportXlsx(items, selectedDepartment, {
      sheetItem: el.outItem.checked,
      sheetAdditional: !isScale && !isRawMaterial && el.outSecond?.checked,
      sheetIshida: isScale && el.outSecond?.checked,
      productType: selectedProductType,
      filename: exportFilename,
    });
    logExportToServer(selectedDepartment, items, exportFilename);
    showExportSuccessModal();
  });
  if (el.exportSuccessModal) {
    el.exportSuccessModal.addEventListener('click', (e) => {
      if (e.target === el.exportSuccessModal) hideExportSuccessModal();
    });
  }
  if (el.btnCloseExportModal) {
    el.btnCloseExportModal.addEventListener('click', hideExportSuccessModal);
  }
  if (el.btnGotoImport) {
    el.btnGotoImport.href = IMPORT_PAGE_URL;
    el.btnGotoImport.addEventListener('click', (e) => {
      e.preventDefault();
      window.open(IMPORT_PAGE_URL, '_blank', 'noopener,noreferrer');
      hideExportSuccessModal();
    });
  }
  el.btnImport.addEventListener('click', () => el.fileImport.click());
  el.fileImport.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = parseItemSheet(ev.target.result);
        if (parsed.length === 0) {
          el.exportErrors.hidden = false;
          el.exportErrors.textContent = getLang() === 'ja' ? '有効なItemシートがありません' : 'No valid Item sheet';
          return;
        }
        pendingImportItems = parsed;
        if (el.importModeModal) {
          const isRawMaterial = selectedProductType === PRODUCT_TYPE_RAW_MATERIAL;
          if (el.importModeDesc) {
            el.importModeDesc.textContent = isRawMaterial
              ? `${parsed.length}件読み込みました。既存リストに統合（バーコード照合）しますか？`
              : `${parsed.length}件読み込みました。インポートモードを選択してください。`;
          }
          el.importModeModal.hidden = false;
        } else {
          applyImportReplace(parsed);
        }
        el.exportErrors.hidden = true;
      } catch (err) {
        el.exportErrors.hidden = false;
        el.exportErrors.textContent = (getLang() === 'ja' ? '読み込みエラー: ' : 'Import error: ') + err.message;
      }
      e.target.value = '';
    };
    reader.readAsArrayBuffer(file);
  });
}

/** 数値入力欄にフォーカスしたときに小型テンキーを表示 */
function bindNumpad() {
  if (!el.numpad) return;
  const NUMERIC_IDS = ['unitCost', 'orderQty', 'leadTime', 'unitPrice', 'salesQty', 'casePrice'];
  let currentNumpadInput = null;
  let numpadHideTimeout = null;
  /** テンキーキー mousedown 時点の入力欄の値と選択範囲（クリックでフォーカスが移るためここで保存） */
  let capturedState = null;

  const GAP = 6;
  const PAD_WIDTH = 120;
  const PAD_HEIGHT = 168;

  function showNumpad(inputEl) {
    if (numpadHideTimeout) {
      clearTimeout(numpadHideTimeout);
      numpadHideTimeout = null;
    }
    const rect = inputEl.getBoundingClientRect();
    let top = rect.bottom + GAP;
    let left = rect.left;
    if (top + PAD_HEIGHT > window.innerHeight) top = rect.top - PAD_HEIGHT - GAP;
    if (left + PAD_WIDTH > window.innerWidth) left = window.innerWidth - PAD_WIDTH - 8;
    if (left < 8) left = 8;
    if (top < 8) top = 8;
    el.numpad.style.top = `${top}px`;
    el.numpad.style.left = `${left}px`;
    el.numpad.hidden = false;
  }
  function hideNumpad() {
    el.numpad.hidden = true;
    currentNumpadInput = null;
    capturedState = null;
  }
  function captureSelection() {
    capturedState = null;
    if (!currentNumpadInput) return;
    const v = currentNumpadInput.value || '';
    const start = currentNumpadInput.selectionStart ?? v.length;
    const end = currentNumpadInput.selectionEnd ?? v.length;
    capturedState = { value: v, start, end };
  }
  function applyToInput(ch) {
    if (!currentNumpadInput) return;
    const input = currentNumpadInput;
    const state = capturedState;
    capturedState = null;
    const value = state ? state.value : (input.value || '');
    const start = state ? state.start : value.length;
    const end = state ? state.end : value.length;
    const fullSelected = (start === 0 && end === value.length);

    let newVal;
    if (fullSelected) {
      newVal = (ch === '.') ? '0.' : ch;
    } else if (start < end) {
      if (ch === '.') {
        const rest = value.slice(0, start) + value.slice(end);
        if (rest.includes('.')) return;
      }
      newVal = value.slice(0, start) + ch + value.slice(end);
    } else {
      if (ch === '.' && value.includes('.')) return;
      newVal = (ch === '.') && !value ? '0.' : (value + ch);
    }

    input.focus();
    requestAnimationFrame(() => {
      if (currentNumpadInput !== input) return;
      input.value = newVal;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }
  function backspace() {
    if (!currentNumpadInput) return;
    const state = capturedState;
    capturedState = null;
    const input = currentNumpadInput;
    const value = state ? state.value : (input.value || '');
    const start = state ? state.start : value.length;
    const end = state ? state.end : value.length;
    let newVal;
    if (start === 0 && end === value.length) {
      newVal = '';
    } else if (start < end) {
      newVal = value.slice(0, start) + value.slice(end);
    } else {
      const pos = Math.max(0, (state ? start : value.length) - 1);
      newVal = value.slice(0, pos) + value.slice(pos + 1);
    }
    input.value = newVal;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.focus();
  }
  function clearInput() {
    if (!currentNumpadInput) return;
    currentNumpadInput.value = '';
    currentNumpadInput.dispatchEvent(new Event('input', { bubbles: true }));
    currentNumpadInput.focus();
    capturedState = null;
  }

  NUMERIC_IDS.forEach((id) => {
    const input = document.getElementById(id);
    if (!input) return;
    input.addEventListener('focus', () => {
      currentNumpadInput = input;
      showNumpad(input);
    });
    input.addEventListener('blur', () => {
      numpadHideTimeout = setTimeout(() => {
        const active = document.activeElement;
        if (active && (el.numpad.contains(active) || active === currentNumpadInput)) return;
        hideNumpad();
        numpadHideTimeout = null;
      }, 150);
    });
  });

  el.numpad.addEventListener('mousedown', (e) => {
    if (numpadHideTimeout) {
      clearTimeout(numpadHideTimeout);
      numpadHideTimeout = null;
    }
    if (e.target.closest('.numpad-key')) captureSelection();
  });
  el.numpad.querySelectorAll('.numpad-key[data-value]').forEach((btn) => {
    btn.addEventListener('click', () => {
      applyToInput(btn.dataset.value);
    });
  });
  const btnBack = el.numpad.querySelector('.numpad-key[data-action="backspace"]');
  if (btnBack) btnBack.addEventListener('click', backspace);
  const btnClear = el.numpad.querySelector('.numpad-key[data-action="clear"]');
  if (btnClear) btnClear.addEventListener('click', clearInput);
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

/** DBからマスタを読み込み。失敗時はサンプルデータを使用しバナーを表示 */
async function loadMastersFromApi(dept) {
  const result = await fetchMastersFromApi(dept || selectedDepartment);
  if (result && (result.group.length > 0 || result.supplier.length > 0)) {
    setGroupMaster(result.group);
    setSupplierMaster(result.supplier);
    if (el.masterStatus) {
      el.masterStatus.textContent = '';
      el.masterStatus.hidden = true;
    }
  } else {
    setGroupMaster([
      { productGroupCode: '110113001', description: 'Coffee', descriptionTha: 'กาแฟ' },
      { productGroupCode: '110301001', description: 'Snacks', descriptionTha: 'ขนม' },
      { productGroupCode: '120206002', description: 'Chocolate', descriptionTha: 'ช็อกโกแลต' },
    ]);
    setSupplierMaster([
      { supplierNo: '11100090', abbreviation: 'AJINOMOTO', nameEng: 'Ajinomoto', nameTha: 'อายิโนะโมะโต๊ะ' },
      { supplierNo: '11100091', abbreviation: 'NESTLE', nameEng: 'Nestle', nameTha: 'เนสเล่' },
    ]);
    if (el.masterStatus) {
      el.masterStatus.textContent = '⚠ サンプルデータを使用中（DBに接続できません）';
      el.masterStatus.hidden = false;
    }
  }
}

init();
