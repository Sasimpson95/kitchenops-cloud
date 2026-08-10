# KitchenOps RC3 Candidate — Start Here

This package contains the RC3 data-integrity and security hardening build.

## First: local release gates (do this before touching production)

Extract this ZIP to a new folder, open that folder in VS Code/Command Prompt, then run:

```bash
npm ci
npm run typecheck
npm run build
npm run android:check
```

Do not deploy RC3 until all four commands pass. The packaging environment could not download npm dependencies, so `typecheck` and `build` must be certified on the normal KitchenOps development PC.

## After the gates pass

1. Back up the Supabase database.
2. Add a 32+ character production environment variable named `KITCHENOPS_LOGIN_RATE_LIMIT_SECRET`.
3. Apply `supabase/migrations/011_rc1_hardening.sql` in Supabase **before** deploying the RC3 web code.
4. Deploy RC3.
5. Sign in first with an **Operations** account so legacy shared browser records can be migrated safely.
6. Run the two-device regression test in `KITCHENOPS_RC3_HARDENING.md`.

## Important rollback note

RC3 deliberately removes public access to the old staff PIN RPCs. Do not deploy the RC3 migration and then revert to the pre-RC3 application unless you intentionally restore those old RPC permissions. Prefer a forward RC patch.

