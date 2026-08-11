# KitchenOps 1.0.0 RC6

- Fixed Chef devices repeatedly queuing server-forbidden operational deletes during automatic rollover.
- Permanent 403 sync rejections are now removed from the retry queue and cloud state is reloaded.
- Prep and handover rollover are read-only on Chef devices.

# KitchenOps Release Notes

## 1.0.0 RC5 — Cross-device Prep Sync Hotfix

- Replaced Prep payload timestamps with authoritative server row revisions for concurrency control.
- Prep updates/deletes now use atomic revision-checked database mutations.
- A stale edit can no longer block later cloud hydration or cross-device refresh.
- RC4 stale Prep retry entries are quarantined rather than resent.
- Newer local edits made while an earlier sync is in flight are preserved and advanced to the accepted server revision.

# KitchenOps RC4 — Prep Reliability Hardening

## Fixed

- Prevented stale Prep edits from overwriting newer changes made on another device.
- Added automatic Prep/Dashboard cloud refresh without requiring manual reload.
- Added manager/operations Prep approval directly inside the Prep Planner.
- Strengthened Android configuration validation so stale generated Capacitor URLs fail the release gate.
- Updated RC release notes and Version 1.0 release-candidate metadata.

# KitchenOps RC3 — Release Security & Database Reconciliation

## Fixed

- Upgraded Next.js to 16.3.0 and cleared production dependency vulnerabilities.
- Reconciled Supabase migration history with the live KitchenOps schema.
- Verified migrations 001–013 reproduce production with no schema drift.
- Promoted the hardened build to 1.0.0-rc3 for production testing.

# KitchenOps RC2 — Data Integrity & Security Hardening

## Fixed

- Shared prep, orders, waste, stocktakes, transfers and current handovers across devices.
- Replaced whole-stock snapshot writes with atomic, idempotent inventory movements.
- Added server-side site/role enforcement and live staff-session revalidation.
- Added persistent staff PIN rate limiting and removed direct public access to staff-login RPCs.
- Shared recipes and storage assignments across devices.
- Standardised site-scoped stock writes on Supabase site UUIDs.
- Removed legacy unprotected dashboard/prep prototype routes.
- Aligned Android and web version metadata to 1.0.0-rc2.

# KitchenOps RC1.4

## Improved

- Added guided empty states for Products, Suppliers, Recipes, Purchasing, Inventory and Storage Areas.
- Empty pages now explain what each module is for and provide a clear next action where the current role has permission.
- Search and filter empty results now use different wording from a genuinely empty business.

# KitchenOps RC1.3

## Fixed
- Marked both desktop and mobile dashboard preview instances for eager loading so Next.js no longer reports the shared preview asset as an unprioritised Largest Contentful Paint image.

# KitchenOps RC1.1

## Fixed

- Added a proper site guard before creating a storage area.
- Prevented Storage Areas from accessing a site before site loading has completed.
- Resolved the TypeScript null-safety failure in `src/app/storage-areas/page.tsx`.

## Retained

- Single-site businesses automatically open their only site.
- Multi-site Operations users retain the All Sites option where appropriate.
- RC-003 login first-impression refresh remains included.

## Quality gate

Run these commands before deployment:

```powershell
npm run typecheck
npm run build
```

## RC1.2

### Fixed
- Replaced the blurry raster dashboard preview with a resolution-independent SVG preview.
- Marked the desktop dashboard preview as eager/high-priority to improve Largest Contentful Paint behaviour.
