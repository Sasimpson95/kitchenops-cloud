# KitchenOps Dark Mode — Phase 1

This build adds the dark-mode foundation without changing the existing native splash assets.

## Included

- Light / Dark / System theme support.
- Device theme detection through `prefers-color-scheme`.
- Local persistence under `kitchenops-theme`.
- Pre-hydration theme bootstrapping to reduce theme flash on launch.
- New Settings > Appearance screen.
- Dark design tokens for canvas, surfaces, text, borders and violet accents.
- Compatibility overrides for the neutral Tailwind utility colours already used across KitchenOps.
- Dark treatment for the app shell, forms, mobile sheets and sticky mobile actions.
- Print output remains light.

## How to test

1. Run `npm run typecheck`.
2. Run `npm run build`.
3. Start KitchenOps normally.
4. Sign in as an Operations user.
5. Open Settings > Appearance.
6. Switch between Light, Dark and System.
7. Refresh the page after each choice and confirm the setting remains.
8. With System selected, change the Windows/Android device appearance and confirm KitchenOps follows it.
9. Check Dashboard, Prep, Products, Inventory, Purchasing, Waste, Stocktakes, Handover and Settings for any hard-coded light colour that still needs Phase 2 conversion.

## Important

Phase 1 deliberately establishes a safe theme foundation first. Individual screens may still contain status-specific or uncommon hard-coded colours that should be reviewed during Phase 2 rather than mass-replaced blindly.
