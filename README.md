# Shehzan Enterprises — Inventory Management

RFID-based retail inventory, sales, and P&L management app.

## Structure

```
src/
  lib/            formatting utils, business logic, constants, storage, initial state
  hooks/          useDerived — computes live stock/product data from raw state
  components/     shared UI primitives (ui/) and RFID/inventory widgets
  pages/          one file per app section (Dashboard, POS, Inventory, Products, ...)
  App.jsx         shell: navigation, routing between pages, top-level state
  main.jsx        React entry point
```

## Run locally

```bash
npm install
npm run dev
```

Then open the printed local URL (usually http://localhost:5173).

## Notes

- **Login**: the app now sits behind a login screen (see `src/lib/auth.js` for the
  credentials and `src/components/LoginScreen.jsx` for the UI). This is a
  client-side-only check — the credentials live in the bundled JS, so anyone with
  access to the code or browser devtools can read them. It's a basic deterrent for
  a single-shop tool, not real security. A production deployment should verify
  credentials against a backend and never ship them in frontend code.
- **Storage**: data is saved to the browser's `localStorage` (see `src/lib/storage.js`).
  That means it's per-browser, not shared across devices or synced anywhere. For a
  real multi-user deployment, swap `loadState`/`saveState` for calls to a real backend
  and database.
- **Barcode scanning**: the Brontix X2 (and most similar handheld scanners) read printed
  barcodes/QR codes, not RFID chips. RetailOS supports this directly — go to a product,
  click **Print Labels**, and it generates a printable sheet of Code128 barcodes (one per
  unit, generated with the `jsbarcode` npm package, fully offline) that encode each unit's
  tag ID. Print, stick on the product, then scan with the X2 into any of RetailOS's scan
  boxes.
- **No mock data**: the app starts completely empty. Add products under **Products**,
  then bring in stock through **Purchases → Receive Stock** by scanning RFID tags.
