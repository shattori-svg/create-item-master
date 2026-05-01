/**
 * In-store code (admin-only PLU registration) round-trip tests.
 * Covers: export with empty Barcode No. + Barcode Type=PLU, and re-import
 * recovering the useInstoreCode flag.
 * Run: `node tests/excel.instore.test.mjs`
 */
import * as XLSX from 'xlsx';
import assert from 'node:assert/strict';
import { buildItemSheet, parseItemSheet } from '../src/lib/excel.js';

let failures = 0;
function check(name, fn) {
  try {
    fn();
    console.log(`  ok  - ${name}`);
  } catch (err) {
    failures++;
    console.error(`  FAIL - ${name}`);
    console.error(`    ${err.message}`);
  }
}

function aoaToBuffer(aoa) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  XLSX.utils.book_append_sheet(wb, ws, 'Item');
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
}

console.log('In-store code (admin PLU) round-trip');

const baseInstoreItem = {
  productGroupCode: '110113',
  // No barcode — admin in-store code path
  useInstoreCode: true,
  nameEng: 'In-store Item',
  nameTha: 'In-store Item TH',
  sizeEng: '1pcs',
  taxRate: '7',
  supplierCode: 'V012345',
  unitCost: 100,
  orderQty: 1,
  leadTime: 2,
  unitPrice: 150,
  salesQty: 1,
};

check('itemToRow forces empty Barcode No. (col 3) and PLU type (col 2) when useInstoreCode is true', () => {
  const aoa = buildItemSheet([baseInstoreItem], '01', { productType: 'manufacturer' });
  const headerRow = aoa[0];
  const dataRow = aoa[1];
  assert.equal(headerRow[2], 'Barcode Type');
  assert.equal(headerRow[3], 'Barcode No.');
  assert.equal(dataRow[2], 'PLU', 'col 2 must be PLU');
  assert.equal(dataRow[3], '', 'col 3 must be empty');
});

check('itemToRow ignores any stray barcode value when useInstoreCode is true', () => {
  // Even if a stale barcode survives on the item, in-store code path wins.
  const item = { ...baseInstoreItem, barcode: '4901111275195' };
  const aoa = buildItemSheet([item], '01', { productType: 'manufacturer' });
  assert.equal(aoa[1][3], '', 'col 3 must be empty even with a stray barcode');
  assert.equal(aoa[1][2], 'PLU');
});

check('parseItemSheet recovers in-store rows and sets useInstoreCode=true', () => {
  const aoa = buildItemSheet([baseInstoreItem], '01', { productType: 'manufacturer' });
  const buf = aoaToBuffer(aoa);
  const parsed = parseItemSheet(buf);
  assert.equal(parsed.length, 1, 'in-store row must not be skipped on import');
  assert.equal(parsed[0].useInstoreCode, true);
  assert.equal(parsed[0].barcodeType, 'PLU');
  assert.equal(parsed[0].barcode, '');
});

check('parseItemSheet still skips rows where both Barcode No. and Barcode Type are empty', () => {
  // Build a manual sheet where Barcode Type column is left blank and Barcode No. is empty.
  const aoa = buildItemSheet([baseInstoreItem], '01', { productType: 'manufacturer' });
  // Strip Barcode Type from the only data row
  aoa[1][2] = '';
  const buf = aoaToBuffer(aoa);
  const parsed = parseItemSheet(buf);
  assert.equal(parsed.length, 0, 'rows without barcode AND without PLU type must be skipped');
});

check('parseItemSheet does NOT mark rows with a real barcode as in-store', () => {
  const normal = {
    productGroupCode: '110113',
    barcode: '4901111275195',
    nameEng: 'Normal',
    sizeEng: '1pcs',
    taxRate: '7',
    supplierCode: 'V012345',
    unitCost: 100,
    orderQty: 1,
    leadTime: 2,
    unitPrice: 150,
    salesQty: 1,
  };
  const aoa = buildItemSheet([normal], '01', { productType: 'manufacturer' });
  const parsed = parseItemSheet(aoaToBuffer(aoa));
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].useInstoreCode, false);
  assert.equal(parsed[0].barcode, '4901111275195');
});

check('round-trip preserves useInstoreCode through export -> import -> export', () => {
  const aoa1 = buildItemSheet([baseInstoreItem], '01', { productType: 'manufacturer' });
  const parsed1 = parseItemSheet(aoaToBuffer(aoa1));
  assert.equal(parsed1[0].useInstoreCode, true);
  // Re-export the parsed item (carries _rawItemRow + flag) and re-import.
  const aoa2 = buildItemSheet(parsed1, '01', { productType: 'manufacturer' });
  assert.equal(aoa2[1][3], '', 're-export must keep Barcode No. empty');
  assert.equal(aoa2[1][2], 'PLU', 're-export must keep Barcode Type=PLU');
  const parsed2 = parseItemSheet(aoaToBuffer(aoa2));
  assert.equal(parsed2[0].useInstoreCode, true);
});

if (failures > 0) {
  console.error(`\n${failures} test(s) failed`);
  process.exit(1);
}
console.log('\nAll tests passed');
