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

function validateBarcodeWithoutCheckDigit(value) {
  if (!value || !String(value).trim()) return { ok: false, key: 'required' };
  const s = String(value).trim();
  if (!/^\d+$/.test(s)) return { ok: false, key: 'barcodeInvalid' };
  if (!GS1_LENGTHS.includes(s.length)) return { ok: false, key: 'barcodeInvalid' };
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

export function validateFormFields(fields, existingBarcodes = [], productType = 'manufacturer') {
  const errors = {};

  if (productType === 'scale') {
    // 計量器販売: バーコードはインポート由来のため形式のみ検証（チェックデジットは検証しない）
    if (fields.barcode && String(fields.barcode).trim()) {
      const barcodeResult = validateBarcodeWithoutCheckDigit(fields.barcode);
      if (!barcodeResult.ok) errors.barcode = barcodeResult.key;
      else if (existingBarcodes.includes(String(fields.barcode).trim())) errors.barcode = 'barcodeDuplicate';
    }
    if (!validateRequired(fields.productGroupCode || fields.productGroup).ok) errors.productGroup = 'required';
    if (!validateRequired(fields.nameEng).ok) errors.nameEng = 'required';
    if (!validateMaxLength(fields.nameEng, 60).ok) errors.nameEng = 'nameMaxLength';
    if (fields.nameTha != null && fields.nameTha !== '' && !validateMaxLength(fields.nameTha, 60).ok) errors.nameTha = 'nameMaxLength';
    // 呼出番号は1回目インポート後に入力するため、初回登録時は必須にしない
    return errors;
  }
  if (productType === 'rawMaterial' || productType === 'consumables') {
    // 原材料: バーコードは任意（入力時のみ検証）、販売情報は不要
    if (fields.barcode && String(fields.barcode).trim()) {
      const barcodeResult = validateBarcode(fields.barcode);
      if (!barcodeResult.ok) errors.barcode = barcodeResult.key;
      else if (existingBarcodes.includes(String(fields.barcode).trim())) errors.barcode = 'barcodeDuplicate';
    }
    if (!validateRequired(fields.productGroupCode || fields.productGroup).ok) errors.productGroup = 'required';
    if (!validateRequired(fields.nameEng).ok) errors.nameEng = 'required';
    if (!validateMaxLength(fields.nameEng, 60).ok) errors.nameEng = 'nameMaxLength';
    if (fields.nameTha != null && fields.nameTha !== '' && !validateMaxLength(fields.nameTha, 60).ok) errors.nameTha = 'nameMaxLength';
    if (!validateRequired(fields.supplierCode || fields.supplier).ok) errors.supplier = 'required';
    if (!validateNumeric(fields.unitCost).ok) errors.unitCost = 'numeric';
    if (!validateRequired(fields.orderUnit).ok) errors.orderUnit = 'required';
    return errors;
  }

  // インストアコード登録（admin限定）はバーコード未入力＋PLU扱いでメーカーバーコード販売区分に登録する。
  // バーコード必須・GS-1 形式・重複チェックをすべてスキップする（重複は仕様上許容）。
  if (!fields.useInstoreCode) {
    const barcodeResult = validateBarcode(fields.barcode);
    if (!barcodeResult.ok) errors.barcode = barcodeResult.key;
    else if (existingBarcodes.includes(String(fields.barcode).trim())) errors.barcode = 'barcodeDuplicate';
  }

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

/**
 * @param {object} [options]
 * @param {boolean} [options.requirePluForScale] 計量器で Ishida Label を出力する場合のみ true（2回目インポート用）
 */
export function validateForExport(items, department, productType = 'manufacturer', options = {}) {
  const { requirePluForScale = false } = options;
  const list = [];
  if (!items || items.length === 0) list.push('export.noItems');
  if (!department) list.push('export.noDepartment');
  items?.forEach((it, i) => {
    // 計量器(Itemのみ)と原材料/消耗品、admin のインストアコード登録行はバーコード未入力可
    const needBarcode = ((productType === 'manufacturer') || (productType === 'scale' && requirePluForScale)) && !it.useInstoreCode;
    if (needBarcode && !it.barcode) list.push(`#${i + 1} barcode`);
    const classification = it.productGroupCode || it.productGroup || '';
    if (!classification || !String(classification).trim()) list.push(`#${i + 1} classification`);
    const nameEng = it.nameEng != null ? String(it.nameEng).trim() : '';
    if (!nameEng) list.push(`#${i + 1} name`);
    if (productType === 'scale' && requirePluForScale) {
      if (it.pluNo == null || String(it.pluNo).trim() === '') list.push(`#${i + 1} pluNo`);
    } else if (productType === 'manufacturer') {
      if (Number(it.salesQty) >= 2 && (!it.caseBarcode || it.casePrice == null)) list.push(`#${i + 1} case`);
    }
    // 原材料/消耗品: 仕入先・原価は必須
    if (productType === 'rawMaterial' || productType === 'consumables') {
      const supplier = it.supplierCode || it.supplier || '';
      if (!String(supplier).trim()) list.push(`#${i + 1} supplier`);
      if (it.unitCost == null || String(it.unitCost).trim() === '') list.push(`#${i + 1} unitCost`);
    }
  });
  return list;
}

/**
 * Gen. Prod. Posting Group から商品区分を推定
 */
function inferProductTypeFromPostingGroup(genProd) {
  if (genProd === 'MATERIAL') return 'rawMaterial';
  if (genProd === 'SUPPLIES') return 'consumables';
  if (genProd === 'FINISHED-INSTORE' || genProd === 'FINISHED-CK/PC') return 'scale';
  if (genProd === 'TRADE' || genProd === 'TRADE-NON') return 'manufacturer';
  return null;
}

/**
 * インポート時のバリデーション: 部門・分類・商品区分の整合性チェック
 * @returns {Array<{index: number, key: string}>} エラーリスト（空なら合格）
 */
export function validateImportItems(parsedItems, selectedDepartment, selectedProductType) {
  const errors = [];
  const deptDigit = selectedDepartment.length >= 2 ? selectedDepartment.charAt(1) : '';

  for (let i = 0; i < parsedItems.length; i++) {
    const item = parsedItems[i];
    const num = i + 1;

    // 部門コードチェック
    if (item.departmentCode && item.departmentCode !== selectedDepartment) {
      errors.push({ index: num, key: 'importDeptMismatch', expected: selectedDepartment, actual: item.departmentCode });
    }

    // 分類コードの1桁目が部門桁と一致するかチェック
    if (item.productGroupCode && deptDigit) {
      const classFirstDigit = String(item.productGroupCode).charAt(0);
      if (classFirstDigit !== deptDigit) {
        errors.push({ index: num, key: 'importClassMismatch', expected: deptDigit, actual: classFirstDigit });
      }
    }

    // 商品区分チェック（Gen. Prod. Posting Group から推定）
    const genProd = item._rawItemRow ? String(item._rawItemRow[21] || '').trim() : '';
    if (genProd) {
      const inferredType = inferProductTypeFromPostingGroup(genProd);
      if (inferredType && inferredType !== selectedProductType) {
        errors.push({ index: num, key: 'importTypeMismatch', expected: selectedProductType, actual: inferredType });
      }
    }
  }
  return errors;
}
