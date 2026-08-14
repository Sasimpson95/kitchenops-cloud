# KitchenOps 1.0.1 RC1 — Navigation Performance

## KOPS-RC-033
Normal protected-route navigation displayed "Opening KitchenOps…" while repeating authoritative session, site, catalogue, inventory and operational hydration that had already completed for the same signed-in workspace.

## RC1 changes
- Reuse the already-authorised in-memory runtime for normal route changes.
- Continue authoritative session validation without blocking the next screen.
- Keep cold launch, changed staff/site, first-login PIN and role boundaries blocking until authoritative hydration is complete.
- Cache business site lists per business and de-duplicate simultaneous site requests.
- Refresh cached site lists quietly in the background.
- Clear performance/runtime caches on logout and shared-device user switch.

## Expected user-visible result
Dashboard → Prep → Waste → Handover → Inventory navigation should no longer repeatedly wait on the full cloud bootstrap. Fresh cloud data continues to arrive through the existing background refresh and polling mechanisms.

## Release gates
Run on Windows:
- npm run typecheck
- npm run build
- npm audit --omit=dev
- npm run android:sync
- npm run android:check
- git diff --check
