# ShopLedger

## Stack

- Node.js with CommonJS, Express 4, and body-parser for JSON requests.
- Static HTML, CSS, and vanilla JavaScript in `public/`.
- `server.js` serves the UI, mounts the API under `/api`, and serves printable invoices.
- `config.js` holds shop settings, GST rates, and coupon rules. `data/db.json` is the app's persistent store.

## Module map

- `routes/customers.js` — Lists Khata customers and recent settlements and records repayments.
- `routes/orders.js` — Lists, retrieves, places, and cancels orders.
- `routes/products.js` — Lists products and active coupons.
- `routes/reports.js` — Serves dashboard and GST reconciliation reports, pricing preview, and database export.
- `lib/coupons.js` — Normalizes and validates coupon codes and calculates discounts.
- `lib/dates.js` — Formats dates, normalizes date filter keys, and derives fiscal-year labels.
- `lib/inventory.js` — Looks up products, checks sellable stock, adjusts inventory, and summarizes stock.
- `lib/invoice.js` — Recalculates invoice figures and renders printable HTML with a total mismatch notice.
- `lib/ledger.js` — Handles Khata balances, sale charges, reversals, and settlements.
- `lib/orders.js` — Creates, retrieves, filters, and cancels order records.
- `lib/pricing.js` — Calculates checkout totals and apportions discounts before applying per-line GST.
- `lib/reports.js` — Summarizes the dashboard and compares invoice figures with saved order amounts.
- `lib/store.js` — Reads and writes the JSON database and appends audit entries.
- `lib/tax.js` — Resolves item GST rates and splits tax into CGST and SGST.

## Commands

- Start the app from the repo root with `node server.js`.
- Run tests from the repo root with `node --test`. There are no test files currently, and the `npm test` script is a placeholder.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the modules the ticket is about.
3. Tests must use in-memory data and must never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

The printable invoice total and GST breakdown do not match what the customer was billed. Checkout applies GST to discounted line values using HSN-based rates. The invoice recalculates GST and coupons independently.

Allowed files for the fix are `lib/invoice.js` and, only if truly needed, `lib/tax.js`.
