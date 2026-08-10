# KitchenOps RC5 — Cross-device Prep Sync Hotfix

## KOPS-RC-022

RC4 could enter a permanent 409 retry state after a Prep revision conflict. The stale pending record remained in the local overlay, so subsequent hydration continued to display the stale copy even after a manual refresh.

## RC5 correction

RC5 separates the cloud revision from the Prep business payload. Supabase `cloud_operational_records.updated_at` is the concurrency token and Prep mutations are conditional on the exact revision the client hydrated. This makes stale-write rejection atomic rather than a read-then-upsert check.

RC5 also quarantines RC4-format pending Prep writes on first hydration. They are retained locally under `kitchenops-rc4-prep-pending-backup` for diagnostics but are never resent automatically.

No database migration is required.
