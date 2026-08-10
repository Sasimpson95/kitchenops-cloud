# KitchenOps 1.0.0 RC4 — Prep Reliability Hardening

RC4 is a focused release-candidate build. It adds no new product scope beyond fixes required for a safe Version 1.0 launch.

## Fixed

- **KOPS-RC-017:** Prep writes now use optimistic concurrency. A stale Manager/Operations/Chef device cannot overwrite a newer prep revision from another device.
- **KOPS-RC-020:** Prep and Dashboard now refresh shared operational data automatically every 3 seconds while those workflows are open, plus immediately on focus, visibility, reconnect and page restore.
- **KOPS-RC-021:** Managers and Operations users can approve chef-submitted prep directly inside the Prep Planner, including approved quantity and optional carry-forward of the remainder.
- **KOPS-RC-016:** Release notes now include RC3 and RC4.
- **KOPS-RC-018:** Android config validation now checks the generated Capacitor config as well as the source config, preventing a stale placeholder/live URL mismatch from passing the release gate.

## Data integrity behaviour

Prep updates include the `updatedAt` revision the user actually edited. If Supabase already contains a newer revision, the API returns a conflict instead of overwriting it. KitchenOps drops the stale queued write, warns the user, and refreshes the latest cloud copy.

## Release gate

Before deployment run:

```powershell
npm ci
npm run typecheck
npm run build
npm run android:sync
npm run android:check
npm audit --omit=dev
```

Expected: all commands pass and the production dependency audit reports 0 vulnerabilities.
