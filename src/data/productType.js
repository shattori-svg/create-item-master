/**
 * 商品区分（メーカーバーコード販売 / 計量器販売商品 / 原材料）
 */
export const PRODUCT_TYPE_MANUFACTURER = 'manufacturer';
export const PRODUCT_TYPE_SCALE = 'scale';
export const PRODUCT_TYPE_RAW_MATERIAL = 'rawMaterial';
export const PRODUCT_TYPE_CONSUMABLES = 'consumables';

export const PRODUCT_TYPES = [
  { value: PRODUCT_TYPE_MANUFACTURER, nameJa: 'メーカーバーコード販売', nameTh: 'ขายบาร์โค้ดผู้ผลิต' },
  { value: PRODUCT_TYPE_SCALE, nameJa: '計量器販売商品', nameTh: 'สินค้าขายตามน้ำหนัก' },
  { value: PRODUCT_TYPE_RAW_MATERIAL, nameJa: '原材料', nameTh: 'วัตถุดิบ' },
  { value: PRODUCT_TYPE_CONSUMABLES, nameJa: '消耗品', nameTh: 'วัสดุสิ้นเปลือง' },
];
