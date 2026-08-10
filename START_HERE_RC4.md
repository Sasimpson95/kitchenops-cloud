# START HERE — KitchenOps 1.0.0 RC4

RC4 is the Prep reliability release candidate.

## Database

RC4 introduces **no new database migration after 013**. Production should already show migrations `001` through `013` as applied, and:

```powershell
npx supabase db diff --linked --schema public
```

should finish with `No schema changes found`.

## Install and verify

```powershell
npm ci
npm run typecheck
npm run build
npm audit --omit=dev
```

## Android

RC4 strengthens Android URL validation. Synchronise before opening Android Studio:

```powershell
npm run android:sync
npm run android:check
npx cap open android
```

Both the source and generated Android config must point to:

```text
https://kitchenops-cloud.vercel.app/login
```

## RC4 regression test

1. Manager/Operations opens **Prep → Today** on PC.
2. Chef opens the same site's Prep/Dashboard on Android.
3. Add or change prep on one device and confirm the other updates automatically within a few seconds without manual refresh.
4. Chef submits prep for approval.
5. Manager sees the submission automatically and approves it from the Prep page.
6. Confirm the approved state appears on Android automatically.
7. Race test: leave a stale prep edit open on one device, change the same item on the other, then save the stale edit. KitchenOps must reject the stale write and refresh the newer version.
