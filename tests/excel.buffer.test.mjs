/**
 * Sanity test for buildXlsxBuffer: confirms the buffer is a valid xlsx
 * that can be re-parsed via parseItemSheet (used for GCS upload payload).
 * Run: `node tests/excel.buffer.test.mjs`
 */
import assert from 'node:assert/strict';
import { buildXlsxBuffer, parseItemSheet } from '../src/lib/excel.js';

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

console.log('buildXlsxBuffer');

const sampleItem = {
  productGroupCode: '110113',
  barcode: '4901111275195',
  nameEng: 'Buffer Test ENG',
  nameTha: 'Buffer Test THA',
  sizeEng: '1pcs',
  taxRate: '7',
  supplierCode: 'V012345',
  supplierItemCode: 'SUP-BUF-1',
  unitCost: 100,
  orderQty: 1,
  leadTime: 2,
  unitPrice: 150,
  salesQty: 1,
};

check('returns ArrayBuffer-like binary and filename', () => {
  const result = buildXlsxBuffer([sampleItem], '01', { productType: 'manufacturer', filename: 'test_export.xlsx' });
  // XLSX.write({type:'array'}) returns ArrayBuffer; Blob/multer/parseItemSheet all accept it.
  assert.ok(result.buffer && typeof result.buffer.byteLength === 'number', 'buffer must expose byteLength');
  assert.ok(result.buffer.byteLength > 0, 'buffer must be non-empty');
  assert.equal(result.filename, 'test_export.xlsx');
});

check('appends .xlsx extension when missing', () => {
  const result = buildXlsxBuffer([sampleItem], '01', { productType: 'manufacturer', filename: 'no_ext' });
  assert.equal(result.filename, 'no_ext.xlsx');
});

check('buffer parses back through parseItemSheet', () => {
  const { buffer } = buildXlsxBuffer([sampleItem], '01', { productType: 'manufacturer' });
  const parsed = parseItemSheet(buffer);
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].barcode, sampleItem.barcode);
  assert.equal(parsed[0].supplierItemCode, sampleItem.supplierItemCode);
});

check('default filename uses {dept}_{timestamp}.xlsx pattern', () => {
  const { filename } = buildXlsxBuffer([sampleItem], '03', { productType: 'manufacturer' });
  assert.match(filename, /^03_\d{8}_\d{6}\.xlsx$/);
});

if (failures > 0) {
  console.error(`\n${failures} test(s) failed`);
  process.exit(1);
}
console.log('\nAll tests passed');
