/**
 * バリデーション（基本設計書 7）
 * 必須・重複・文字数・数値・GS-1簡易チェック・チェックディジット
 */

const GS1_LENGTHS = [8, 12, 13, 14]; // EAN-8, UPC-12, EAN-13, GTIN-14

/**
 * GS1 Modulo 10 チェックディジット検証（右端がチェック桁）
 * 右から 3, 1, 3, 1... で掛けて合計し、(10 - sum%10) % 10 がチェック桁と一致するか
 */
function isValidCheckDigit(s) {
  const digits = s.split('').map(Number);
  const checkDigit = digits.pop();
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    const weight = (digits.length - 1 - i) % 2 === 0 ? 3 : 1;
    sum += digits[i] * weight;
  }
  const expected = (10 - (sum % 10)) % 10;
  return checkDigit === expected;
}

export function validateBarcode(value) {
  if (!value || !String(value).trim()) return { ok: false, key: 'required' };
  const s = String(value).trim();
  if (!/^\d+$/.test(s)) return { ok: false, key: 'barcodeInvalid' };
  if (!GS1_LENGTHS.includes(s.length)) return { ok: false, key: 'barcodeInvalid' };
  if (!isValidCheckDigit(s)) return { ok: false, key: 'barcodeCheckDigit' };
  return { ok: true };
}

export function validateRequired(value) {
  if (value == null || String(value).trim() === '') return { ok: false, key: 'required' };
  return { ok: true };
}

export function validateMaxLength(value, max) {
  if (value == null) return { ok: true };
  if (String(value).length > max) return { ok: false, key: 'nameMaxLength' };
  return { ok: true };
}

export function validateNumeric(value, allowEmpty = false) {
  if (value == null || String(value).trim() === '') return allowEmpty ? { ok: true } : { ok: false, key: 'required' };
  const n = Number(value);
  if (Number.isNaN(n) || n < 0) return { ok: false, key: 'numeric' };
  return { ok: true };
}

export function validateFormFields(fields, existingBarcodes = []) {
  const errors = {};
  const barcodeResult = validateBarcode(fields.barcode);
  if (!barcodeResult.ok) errors.barcode = barcodeResult.key;
  else if (existingBarcodes.includes(String(fields.barcode).trim())) errors.barcode = 'barcodeDuplicate';

  if (!validateRequired(fields.productGroupCode || fields.productGroup).ok) errors.productGroup = 'required';
  if (!validateRequired(fields.nameEng).ok) errors.nameEng = 'required';
  if (!validateMaxLength(fields.nameEng, 60).ok) errors.nameEng = 'nameMaxLength';
  if (fields.nameTha != null && fields.nameTha !== '' && !validateMaxLength(fields.nameTha, 60).ok) errors.nameTha = 'nameMaxLength';
  if (!validateRequired(fields.supplierCode || fields.supplier).ok) errors.supplier = 'required';
  if (!validateNumeric(fields.unitCost).ok) errors.unitCost = 'numeric';
  if (!validateNumeric(fields.orderQty).ok) errors.orderQty = 'numeric';
  if (!validateNumeric(fields.unitPrice).ok) errors.unitPrice = 'numeric';
  if (!validateNumeric(fields.salesQty).ok) errors.salesQty = 'numeric';

  const salesQty = Number(fields.salesQty);
  if (salesQty >= 2) {
    if (!validateRequired(fields.caseBarcode).ok) errors.caseBarcode = 'required';
    if (!validateNumeric(fields.casePrice).ok) errors.casePrice = 'numeric';
  }

  return errors;
}

export function validateForExport(items, department) {
  const list = [];
  if (!items || items.length === 0) list.push('export.noItems');
  if (!department) list.push('export.noDepartment');
  items?.forEach((it, i) => {
    if (!it.barcode) list.push(`#${i + 1} barcode`);
    if (!it.productGroupCode) list.push(`#${i + 1} classification`);
    if (!it.nameEng) list.push(`#${i + 1} name`);
    if (Number(it.salesQty) >= 2 && (!it.caseBarcode || it.casePrice == null)) list.push(`#${i + 1} case`);
  });
  return list;
}
