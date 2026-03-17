/**
 * Excel 読み書き・Item / Additional Barcode マッピング（基本設計書 6）
 */
import * as XLSX from 'xlsx';
import { ITEM_FIXED, TAX_VAT07, TAX_ZERO, POSTING_GROUP_INSTORE, POSTING_GROUP_CKPC, POSTING_GROUP_TRADE, POSTING_GROUP_TRADE_NON } from '../data/constants.js';

/** 計量器: 製造場所に応じて FINISHED-INSTORE / FINISHED-CK/PC */
function getPostingGroupByLocation(manufacturingLocation) {
  return manufacturingLocation === 'ckpc' ? POSTING_GROUP_CKPC : POSTING_GROUP_INSTORE;
}

/** メーカーバーコード: 食品部門(01)→TRADE、それ以外→TRADE-NON */
function getPostingGroupByDepartment(departmentCode) {
  return departmentCode === '01' ? POSTING_GROUP_TRADE : POSTING_GROUP_TRADE_NON;
}

const ITEM_HEADERS = [
  'Department Code', 'Product Group Code', 'Barcode Type', 'Barcode No.', 'Item No.',
  'Description (ENG)', 'Description (THA)', 'Description (JPN)',
  'Barcode Description (ENG)', 'Barcode Description (THA)', 'Barcode Description (JPN)',
  'Base Unit of Measure', 'Size Specification (ENG)', 'Size Specification (THA)', 'Size Specification (JPN)',
  'Height', 'Width', 'Length', 'Weight',
  'Inventory Type', 'Inventory Posting Group', 'Gen. Prod. Posting Group', 'VAT Prod. Posting Group',
  'Vendor No. (default)', 'Vendor Item No. (default)', 'Unit Cost (default)', 'Auto-Replenishment', 'Lead Time Calculation (default)', 'Unit Price (default)', 'Weight Price (default)',
  'Keying in Price', 'Keying in Quantity', 'Zero Price Valid', 'No Discount Allowed', 'Blocked',
  'Country of Origin (ENG)', 'Country of Origin (THA)', 'Country of Origin (JPN)',
  'Brand (ENG)', 'Brand (THA)', 'Brand (JPN)',
  'Manufacturer Name (ENG)', 'Manufacturer Name (THA)', 'Manufacturer Name (JPN)',
  'Importer (ENG)', 'Importer (THA)', 'Importer (JPN)', 'Grade (ENG)', 'Grade (THA)', 'Grade (JPN)'
];

const ADDITIONAL_HEADERS = [
  'Barcode No.', 'Base Barcode No.', 'Barcode Description (ENG)', 'Barcode Description (THA)', 'Barcode Description (JPN)',
  'Barcode Unit of Measure', 'Qty per Unit of Measure', 'Default Purchase UOM',
  'Size Specification (ENG)', 'Size Specification (THA)', 'Size Specification (JPN)',
  'Height', 'Width', 'Length', 'Weight', 'Unit Cost', 'Unit Price'
];

/** 計量器販売用 Ishida Label シートヘッダー（Item_260309 1105.xlsx 準拠） */
const ISHIDA_LABEL_HEADERS = [
  'Barcode No.', 'Ishida PLU No.', 'Ishida Description (ENG)', 'Ishida Description (THA)',
  'Ishida Logo No.', 'Print Packing Date', 'Expiration Days',
  'Ingredient Line 1', 'Ingredient Line 2', 'Ingredient Line 3', 'Ingredient Line 4', 'Ingredient Line 5', 'Ingredient Line 6'
];

/** フォームで編集する列のインデックス（これ以外は _rawItemRow をそのまま保持） */
const ITEM_MANAGED_INDICES = [0, 1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41];

function itemToRow(item, departmentCode, options = {}) {
  const { productType = 'manufacturer' } = options;
  const vat = String(item.taxRate) === '7' ? TAX_VAT07 : TAX_ZERO;
  const barcode = item.barcode != null ? String(item.barcode).trim() : '';
  const barcodeType = item.barcodeType
    ? String(item.barcodeType)
    : (!barcode || barcode.startsWith('20') ? 'PLU' : ITEM_FIXED.barcodeType);
  const postingGroup = productType === 'rawMaterial'
    ? 'MATERIAL'
    : getPostingGroupByDepartment(departmentCode);
  const inventoryType = (productType === 'rawMaterial' || departmentCode !== '01')
    ? 'Non-Inventory'
    : ITEM_FIXED.inventoryType;
  const baseUnitOfMeasure = productType === 'rawMaterial'
    ? (item.orderUnit || ITEM_FIXED.baseUnitOfMeasure)
    : ITEM_FIXED.baseUnitOfMeasure;
  const unitPrice = productType === 'rawMaterial'
    ? 0
    : (item.unitPrice != null ? Number(item.unitPrice) : '');
  const values = [
    departmentCode,
    item.productGroupCode || '',
    barcodeType,
    item.barcode || '',
    null, // 4: Item No. は上書きしない（下で _raw から維持）
    item.nameEng || '',
    item.nameTha || '',
    '',
    item.nameEng || '',
    item.nameTha || '',
    '',
    baseUnitOfMeasure,
    item.sizeEng ?? '1pcs',
    item.sizeTha || '',
    '',
    ITEM_FIXED.height, ITEM_FIXED.width, ITEM_FIXED.length, ITEM_FIXED.weight,
    inventoryType, postingGroup, postingGroup, vat,
    // "Name (CODE)" 形式が混入していた場合はコード部分のみ抽出
    (item.supplierCode ? String(item.supplierCode).replace(/^.*[（(]([^）)]+)[）)]\s*$/, '$1').trim() : ''), // 23: Vendor No. (default)
    null, // 24: Vendor Item No. (default) は上書きしない
    item.unitCost != null ? Number(item.unitCost) : '', // 25: Unit Cost (default)
    ITEM_FIXED.autoReplenishment,
    item.leadTime != null ? Number(item.leadTime) : 2,
    unitPrice,
    ITEM_FIXED.weightPrice,
    ITEM_FIXED.keyingInPrice, ITEM_FIXED.keyingInQuantity, ITEM_FIXED.zeroPriceValid, ITEM_FIXED.noDiscountAllowed, ITEM_FIXED.blocked,
    '', '', '',
    item.brandEng || '', item.brandTha || '', '',
    '', '', '', '', '', '', '', '', ''
  ];
  if (item._rawItemRow && item._rawItemRow.length >= ITEM_HEADERS.length) {
    const row = item._rawItemRow.slice(0, ITEM_HEADERS.length);
    ITEM_MANAGED_INDICES.forEach((idx) => {
      if (values[idx] !== null) row[idx] = values[idx];
    });
    if (item.itemNo !== undefined && item.itemNo !== '') row[4] = item.itemNo;
    else if (row[4] === undefined || row[4] === '') row[4] = '';
    return row;
  }
  const out = values.slice();
  out[4] = item.itemNo ?? '';
  out[24] = '';
  return out;
}

/**
 * 1商品から Additional Barcode 行を生成（基本設計書 6.2）
 * 販売入数>=2 かつ 販売入数!==発注入数 のとき2行（発注入数行 + 販売入数行 Pack）
 */
function itemToAdditionalRows(item) {
  const orderQty = Number(item.orderQty) || 1;
  const salesQty = Number(item.salesQty) || 1;
  const unitCost = Number(item.unitCost) || 0;
  const caseCost = unitCost * orderQty;
  const baseBarcode = item.barcode || '';
  const descEng = item.nameEng || '';
  const descTha = item.nameTha || '';
  const sizeEng = item.sizeEng ?? '1pcs';
  const sizeTha = item.sizeTha || '';
  const caseBarcode = item.caseBarcode ? String(item.caseBarcode).trim() : '';
  const casePrice = item.casePrice != null ? Number(item.casePrice) : 0;
  const caseDescEng = (item.caseName && String(item.caseName).trim()) ? String(item.caseName).trim() : descEng;
  const caseDescTha = (item.caseName && String(item.caseName).trim()) ? String(item.caseName).trim() : descTha;
  const caseSizeEng = (item.caseSizeEng && String(item.caseSizeEng).trim()) ? String(item.caseSizeEng).trim() : sizeEng;
  const caseSizeTha = (item.caseSizeTha && String(item.caseSizeTha).trim()) ? String(item.caseSizeTha).trim() : sizeTha;

  const row1 = [
    caseBarcode, // Barcode No. ケースJANが入力されていれば
    baseBarcode,
    caseDescEng, caseDescTha, '',
    'CTN' + orderQty,
    orderQty,
    1, // Default Purchase UOM
    caseSizeEng, caseSizeTha, '',
    0, 0, 0, 0,
    caseCost,
    0
  ];
  const rows = [row1];

  const needPackRow = salesQty >= 2 && salesQty !== orderQty;
  if (needPackRow) {
    rows.push([
      '', // Barcode No. 販売入数行は空欄
      baseBarcode,
      descEng, descTha, '',
      'Pack',
      salesQty,
      0, // Default Purchase UOM
      sizeEng, sizeTha, '',
      0, 0, 0, 0,
      unitCost, // 単品原価
      casePrice  // ケース売価
    ]);
  }
  return rows;
}

/** 計量器販売商品用の Item 行（Price-embedded, Non-Inventory, FINISHED-INSTORE） */
function itemToRowScale(item, departmentCode) {
  const vat = String(item.taxRate) === '7' ? TAX_VAT07 : TAX_ZERO;
  return [
    departmentCode,
    item.productGroupCode || '',
    'Price-embedded',
    item.barcode || '',
    item.itemNo ?? '',
    item.nameEng || '',
    item.nameTha || '',
    '',
    item.nameEng || '',
    item.nameTha || '',
    '',
    'PCS',
    item.sizeEng ?? '1pcs',
    item.sizeTha || '',
    '',
    0, 0, 0, 0,
    'Non-Inventory',
    getPostingGroupByLocation(item.manufacturingLocation),
    getPostingGroupByLocation(item.manufacturingLocation),
    vat,
    '', '', 0, '0', '', 0, 0,
    'Not Mandatory', 'Not Mandatory', 0, 0, 0,
    '', '', '',
    item.brandEng || '', item.brandTha || '', '',
    '', '', '', '', '', '', ''
  ];
}

/** 計量器販売用 Ishida Label シート 1行 */
function itemToIshidaLabelRow(item) {
  return [
    item.barcode || '',
    item.pluNo ?? '',
    item.nameEng || '',
    item.nameTha || '',
    '',
    '4',
    '2',
    '', '', '', '', '', ''
  ];
}

export function buildItemSheet(items, departmentCode, options = {}) {
  const { productType = 'manufacturer' } = options;
  const rows = productType === 'scale'
    ? items.map((it) => itemToRowScale(it, departmentCode))
    : items.map((it) => itemToRow(it, departmentCode, { productType }));
  return [ITEM_HEADERS, ...rows];
}

export function buildIshidaLabelSheet(items) {
  const rows = items.map((it) => itemToIshidaLabelRow(it));
  return [ISHIDA_LABEL_HEADERS, ...rows];
}

export function buildAdditionalBarcodeSheet(items) {
  const rows = [];
  for (const item of items) {
    rows.push(...itemToAdditionalRows(item));
  }
  return [ADDITIONAL_HEADERS, ...rows];
}

export function exportXlsx(items, departmentCode, options = {}) {
  const { sheetItem = true, sheetAdditional = true, sheetIshida = false, productType = 'manufacturer', filename } = options;
  const wb = XLSX.utils.book_new();

  if (sheetItem) {
    const itemData = buildItemSheet(items, departmentCode, { productType });
    const wsItem = XLSX.utils.aoa_to_sheet(itemData);
    XLSX.utils.book_append_sheet(wb, wsItem, 'Item');
  }
  if (productType === 'scale' && sheetIshida) {
    const ishidaData = buildIshidaLabelSheet(items);
    const wsIshida = XLSX.utils.aoa_to_sheet(ishidaData);
    XLSX.utils.book_append_sheet(wb, wsIshida, 'Ishida Label');
  } else if (productType === 'manufacturer' && sheetAdditional) {
    const addData = buildAdditionalBarcodeSheet(items);
    const wsAdd = XLSX.utils.aoa_to_sheet(addData);
    XLSX.utils.book_append_sheet(wb, wsAdd, 'Additional Barcode');
  }

  const name = filename || `${departmentCode}_${timestamp()}.xlsx`;
  const outName = name.replace(/\.xlsx$/i, '') + '.xlsx';
  XLSX.writeFile(wb, outName);
}

function timestamp() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${y}${m}${day}_${h}${min}${s}`;
}

/**
 * Additional Barcode シートから Base Barcode ごとの発注入数（Qty per Unit of Measure）を取得
 * Barcode Unit of Measure が 'CTN' で始まる行の値を返す
 */
function parseAdditionalOrderQtyMap(wb) {
  const sheet = wb.Sheets['Additional Barcode'];
  if (!sheet) return {};
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  if (data.length < 2) return {};
  const headers = data[0].map((h) => (h != null ? String(h).trim() : ''));
  const map = {};
  headers.forEach((h, i) => { map[h] = i; });
  const baseBarcodeCol = map['Base Barcode No.'];
  const uomCol = map['Barcode Unit of Measure'];
  const qtyCol = map['Qty per Unit of Measure'];
  if (baseBarcodeCol == null || uomCol == null || qtyCol == null) return {};
  const orderQtyByBase = {};
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const baseBarcode = (row[baseBarcodeCol] != null ? String(row[baseBarcodeCol]).trim() : '');
    const uom = (row[uomCol] != null ? String(row[uomCol]).trim() : '');
    if (!baseBarcode || !uom.startsWith('CTN')) continue;
    const qty = row[qtyCol] !== '' && row[qtyCol] != null ? Number(row[qtyCol]) : undefined;
    if (qty != null && !Number.isNaN(qty)) orderQtyByBase[baseBarcode] = qty;
  }
  return orderQtyByBase;
}

/** Ishida Label シートから Barcode No. → Ishida PLU No. のマップを取得 */
function parseIshidaPluMap(wb) {
  const sheet = wb.Sheets['Ishida Label'];
  if (!sheet) return {};
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  if (data.length < 2) return {};
  const headers = data[0].map((h) => (h != null ? String(h).trim() : ''));
  const map = {};
  headers.forEach((h, i) => { map[h] = i; });
  const barcodeCol = map['Barcode No.'];
  const pluCol = map['Ishida PLU No.'];
  if (barcodeCol == null || pluCol == null) return {};
  const pluByBarcode = {};
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const barcode = (row[barcodeCol] != null ? String(row[barcodeCol]).trim() : '');
    const plu = (row[pluCol] != null ? String(row[pluCol]).trim() : '');
    if (barcode) pluByBarcode[barcode] = plu;
  }
  return pluByBarcode;
}

/**
 * Item シートからリスト用オブジェクトを復元（基本設計書 6.3）
 * Ishida Label シートがあれば PLU No. を付与。インポート時は _rawItemRow で行全体を保持
 */
export function parseItemSheet(buffer) {
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheet = wb.Sheets['Item'] || wb.Sheets[wb.SheetNames[0]];
  if (!sheet) return [];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  if (data.length < 2) return [];
  const headers = data[0].map((h) => (h != null ? String(h).trim() : ''));
  const map = {};
  headers.forEach((h, i) => { map[h] = i; });
  const deptCol = map['Department Code'];
  const groupCol = map['Product Group Code'];
  const barcodeTypeCol = map['Barcode Type'];
  const barcodeCol = map['Barcode No.'];
  const itemNoCol = map['Item No.'];
  const nameEngCol = map['Description (ENG)'];
  const nameThaCol = map['Description (THA)'];
  const sizeEngCol = map['Size Specification (ENG)'];
  const sizeThaCol = map['Size Specification (THA)'];
  const baseUomCol = map['Base Unit of Measure'];
  const vatCol = map['VAT Prod. Posting Group'];
  const genProdCol = map['Gen. Prod. Posting Group'];
  const vendorCol = map['Vendor No. (default)'];
  const costCol = map['Unit Cost (default)'];
  const priceCol = map['Unit Price (default)'];
  const leadCol = map['Lead Time Calculation (default)'];
  const brandEngCol = map['Brand (ENG)'];
  const brandThaCol = map['Brand (THA)'];

  const orderQtyByBase = parseAdditionalOrderQtyMap(wb);
  const pluByBarcode = parseIshidaPluMap(wb);

  const items = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const get = (col) => (col != null && row[col] != null ? String(row[col]).trim() : '');
    const getNum = (col) => (col != null && row[col] !== '' ? Number(row[col]) : undefined);
    if (!get(barcodeCol)) continue;
    const barcode = get(barcodeCol);
    const importedBarcodeType = get(barcodeTypeCol);
    const rawRow = ITEM_HEADERS.map((h) => {
      const col = map[h];
      return col != null && row[col] !== undefined && row[col] !== null ? row[col] : '';
    });
    const orderQty = orderQtyByBase[barcode] != null ? orderQtyByBase[barcode] : 1;
    items.push({
      departmentCode: get(deptCol),
      productGroupCode: get(groupCol),
      productGroup: get(groupCol),
      barcode,
      barcodeType: barcode.startsWith('20') ? 'PLU' : importedBarcodeType,
      itemNo: get(itemNoCol),
      pluNo: pluByBarcode[barcode] ?? '',
      nameEng: get(nameEngCol),
      nameTha: get(nameThaCol),
      sizeEng: get(sizeEngCol) || '1pcs',
      sizeTha: get(sizeThaCol),
      taxRate: (get(vatCol) === TAX_VAT07 ? '7' : '0'),
      manufacturingLocation: get(genProdCol) === POSTING_GROUP_CKPC ? 'ckpc' : 'instore',
      supplierCode: get(vendorCol),
      supplier: get(vendorCol),
      unitCost: getNum(costCol),
      orderQty,
      orderUnit: (() => {
        const uom = get(baseUomCol);
        return ['PCS', 'CTN', 'KG'].includes(uom) ? uom : 'PCS';
      })(),
      leadTime: getNum(leadCol) ?? 2,
      unitPrice: getNum(priceCol),
      salesQty: 1,
      caseBarcode: '',
      caseName: '',
      caseSizeEng: '',
      caseSizeTha: '',
      casePrice: undefined,
      brandEng: get(brandEngCol),
      brandTha: get(brandThaCol),
      _rawItemRow: rawRow,
    });
  }
  return items;
}
