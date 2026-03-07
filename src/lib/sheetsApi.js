/**
 * Google Sheets API v4 でスプレッドシートからマスタを取得（要件定義書 2.3）
 * シート名: group（分類）, supplier（仕入先）
 */
import {
  SPREADSHEET_ID,
  GROUP_SHEET_NAME,
  SUPPLIER_SHEET_NAME,
  GOOGLE_SHEETS_API_KEY,
} from '../data/sheetConfig.js';

const BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

function getSheetValues(sheetName) {
  if (!GOOGLE_SHEETS_API_KEY) return Promise.resolve(null);
  const range = encodeURIComponent(`${sheetName}!A:Z`);
  const url = `${BASE}/${SPREADSHEET_ID}/values/${range}?key=${GOOGLE_SHEETS_API_KEY}`;
  return fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(`Sheets API: ${res.status}`);
      return res.json();
    })
    .then((data) => data.values || null);
}

/** 1行目をヘッダーとして列名→インデックスのマップを返す */
function parseHeaders(row) {
  const map = {};
  (row || []).forEach((cell, i) => {
    const key = String(cell || '').trim();
    if (key) map[key] = i;
  });
  return map;
}

/** 分類マスタ: Item Category Code, Product Group Code, Description, Description (THA), Description (JPN) */
function parseGroupRows(values) {
  if (!values || values.length < 2) return [];
  const headers = parseHeaders(values[0]);
  const code = headers['Product Group Code'];
  const desc = headers['Description'];
  const descTha = headers['Description (THA)'];
  const descJpn = headers['Description (JPN)'];
  if (code == null) return [];
  const rows = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const productGroupCode = row && row[code] != null ? String(row[code]).trim() : '';
    if (!productGroupCode) continue;
    rows.push({
      productGroupCode,
      description: row && row[desc] != null ? String(row[desc]).trim() : '',
      descriptionTha: row && descTha != null && row[descTha] != null ? String(row[descTha]).trim() : '',
      descriptionJpn: row && descJpn != null && row[descJpn] != null ? String(row[descJpn]).trim() : '',
    });
  }
  return rows;
}

/** 仕入先マスタ: Supplier No., Abbreviation, Supplier Official Name (English）, Supplier Official Name (Thai） */
function parseSupplierRows(values) {
  if (!values || values.length < 2) return [];
  const headers = parseHeaders(values[0]);
  const no = headers['Supplier No.'];
  const abbr = headers['Abbreviation'];
  const nameEng = headers['Supplier Official Name (English）'] ?? headers['Supplier Official Name (English)'];
  const nameTha = headers['Supplier Official Name (Thai）'] ?? headers['Supplier Official Name (Thai)'];
  if (no == null) return [];
  const rows = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const supplierNo = row && row[no] != null ? String(row[no]).trim() : '';
    if (!supplierNo) continue;
    rows.push({
      supplierNo,
      abbreviation: row && abbr != null && row[abbr] != null ? String(row[abbr]).trim() : '',
      nameEng: row && nameEng != null && row[nameEng] != null ? String(row[nameEng]).trim() : '',
      nameTha: row && nameTha != null && row[nameTha] != null ? String(row[nameTha]).trim() : '',
    });
  }
  return rows;
}

/**
 * スプレッドシートから分類・仕入先マスタを取得し、{ group, supplier } で返す。
 * API キー未設定または失敗時は null を返す。
 */
export async function fetchMastersFromSheet() {
  if (!GOOGLE_SHEETS_API_KEY) return null;
  try {
    const [groupValues, supplierValues] = await Promise.all([
      getSheetValues(GROUP_SHEET_NAME),
      getSheetValues(SUPPLIER_SHEET_NAME),
    ]);
    return {
      group: parseGroupRows(groupValues),
      supplier: parseSupplierRows(supplierValues),
    };
  } catch (err) {
    console.warn('Sheets fetch failed:', err);
    return null;
  }
}
