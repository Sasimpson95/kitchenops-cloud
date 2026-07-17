# KitchenOps Demo Data Removal – Setup

1. Copy your existing `.env.local` into this project folder.
2. In Supabase SQL Editor, run `supabase/migrations/009_true_fresh_start.sql`.
3. In PowerShell, run:
   - `npm install`
   - `npm run typecheck`
   - `npm run dev`
4. Sign out and sign back in.
5. For the test business with zero sites, KitchenOps will clear inherited browser demo data automatically.
6. Add the first site from Settings > Sites.
7. When local testing passes, deploy with:
   - `git add .`
   - `git commit -m "Remove KitchenOps demo data and use business sites"`
   - `git push`

Important: The migration does not delete or alter any existing business or existing site. It only changes future business creation so that a new business starts without a site.
