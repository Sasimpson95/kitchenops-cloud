# KitchenOps v0.9.0 cleanup

This project removes the remaining hard-coded Pudding Pantry site and business fallbacks.

Key changes:
- Storage Areas safely supports a business with zero sites.
- Products and product details use the signed-in business's real sites.
- Inventory, reports, stocktakes, transfers, waste, prep, orders and invoice receiving use the active business ID.
- POS site mappings are generated from the real business sites.
- Notifications no longer invent Beeston, City, Sherwood or Bakery.
- Legacy starter inventory migration has been removed.
- Demo users have been removed from the role configuration.

Validation performed:
- `npm run typecheck` passed.
- `npm run build` compiled successfully and passed TypeScript. The container timed out during Next.js page-data collection after compilation.
