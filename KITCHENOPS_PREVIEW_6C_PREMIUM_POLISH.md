# KitchenOps Preview 6C — Premium Polish

## Release

- Web version: `1.0.0-preview6c`
- Android version code: `7`
- Android version name: `1.0.0-preview6c`
- Supabase migration: none

## Included

- Global accessible toast notifications for success, warning, information and errors.
- Browser alerts removed from the core dashboard, products, suppliers, users, production, reports, transfers and order-detail workflows.
- Premium route-level loading skeletons with shimmer animation.
- Improved confirmation dialog accessibility, Escape handling, initial focus and backdrop dismissal.
- Subtle button, dialog and toast interaction motion.
- Reduced-motion support remains respected.
- Existing premium empty-state system retained across converted pages.

## Required checks

```powershell
npm install
npm run typecheck
npm run build
npm run dev -- -p 3001
```

## Key manual tests

1. Open Products, Suppliers, Production, Users, Reports and Transfers.
2. Trigger validation or error feedback and confirm a branded toast appears instead of a browser alert.
3. Trigger an existing shared confirmation dialog and test Cancel, Escape and clicking the backdrop.
4. Navigate between routes and confirm the loading skeleton appears where loading is required.
5. Test narrow mobile layout and the Android emulator.
