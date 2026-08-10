# KitchenOps 1.0.0 RC5

RC5 is a focused hotfix for the RC4 cross-device Prep regression.

## Fixed

- Prep concurrency now uses the authoritative Supabase row revision (`updated_at`), not the editable payload timestamp.
- Prep updates and deletes use atomic revision-checked mutations so two devices cannot both overwrite the same revision.
- A 409 conflict can no longer leave a stale pending Prep overlay blocking cloud hydration.
- RC4 stale Prep retries are quarantined and the latest cloud version is loaded automatically.
- A second local edit made while the first sync request is in flight is preserved and rebased onto the accepted server revision.
- RC4 API clients remain temporarily compatible while browsers/WebViews refresh.

## Database

No migration is required. RC5 uses the existing `cloud_operational_records.updated_at` column.

## Required gates

Run:

```powershell
npm run typecheck
npm run build
npm audit --omit=dev
npm run android:sync
npm run android:check
git diff --check
```

Then deploy and repeat the PC Manager ↔ Android Chef Prep test without manual refresh.
