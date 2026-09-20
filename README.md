# Shehzan Enterprises — RetailOS

RFID-based retail inventory, sales, and P&L management app with admin login and multi-device synchronization through the same Vercel project that hosts the app.

## Run locally

```bash
npm install
npm run dev
```

## Enable admin synchronization on Vercel

1. Open the RetailOS project in the Vercel dashboard.
2. Open **Storage**, create a **Blob** store, and connect it to this project.
3. In **Settings → Environment Variables**, add `RETAILOS_ADMIN_EMAIL`, `RETAILOS_ADMIN_PASSWORD_SHA256`, and `RETAILOS_SESSION_SECRET`. Use the existing admin email, the SHA-256 value of the existing password, and a new long random session secret.
4. Redeploy the latest `main` branch.
5. First sign in on the device that already contains the shop data. RetailOS automatically migrates that browser's products and records into the shared store.

No Supabase project or frontend cloud environment variables are used. Products, RFID state, inventory, purchases, sales, returns, expenses, vendors, settings, dashboard statistics, and reports are stored in one private Vercel Blob object and loaded on every signed-in device. Open sessions check for updates every few seconds.

Writes use revision and ETag checks so two devices cannot silently overwrite each other's newer changes. A successful shared write is also cached locally as a recovery copy.

## Security

- The Blob store is private and accessed only by the server-side `/api/state` function.
- Admin credentials are checked by `/api/session` on the server. The browser receives an HTTP-only signed cookie; neither the password hash nor the Blob token is included in the frontend bundle.
- Rotate any password previously committed to Git history.

## Build

```bash
npm run build
npm run preview
```
