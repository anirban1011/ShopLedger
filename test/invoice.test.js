const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function assertFigures({ id, items, coupon }, expectedCheckout, expectedInvoice, expectedRows) {
  const checkout = pricing.computeTotals(items, coupon);
  const { lines, taxable, ...checkoutTotals } = checkout;
  assert.deepEqual(checkoutTotals, expectedCheckout);

  // Pass the billed figures as well as the same items and coupon to the invoice.
  const order = { id, items, coupon, ...checkoutTotals };
  const { rows, ...invoiceTotals } = invoice.computeInvoiceFigures(order);
  assert.deepEqual(invoiceTotals, expectedInvoice);
  assert.deepEqual(
    rows.map(({ gstPercent, line, lineTax }) => ({ gstPercent, line, lineTax })),
    expectedRows
  );
}

test('#1001 invoice uses the 5% and 12% HSN slabs', () => {
  // Saved checkout items carry HSN but do not include a gstRate override.
  const items = [
    { name: 'Rice', hsn: '1006', price: 50, qty: 2 },
    { name: 'Ghee', hsn: '0405', price: 200, qty: 1 }
  ];

  assertFigures(
    { id: 1001, items, coupon: '' },
    { subtotal: 300, discount: 0, tax: 29, cgst: 14.5, sgst: 14.5, total: 329 },
    { subtotal: 300, discount: 0, tax: 29, cgst: 14.5, sgst: 14.5, total: 329 },
    [
      { gstPercent: 5, line: 100, lineTax: 5 },
      { gstPercent: 12, line: 200, lineTax: 24 }
    ]
  );
});

test('#1002 invoice applies SAVE10 before GST', () => {
  // An explicit percentage gives both calculators the same rate, isolating coupon order.
  const items = [{ name: 'Rice', hsn: '1006', gstRate: 5, price: 120, qty: 5 }];

  assertFigures(
    { id: 1002, items, coupon: 'SAVE10' },
    { subtotal: 600, discount: 60, tax: 27, cgst: 13.5, sgst: 13.5, total: 567 },
    { subtotal: 600, discount: 60, tax: 27, cgst: 13.5, sgst: 13.5, total: 567 },
    [{ gstPercent: 5, line: 600, lineTax: 27 }]
  );
});

test('#1004 invoice honors the SAVE10 cap', () => {
  const items = [{ name: 'Tea', hsn: '0902', price: 280, qty: 8 }];

  assertFigures(
    { id: 1004, items, coupon: 'SAVE10' },
    { subtotal: 2240, discount: 150, tax: 376.2, cgst: 188.1, sgst: 188.1, total: 2466.2 },
    { subtotal: 2240, discount: 150, tax: 376.2, cgst: 188.1, sgst: 188.1, total: 2466.2 },
    [{ gstPercent: 18, line: 2240, lineTax: 376.2 }]
  );
});

test('CURRENT BEHAVIOUR: #1008 invoice matches checkout for 18% items without a coupon', () => {
  const items = [
    { name: 'Tea', hsn: '0902', price: 125, qty: 2 },
    { name: 'Coffee', hsn: '0901', price: 150, qty: 1 }
  ];
  const expectedTotals = { subtotal: 400, discount: 0, tax: 72, cgst: 36, sgst: 36, total: 472 };

  assertFigures(
    { id: 1008, items, coupon: '' },
    expectedTotals,
    expectedTotals,
    [
      { gstPercent: 18, line: 250, lineTax: 45 },
      { gstPercent: 18, line: 150, lineTax: 27 }
    ]
  );
});

test('invoice matches billed totals and line GST for a capped coupon on mixed HSN slabs', () => {
  const items = [
    { name: 'Rice', hsn: '1006', price: 100, qty: 10 },
    { name: 'Ghee', hsn: '0405', price: 310, qty: 4 }
  ];
  const coupon = 'SAVE10';
  const billed = pricing.computeTotals(items, coupon);
  const printed = invoice.computeInvoiceFigures({ items, coupon, ...billed });

  assert.equal(billed.discount, 150);
  for (const key of ['subtotal', 'discount', 'tax', 'cgst', 'sgst', 'total']) {
    assert.equal(printed[key], billed[key], key);
  }
  assert.deepEqual(
    printed.rows.map(({ gstPercent, lineTax }) => [gstPercent, lineTax]),
    [[5, 46.65], [12, 138.84]]
  );
});
