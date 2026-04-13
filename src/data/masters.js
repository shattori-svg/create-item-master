/**
 * 分類・仕入先マスタ（Phase1: 静的または空。Phase2 で Google Sheets から取得）
 * 形式: group = { productGroupCode, description, descriptionTha, descriptionJpn }
 *       supplier = { supplierNo, abbreviation, nameEng, nameTha }
 */
let groupMaster = [];
let supplierMaster = [];

export function setGroupMaster(data) {
  groupMaster = Array.isArray(data) ? data : [];
}

export function setSupplierMaster(data) {
  supplierMaster = Array.isArray(data) ? data : [];
}

export function getGroupMaster() {
  return groupMaster;
}

export function getSupplierMaster() {
  return supplierMaster;
}

/** 部門コード(01〜06)から分類・仕入先の頭桁を取得。01→1, 02→2, ... */
function departmentDigit(code) {
  const c = String(code || '').trim();
  return c.length >= 2 ? c.charAt(1) : '';
}

/**
 * 選択部門に属する分類のみ返す（分類コードの1桁目が部門と対応）
 */
export function getGroupMasterForDepartment(departmentCode) {
  const digit = departmentDigit(departmentCode);
  if (!digit) return groupMaster;
  return groupMaster.filter((r) => String(r.productGroupCode || '').charAt(0) === digit);
}

/**
 * 選択部門に属する仕入先のみ返す（仕入先コードの2桁目が部門と対応）
 */
export function getSupplierMasterForDepartment(departmentCode) {
  const digit = departmentDigit(departmentCode);
  if (!digit) return supplierMaster;
  return supplierMaster.filter((r) => String(r.supplierNo || '').charAt(1) === digit);
}

/**
 * 部門＋納品先で仕入先をフィルタ（鮮魚03/惣菜05のみ3桁目で追加フィルタ）
 * deliveryDest: 'store' → 3桁目='1', 'ckpc' → 3桁目='2'
 */
export function getSupplierMasterForDepartmentAndDest(departmentCode, deliveryDest) {
  let filtered = getSupplierMasterForDepartment(departmentCode);
  if (deliveryDest && (departmentCode === '03' || departmentCode === '05')) {
    const destDigit = deliveryDest === 'ckpc' ? '2' : '1';
    filtered = filtered.filter((r) => String(r.supplierNo || '').charAt(2) === destDigit);
  }
  return filtered;
}

/**
 * 商品名から分類を提案（キーワードとマスタの Description 一致でスコア付け）
 * 選択部門に属する分類のみ対象。
 */
export function suggestGroupByProductName(nameEng, nameTha, departmentCode) {
  const base = getGroupMasterForDepartment(departmentCode);
  const text = [nameEng, nameTha].filter(Boolean).join(' ').toLowerCase();
  if (!text.trim()) return [];
  const words = text.replace(/[^\w\u0E00-\u0E7F\s]+/g, ' ').split(/\s+/).filter((w) => w.length > 1);
  if (words.length === 0) return [];
  const scored = base.map((r) => {
    const desc = (String(r.description || '') + ' ' + String(r.descriptionTha || '')).toLowerCase();
    let score = 0;
    for (const w of words) {
      if (desc.includes(w)) score += 1;
    }
    return { ...r, _score: score };
  });
  return scored.filter((r) => r._score > 0).sort((a, b) => b._score - a._score).slice(0, 10);
}

/**
 * 検索用: 選択部門に属する分類のみを名称・コードでフィルタ
 */
/** コンボで表示する分類の最大件数（datalist 用） */
const GROUP_DROPDOWN_LIMIT = 300;

export function filterGroup(query, departmentCode) {
  const base = getGroupMasterForDepartment(departmentCode);
  const q = (query || '').toLowerCase().trim();
  if (!q) return base.slice(0, GROUP_DROPDOWN_LIMIT);
  return base.filter(
    (r) =>
      String(r.productGroupCode || '').toLowerCase().includes(q) ||
      String(r.description || '').toLowerCase().includes(q) ||
      String(r.descriptionTha || '').toLowerCase().includes(q)
  ).slice(0, GROUP_DROPDOWN_LIMIT);
}

/**
 * 検索用: 選択部門に属する仕入先のみを名称・コードでフィルタ
 */
/** コンボで表示する仕入先の最大件数（datalist 用） */
const SUPPLIER_DROPDOWN_LIMIT = 300;

export function filterSupplier(query, departmentCode, deliveryDest) {
  const base = deliveryDest ? getSupplierMasterForDepartmentAndDest(departmentCode, deliveryDest) : getSupplierMasterForDepartment(departmentCode);
  const q = (query || '').toLowerCase().trim();
  if (!q) return base.slice(0, SUPPLIER_DROPDOWN_LIMIT);
  return base.filter(
    (r) =>
      String(r.supplierNo || '').toLowerCase().includes(q) ||
      String(r.abbreviation || '').toLowerCase().includes(q) ||
      String(r.nameEng || '').toLowerCase().includes(q) ||
      String(r.nameTha || '').toLowerCase().includes(q)
  ).slice(0, SUPPLIER_DROPDOWN_LIMIT);
}
