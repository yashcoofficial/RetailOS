# Shehzan Enterprises — RetailOS

RFID-based retail inventory, sales, and P&L management app with secure admin login and real-time multi-device synchronization.

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

## Enable admin synchronization

1. Create a Supabase project.
2. Open **SQL Editor** in Supabase and run `supabase/migrations/202609200001_admin_realtime_sync.sql`.
3. In **Authentication → Users**, create the administrator account used to log in to RetailOS. Do not reuse the password that was previously committed to this public repository.
4. In **Project Settings → API**, copy the project URL and publishable/anon key into `.env`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
VITE_ADMIN_EMAIL=YOUR_EXISTING_ADMIN_EMAIL
VITE_ADMIN_PASSWORD_SHA256=SHA256_OF_YOUR_EXISTING_ADMIN_PASSWORD
```

5. Restart the development server.

The first authenticated device initializes the shared database. If that browser has data from the old local-storage version, RetailOS migrates it automatically; otherwise it creates an empty store. After that, products, RFID status, purchases, sales, returns, expenses, settings, and other records are loaded from the shared database on every admin device.

Changes use revision checking to avoid silently overwriting a newer update from another device. Supabase Realtime pushes committed changes to other open admin sessions immediately.

The login page is always shown when the administrator is signed out. If Supabase variables have not been configured yet, set `VITE_ADMIN_EMAIL` and `VITE_ADMIN_PASSWORD_SHA256` in the deployment environment so the same existing administrator credentials open RetailOS in local-storage mode instead of displaying a setup screen. For cloud mode, create the Supabase administrator with those same credentials.

## Security

- Only authenticated Supabase users can read or change the RetailOS state.
- Create only the administrator account(s) that should access the store.
- Never put the Supabase `service_role` key in `.env` or frontend code.
- The existing login is retained without storing its plaintext password in the current frontend source. For production security, migrate fully to Supabase Auth and rotate any password previously committed to Git history.

## Build

```bash
npm run build
npm run preview
```
