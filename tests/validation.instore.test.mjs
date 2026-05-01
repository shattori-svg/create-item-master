/**
 * validateFormFields / validateForExport — in-store code path.
 * Run: `node tests/validation.instore.test.mjs`
 */
import assert from 'node:assert/strict';
import { validateFormFields, validateForExport } from '../src/lib/validation.js';

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

console.log('Validation: in-store code');

const baseFields = {
  productGroupCode: '110113',
  productGroup: '110113',
  nameEng: 'Sample',
  nameTha: 'Sample',
  supplierCode: 'V012345',
  supplier: 'V012345',
  unitCost: 100,
  orderQty: 1,
  unitPrice: 150,
  salesQty: 1,
  caseBarcode: '',
  casePrice: '',
};

check('manufacturer without barcode normally fails', () => {
  const errors = validateFormFields({ ...baseFields, barcode: '' }, [], 'manufacturer');
  assert.equal(errors.barcode, 'required');
});

check('manufacturer with useInstoreCode=true skips barcode validation', () => {
  const errors = validateFormFields({ ...baseFields, barcode: '', useInstoreCode: true }, [], 'manufacturer');
  assert.equal(errors.barcode, undefined);
});

check('manufacturer with useInstoreCode=true skips barcode duplicate check', () => {
  // Two existing barcodes pass through; in-store row must not collide
  const errors = validateFormFields(
    { ...baseFields, barcode: '', useInstoreCode: true },
    ['4901111275195', '4901940039333'],
    'manufacturer'
  );
  assert.equal(errors.barcode, undefined);
});

check('validateForExport allows in-store rows without barcode', () => {
  const items = [{ useInstoreCode: true, productGroupCode: '110113', nameEng: 'X', salesQty: 1 }];
  const errs = validateForExport(items, '01', 'manufacturer');
  // The in-store row must not contribute "#1 barcode"
  assert.equal(errs.find((e) => e.includes('barcode')), undefined);
});

check('validateForExport still flags missing barcode on a normal manufacturer row', () => {
  const items = [{ productGroupCode: '110113', nameEng: 'X', salesQty: 1 }];
  const errs = validateForExport(items, '01', 'manufacturer');
  assert.ok(errs.some((e) => e.includes('barcode')), 'should still require barcode for non-in-store rows');
});

if (failures > 0) {
  console.error(`\n${failures} test(s) failed`);
  process.exit(1);
}
console.log('\nAll tests passed');
