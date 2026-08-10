# KitchenOps 1.0.0 RC3 — Data Integrity & Security Hardening

KitchenOps RC3 is the first hardening candidate after the RC1 baseline. It intentionally prioritises production safety over new features.

## RC issues addressed

- **KOPS-RC-004 — Release blocker:** Prep, orders, waste, stocktakes, transfers and current handovers were browser-only. They now sync record-by-record to shared Supabase operational storage. Local storage remains an offline/UI cache and a durable pending-write queue retries interrupted writes.
- **KOPS-RC-005 — Release blocker:** Inventory/catalogue sync previously replaced whole browser snapshots. Inventory now uses idempotent, atomic movement deltas in PostgreSQL under a row lock. Catalogue records sync individually rather than replacing another device's dataset, and interrupted catalogue writes are retained in a durable retry queue.
- **KOPS-RC-006 — Release blocker:** Handover and generic operational endpoints now verify business/site access server-side. Operational site metadata is derived from the record payload rather than trusted from a client-supplied access key.
- **KOPS-RC-007 — Security blocker:** Staff PIN lookup/login is persistently rate-limited. The underlying Supabase staff-login RPCs are no longer callable by `anon`/`authenticated`, preventing direct public-key calls from bypassing the API limiter.
- **KOPS-RC-008 — Important:** PIN sessions are revalidated against live staff, business and site records. Disabled staff, changed roles and inactive sites take effect without waiting for the 12-hour cookie to expire.
- **KOPS-RC-009 — Important:** Web/package and Android version metadata are aligned to `1.0.0-RC3`; Android `versionCode` is now `8`.
- **KOPS-RC-010 — Important:** Protected routes enforce role access. Legacy unprotected `/dashboard` and `/prep-planner` prototype screens now redirect into the real protected `/home` and `/production` workflows.
- **KOPS-RC-011 — Release blocker:** Recipes and product-to-storage-area assignments are now shared cloud catalogue data so chef/manager devices receive the same recipe/storage configuration.
- **KOPS-RC-012 — Release blocker:** Site identity is standardised on real Supabase site UUIDs for inventory and site-scoped workflows. The migration normalises legacy name-derived stock/storage keys, and server APIs continue accepting legacy keys only where migration compatibility is required.

## Required deployment order

### 1. Back up Supabase

Take a database backup/snapshot before applying RC3.

### 2. Apply the RC3 Supabase migration BEFORE deploying the RC3 app

Run:

`supabase/migrations/011_rc1_hardening.sql`

The application expects the new operational, recipe, location and rate-limit tables/functions. Do not deploy the RC3 application before this migration has completed successfully.

### 3. Add the production rate-limit secret

Add a separate 32+ character production environment variable:

`KITCHENOPS_LOGIN_RATE_LIMIT_SECRET`

If omitted, KitchenOps falls back to `KITCHENOPS_SESSION_SECRET`, but a separate secret is recommended.

### 4. Install dependencies and run the release gates

```bash
npm ci
npm run typecheck
npm run build
npm run android:check
```

Do not promote RC3 if either `typecheck` or `build` fails.

### 5. Deploy the web build

Deploy only after the four commands above pass.

### 6. First authenticated launch

Open KitchenOps with an **Operations** account first. RC3 performs one-time migration of legacy browser-only shared records into the cloud. Cloud data wins exact collisions; unique legacy records are preserved.

### 7. Multi-device regression test

Use at least two separate devices/browsers:

1. Manager creates tomorrow's prep on Device A.
2. Chef sees that prep on Device B.
3. Chef submits produced quantity on Device B.
4. Manager sees the awaiting-approval state on Device A.
5. Manager approves it and inventory updates once.
6. Record waste on Device B and confirm stock changes on Device A.
7. Create/dispatch/receive a transfer and confirm source/destination stock.
8. Create an order/receive stock and confirm the same quantities on both devices.
9. Create/edit a recipe as Operations and confirm it is visible read-only to Manager/Chef.
10. Log in with accounts from two different sites and confirm site-scoped records never cross over.

## Offline/retry behaviour

Operational, catalogue and inventory writes are cached locally and queued until the server acknowledges them. A temporary network interruption does not intentionally apply inventory twice; the server movement RPC is idempotent and atomic. Pending writes retry when connectivity returns, when KitchenOps returns to the foreground and periodically while the app is open.

## Rollback note

Migration `011_rc1_hardening.sql` revokes public execution of the old staff-login RPCs as part of KOPS-RC-007. If application code must be rolled all the way back to pre-RC3 code, the old code's staff PIN route would also need the RPC permissions temporarily restored. Prefer rolling forward with an RC3 patch instead of reverting the security boundary.

## Verification note for this packaged candidate

The source tree was parsed successfully across all TypeScript/TSX files and `npm run android:check` passed. The packaging runner could not complete `npm ci` because outbound DNS access to `registry.npmjs.org` is unavailable, and the uploaded ZIP contained only empty/partial `node_modules` directories. Therefore this package is an **RC3 candidate**, not a certified release build, until `npm run typecheck` and `npm run build` pass on the normal KitchenOps development machine.

