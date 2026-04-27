/**
 * Round-trip test: form item -> Item sheet -> parsed item.
 * Plain Node script (no test framework yet — see TODO P2 "Introducing unit tests").
 * Run: `node tests/excel.roundtrip.test.mjs`
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

console.log('Vendor Item No. round-trip');

const baseItem = {
  productGroupCode: '110113',
  barcode: '4901111275195',
  nameEng: 'Test Item ENG',
  nameTha: 'Test Item THA',
  sizeEng: '1pcs',
  sizeTha: '',
  taxRate: '7',
  supplierCode: 'V012345',
  unitCost: 100,
  orderQty: 1,
  leadTime: 2,
  unitPrice: 150,
  salesQty: 1,
  brandEng: '',
  brandTha: '',
};

check('itemToRow writes supplierItemCode at column index 24', () => {
  const item = { ...baseItem, supplierItemCode: 'SUP-9999' };
  const aoa = buildItemSheet([item], '01', { productType: 'manufacturer' });
  const headerRow = aoa[0];
  const dataRow = aoa[1];
  assert.equal(headerRow[24], 'Vendor Item No. (default)', 'header column 24 must be Vendor Item No. (default)');
  assert.equal(dataRow[24], 'SUP-9999', 'data column 24 must equal the supplied vendor item code');
});

check('itemToRow leaves column 24 empty when supplierItemCode is omitted', () => {
  const item = { ...baseItem };
  const aoa = buildItemSheet([item], '01', { productType: 'manufacturer' });
  assert.equal(aoa[1][24], '', 'data column 24 must be empty string when omitted');
});

check('parseItemSheet reads supplierItemCode from Vendor Item No. column', () => {
  const item = { ...baseItem, supplierItemCode: 'SUP-ABC-001' };
  const aoa = buildItemSheet([item], '01', { productType: 'manufacturer' });
  const buf = aoaToBuffer(aoa);
  const parsed = parseItemSheet(buf);
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].supplierItemCode, 'SUP-ABC-001');
});

check('round-trip preserves supplierItemCode through export-import', () => {
  const item = { ...baseItem, supplierItemCode: 'ROUND-TRIP-42' };
  const aoa1 = buildItemSheet([item], '01', { productType: 'manufacturer' });
  const buf1 = aoaToBuffer(aoa1);
  const parsed1 = parseItemSheet(buf1);
  // Re-export the parsed item (carries _rawItemRow) and re-import again.
  const aoa2 = buildItemSheet(parsed1, '01', { productType: 'manufacturer' });
  const buf2 = aoaToBuffer(aoa2);
  const parsed2 = parseItemSheet(buf2);
  assert.equal(parsed2[0].supplierItemCode, 'ROUND-TRIP-42');
});

check('updating supplierItemCode on an imported item overwrites the raw row', () => {
  const item = { ...baseItem, supplierItemCode: 'ORIGINAL' };
  const aoa = buildItemSheet([item], '01', { productType: 'manufacturer' });
  const parsed = parseItemSheet(aoaToBuffer(aoa));
  const edited = { ...parsed[0], supplierItemCode: 'EDITED' };
  const aoaOut = buildItemSheet([edited], '01', { productType: 'manufacturer' });
  assert.equal(aoaOut[1][24], 'EDITED', 'edited supplierItemCode must overwrite imported raw row value');
});

check('clearing supplierItemCode on an imported item writes empty string', () => {
  const item = { ...baseItem, supplierItemCode: 'TO-BE-CLEARED' };
  const aoa = buildItemSheet([item], '01', { productType: 'manufacturer' });
  const parsed = parseItemSheet(aoaToBuffer(aoa));
  const edited = { ...parsed[0], supplierItemCode: '' };
  const aoaOut = buildItemSheet([edited], '01', { productType: 'manufacturer' });
  assert.equal(aoaOut[1][24], '', 'empty supplierItemCode must overwrite the imported value');
});

if (failures > 0) {
  console.error(`\n${failures} test(s) failed`);
  process.exit(1);
}
console.log('\nAll tests passed');
