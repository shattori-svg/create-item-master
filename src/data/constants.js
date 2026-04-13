/**
 * 固定値・定数（基本設計書 6.1）
 */
export const MAX_ITEMS = 100;

export const TAX_VAT07 = 'VAT07';
export const TAX_ZERO = 'VAT00'; // 0%用。仕様書で要確認

export const ITEM_FIXED = {
  barcodeType: 'Manufacturer',
  baseUnitOfMeasure: 'PCS',
  inventoryType: 'Inventory',
  inventoryPostingGroup: 'TRADE',
  genProdPostingGroup: 'TRADE',
  keyingInPrice: 'Not Mandatory',
  keyingInQuantity: 'Not Mandatory',
  zeroPriceValid: 0,
  noDiscountAllowed: 0,
  blocked: 0,
  autoReplenishment: 0,
  weightPrice: 0,
  height: 0,
  width: 0,
  length: 0,
  weight: 0,
};

export const DEFAULT_SPEC_ENG = '1pcs';
export const DEFAULT_SALES_QTY = 1;
export const DEFAULT_TAX_RATE = 7;
export const DEFAULT_LEAD_TIME = 2;

/** 製造場所（計量器のみ）: 店舗→FINISHED-INSTORE, CK/PC→FINISHED-CK/PC */
export const MANUFACTURING_LOCATION_INSTORE = 'instore';
export const MANUFACTURING_LOCATION_CKPC = 'ckpc';
export const POSTING_GROUP_INSTORE = 'FINISHED-INSTORE';
export const POSTING_GROUP_CKPC = 'FINISHED-CK/PC';

/** 消耗品: Gen. Prod. / Inventory Posting Group = SUPPLIES */
export const POSTING_GROUP_SUPPLIES = 'SUPPLIES';

/** メーカーバーコード: 食品部門(01)→TRADE、それ以外→TRADE-NON（Inventory / Gen. Prod. Posting Group） */
export const POSTING_GROUP_TRADE = 'TRADE';
export const POSTING_GROUP_TRADE_NON = 'TRADE-NON';

/** 出力ファイル名のデフォルト（日付付き） */
export function getDefaultOutputFilename() {
  const yyyy = new Date().getFullYear();
  const mm = String(new Date().getMonth() + 1).padStart(2, '0');
  const dd = String(new Date().getDate()).padStart(2, '0');
  return `item_import_${yyyy}${mm}${dd}.xlsx`;
}

/** Business Central インポート画面のURL（ファイル出力後のポップアップから遷移） */
export const IMPORT_PAGE_URL = 'https://businesscentral.dynamics.com/59c6a663-32d3-4566-84d5-203653f4b8b0/Production?company=LOPIA%20(Thailand)%20Co.%2C%20Ltd.&node=00000000-21b2-0000-1504-f700836bd2d2&page=60004&dc=0';
