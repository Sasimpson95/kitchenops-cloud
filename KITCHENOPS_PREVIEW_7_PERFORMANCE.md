# KitchenOps Preview 7 — Performance

This release reduces avoidable client-side work while preserving existing workflows.

## Improvements

- Dashboard store collections are read once per refresh and shared between widgets.
- Site-at-a-glance summaries are calculated once instead of re-reading stores during render.
- Dashboard activity is capped after sorting to keep rendering predictable.
- Product, recipe and inventory searches are debounced by 250 ms.
- Product filter options are memoised.
- Inventory movements are indexed by product before records are built, avoiding a full movement scan for every product.
- Inventory summary metrics are calculated in one pass.

## Version

- Web: `1.0.0-preview7`
- Android versionCode: update to `8` when syncing the Android wrapper.
- Android versionName: update to `1.0.0-preview7`.

No database migration is required.
