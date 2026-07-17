# KitchenOps True Fresh Start

This build removes the starter product and supplier catalogue from the application and changes onboarding so a new business creates only:

- the business record
- the Operations membership

No site, supplier, product, storage area or inventory data is created automatically.

## Important

A business that was already contaminated by an older build will keep those cloud records. Test this release by creating a brand-new business after deploying migration 009, or manually remove the old test business/data in Supabase.

## Install

1. Copy `.env.local` from the current KitchenOps project into this folder.
2. Run `npm install`.
3. In Supabase SQL Editor, run `supabase/migrations/009_true_fresh_start.sql`.
4. Run `npm run typecheck`.
5. Run `npm run dev`.
6. Create a brand-new test account/business.

The new Dashboard should have no sites. Add the first site from Settings > Sites.
