# KitchenOps v0.9.6 — Reports & Insights

## Highlights

- Reports now use the signed-in business's real sites instead of a static report-site list.
- Executive report remains the high-level operational overview.
- New Insights tab surfaces actionable management attention points.
- Purchase price movement analysis uses received purchasing price history.
- Stocktake reporting now includes financial variance value (£).
- Insights can flag repeated negative stocktake variances.
- Prep history is included in management insight calculations.
- Multi-site waste comparisons are generated from the active business's sites.

## New Insights examples

- Products at low/reorder/out-of-stock level.
- Outstanding purchase orders.
- Largest recorded supplier price increase.
- Site with the highest waste cost in the selected period.
- Products with repeated negative stocktake variance.
- Prep completion below 95%.

## Testing

`npm run typecheck` passes.

`npm run build` compiled successfully and completed its TypeScript stage. The automated environment timed out while Next.js was collecting page data; it did not return a compilation or TypeScript error.

## Database

No Supabase migration is required for v0.9.6.
