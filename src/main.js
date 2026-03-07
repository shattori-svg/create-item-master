/**
 * 商品登録 取り込みファイル作成システム - メイン
 * 基本設計書・要件定義書に基づく Phase1 実装
 */
import { initI18n, setLanguage, t, getLang } from './lib/i18n.js';
import { DEPARTMENTS } from './data/departments.js';
import { MAX_ITEMS, DEFAULT_SPEC_ENG, DEFAULT_SALES_QTY, DEFAULT_TAX_RATE, DEFAULT_LEAD_TIME, IMPORT_PAGE_URL, getDefaultOutputFilename } from './data/constants.js';
import { setGroupMaster, setSupplierMaster, getGroupMasterForDepartment, filterGroup, filterSupplier, suggestGroupByProductName } from './data/masters.js';
import { suggestClassificationWithGenAI, hasGenAIConfig } from './lib/genaiSuggest.js';
import { fetchMastersFromSheet } from './lib/sheetsApi.js';
import { validateFormFields, validateForExport } from './lib/validation.js';
import { exportXlsx, parseItemSheet } from './lib/excel.js';

// --- State ---
let items = [];
let selectedDepartment = '01';
let editingIndex = -1;

// --- DOM ---
const el = {
  department: document.getElementById('department'),
  departmentWarn: document.getElementById('department-warn'),
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
  supplier: document.getElementById('supplier'),
  supplierCode: document.getElementById('supplierCode'),
  supplierList: document.getElementById('supplier-list'),
  unitCost: document.getElementById('unitCost'),
  orderQty: document.getElementById('orderQty'),
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
  tbody: document.getElementById('item-tbody'),
  selectAll: document.getElementById('select-all'),
  btnDelete: document.getElementById('btn-delete'),
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
  btnSuggestClassification: document.getElementById('btn-suggest-classification'),
  suggestSourceMsg: document.getElementById('suggest-source-msg'),
  numpad: document.getElementById('numpad'),
};

const errorIds = {
  productGroup: 'err-productGroup',
  barcode: 'err-barcode',
  nameEng: 'err-nameEng',
  nameTha: 'err-nameTha',
  supplier: 'err-supplier',
  caseBarcode: 'err-caseBarcode',
  casePrice: 'err-casePrice',
};

// --- I18n ---
async function init() {
  await initI18n();
  setLanguage('ja');
  await loadMastersFromSheet();
  function refreshDepartmentOptions() {
  const lang = getLang();
  Array.from(el.department.options).forEach((opt) => {
    const d = DEPARTMENTS.find((x) => x.code === opt.value);
    if (d) opt.textContent = `${d.code} ${lang === 'ja' ? d.nameJa : d.nameTh}`;
  });
}
  document.getElementById('btn-lang-ja').addEventListener('click', () => { setLanguage('ja'); refreshDepartmentOptions(); document.querySelectorAll('.lang-btn').forEach((b) => b.classList.remove('active')); document.getElementById('btn-lang-ja').classList.add('active'); });
  document.getElementById('btn-lang-th').addEventListener('click', () => { setLanguage('th'); refreshDepartmentOptions(); document.querySelectorAll('.lang-btn').forEach((b) => b.classList.remove('active')); document.getElementById('btn-lang-th').classList.add('active'); });

  fillDepartmentSelect();
  setDefaultFormValues();
  if (el.outputFilename) el.outputFilename.value = getDefaultOutputFilename();
  toggleCaseFields(Number(el.salesQty?.value || 1) >= 2);
  bindForm();
  bindFocusSelectAll();
  bindRequiredFeedback();
  bindClearButton();
  bindSalesQtyToggle();
  bindComboProductGroup();
  bindComboSupplier();
  bindDepartmentChange();
  bindTable();
  bindOutput();
  bindNumpad();
  renderTable();
  updateRequiredFeedback();
  updateExportButtonState();
}

function fillDepartmentSelect() {
  const lang = getLang();
  DEPARTMENTS.forEach((d) => {
    const opt = document.createElement('option');
    opt.value = d.code;
    opt.textContent = `${d.code} ${lang === 'ja' ? d.nameJa : d.nameTh}`;
    el.department.appendChild(opt);
  });
  el.department.value = selectedDepartment;
}

function setDefaultFormValues() {
  el.sizeEng.value = DEFAULT_SPEC_ENG;
  el.salesQty.value = String(DEFAULT_SALES_QTY);
  el.taxRate.value = String(DEFAULT_TAX_RATE);
  el.leadTime.value = String(DEFAULT_LEAD_TIME);
}

function bindForm() {
  /** Enter で次へ進む順（推測ボタンは含めず、分類→規格英語→…→ブランド泰→入力完了） */
  const ENTER_FOCUS_ORDER = [
    'barcode', 'nameEng', 'nameTha', 'productGroup',
    'sizeEng', 'sizeTha', 'taxRate', 'supplier',
    'unitCost', 'orderQty', 'leadTime', 'unitPrice', 'salesQty',
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
    const errors = validateFormFields(fields, existingBarcodes);
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
    if (editingIndex >= 0) {
      const prev = items[editingIndex];
      if (prev._rawItemRow) item._rawItemRow = prev._rawItemRow;
      if (prev.itemNo !== undefined) item.itemNo = prev.itemNo;
      items[editingIndex] = item;
      editingIndex = -1;
      el.btnAdd.textContent = t('btn.add');
    } else {
      items.push(item);
    }
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
    supplier: el.supplier.value.trim(),
    supplierCode: el.supplierCode.value.trim(),
    unitCost: el.unitCost.value,
    orderQty: el.orderQty.value,
    leadTime: el.leadTime.value,
    unitPrice: el.unitPrice.value,
    salesQty: el.salesQty.value,
    caseBarcode: el.caseBarcode.value.trim(),
    caseName: el.caseName?.value.trim() ?? '',
    caseSizeEng: el.caseSizeEng?.value.trim() ?? '',
    caseSizeTha: el.caseSizeTha?.value.trim() ?? '',
    casePrice: el.casePrice.value,
    brandEng: el.brandEng.value.trim(),
    brandTha: el.brandTha.value.trim(),
  };
}

function formDataToItem(f) {
  return {
    productGroupCode: f.productGroupCode || f.productGroup,
    productGroup: f.productGroup || f.productGroupCode,
    barcode: f.barcode,
    nameEng: f.nameEng,
    nameTha: f.nameTha,
    sizeEng: f.sizeEng || DEFAULT_SPEC_ENG,
    sizeTha: f.sizeTha,
    taxRate: f.taxRate,
    supplierCode: f.supplierCode || f.supplier,
    supplier: f.supplier || f.supplierCode,
    unitCost: f.unitCost !== '' ? Number(f.unitCost) : undefined,
    orderQty: f.orderQty !== '' ? Number(f.orderQty) : 1,
    leadTime: f.leadTime !== '' ? Number(f.leadTime) : DEFAULT_LEAD_TIME,
    unitPrice: f.unitPrice !== '' ? Number(f.unitPrice) : undefined,
    salesQty: f.salesQty !== '' ? Number(f.salesQty) : DEFAULT_SALES_QTY,
    caseBarcode: f.caseBarcode,
    caseName: f.caseName || '',
    caseSizeEng: f.caseSizeEng || '',
    caseSizeTha: f.caseSizeTha || '',
    casePrice: f.casePrice !== '' ? Number(f.casePrice) : undefined,
    brandEng: f.brandEng,
    brandTha: f.brandTha,
  };
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
  editingIndex = -1;
  el.btnAdd.textContent = t('btn.add');
  toggleCaseFields(Number(el.salesQty.value) >= 2);
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
  const caseVisible = !el.caseFields.hidden;
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
        btn.textContent = t('btn.suggesting') || '...';
        result = await suggestClassificationWithGenAI(nameEng, nameTha, groupForDept);
        if (result) usedAI = true;
        btn.textContent = t('btn.suggest');
        btn.disabled = false;
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
  el.department.addEventListener('change', () => {
    if (items.length > 0) {
      el.departmentWarn.textContent = t('error.departmentLocked');
      el.department.value = selectedDepartment;
      return;
    }
    el.departmentWarn.textContent = '';
    selectedDepartment = el.department.value;
    clearComboSelectionsIfInvalid();
    refreshClassificationCombo();
    refreshSupplierCombo();
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

function bindTable() {
  el.selectAll.addEventListener('change', () => {
    const checked = el.selectAll.checked;
    el.tbody.querySelectorAll('input[type="checkbox"]').forEach((cb) => (cb.checked = checked));
  });
  el.btnDelete.addEventListener('click', () => {
    const indexes = [];
    el.tbody.querySelectorAll('tr').forEach((tr, i) => {
      if (tr.querySelector('input[type="checkbox"]')?.checked) indexes.push(i);
    });
    indexes.sort((a, b) => b - a).forEach((i) => items.splice(i, 1));
    renderTable();
  });
}

function updateExportButtonState() {
  if (!el.btnExport) return;
  const errs = validateForExport(items, selectedDepartment);
  el.btnExport.disabled = errs.length > 0;
}

function renderTable() {
  el.tbody.innerHTML = '';
  items.forEach((item, i) => {
    const tr = document.createElement('tr');
    tr.dataset.index = i;
    tr.classList.toggle('selected', i === editingIndex);
    tr.innerHTML = `
      <td><input type="checkbox" class="row-check" /></td>
      <td class="cell-barcode">${escapeHtml(item.barcode || '')}</td>
      <td class="cell-name" title="${escapeHtml(item.nameEng || '')}">${escapeHtml((item.nameEng || '').slice(0, 50))}${(item.nameEng || '').length > 50 ? '…' : ''}</td>
      <td class="cell-name" title="${escapeHtml(item.nameTha || '')}">${escapeHtml((item.nameTha || '').slice(0, 50))}${(item.nameTha || '').length > 50 ? '…' : ''}</td>
      <td>${escapeHtml(item.productGroupCode || '')}</td>
      <td class="cell-name" title="${escapeHtml(item.supplier || item.supplierCode || '')}">${escapeHtml((item.supplier || item.supplierCode || '').slice(0, 30))}${(item.supplier || item.supplierCode || '').length > 30 ? '…' : ''}</td>
      <td>${item.orderQty != null ? item.orderQty : ''}</td>
      <td>${item.unitCost != null ? item.unitCost : ''}</td>
      <td>${item.unitPrice != null ? item.unitPrice : ''}</td>
    `;
    const startEdit = (e) => {
      if (e.target.closest('input[type="checkbox"]')) return;
      startEditRow(i);
    };
    tr.addEventListener('click', startEdit);
    el.tbody.appendChild(tr);
  });
  el.listMaxWarn.hidden = items.length < MAX_ITEMS;
  if (items.length >= MAX_ITEMS) el.listMaxWarn.textContent = t('error.listMax');
  updateExportButtonState();
}

function startEditRow(i) {
  editingIndex = i;
  fillForm(items[i]);
  el.btnAdd.textContent = t('btn.edit');
  el.tbody.querySelectorAll('tr').forEach((row, idx) => {
    row.classList.toggle('selected', idx === i);
  });
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
  el.supplierCode.value = item.supplierCode || '';
  el.supplier.value = item.supplier || item.supplierCode || '';
  el.unitCost.value = item.unitCost != null ? item.unitCost : '';
  el.orderQty.value = item.orderQty != null ? item.orderQty : '';
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
  toggleCaseFields(Number(el.salesQty.value) >= 2);
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
  el.btnExport.addEventListener('click', () => {
    const errs = validateForExport(items, selectedDepartment);
    if (errs.length > 0) {
      el.exportErrors.hidden = false;
      const prefix = getLang() === 'ja' ? '出力できません: ' : 'Cannot export: ';
      el.exportErrors.textContent = prefix + errs.join(', ');
      return;
    }
    el.exportErrors.hidden = true;
    const name = el.outputFilename.value.trim();
    exportXlsx(items, selectedDepartment, {
      sheetItem: el.outItem.checked,
      sheetAdditional: el.outAdditional.checked,
      filename: name || undefined,
    });
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
        const existing = new Set(items.map((it) => it.barcode));
        const toAdd = parsed.filter((it) => it.barcode && !existing.has(it.barcode));
        toAdd.forEach((it) => existing.add(it.barcode));
        items = items.concat(toAdd);
        renderTable();
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

/** スプレッドシートから分類・仕入先マスタを読み込み。失敗時はサンプルデータを使用 */
async function loadMastersFromSheet() {
  const result = await fetchMastersFromSheet();
  if (result && (result.group.length > 0 || result.supplier.length > 0)) {
    setGroupMaster(result.group);
    setSupplierMaster(result.supplier);
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
  }
  if (el.masterStatus) el.masterStatus.hidden = true;
}

init();
