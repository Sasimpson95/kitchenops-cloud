# KitchenOps v0.9.5 — Inventory, Stocktakes, Transfers & Waste

## Included

- Inventory category filtering alongside status, storage area and search filters.
- Zero-site guard on Inventory.
- Stocktake result valuation: quantity variance plus GBP variance per line and total stocktake variance value.
- Stocktake v2 workspace key added to business separation.
- Waste value snapshots using inventory-unit cost at the time waste is recorded.
- Waste cards show waste cost as well as quantity.
- Waste dashboard shows today's waste cost.
- Transfers changed to a controlled workflow:
  - Requested
  - Dispatched
  - Received
  - Cancelled
- Source stock reduces only when a transfer is dispatched.
- Destination stock increases only when the transfer is received.
- Transfer history records requested/dispatched/received user and time.
- Legacy Completed transfers are displayed as Received for compatibility.
- Fixed transfer available-stock lookup to use the active business ID.

## Validation

`npm run typecheck` passes.

`npm run build` compiled successfully and completed its TypeScript stage. The automated environment timed out while Next.js was collecting page data.

## Database

No new Supabase migration is required for this release.
