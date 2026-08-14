# KitchenOps 1.0.1 RC2 — Navigation Smoothness

## KOPS-RC-034
RC1 reduced duplicate cloud work but normal route changes could still feel abrupt because each new ProtectedPage painted one loading frame before its effect reused the cached authorised runtime. The existing page entrance animation also translated content vertically during mount.

## RC2 changes
- Initialise ProtectedPage from the reusable authorised runtime when it is already safe for the destination route.
- Preserve blocking validation on cold launch, changed user/site, forced PIN change and forbidden routes.
- Replace the 4px vertical page entrance movement with a short opacity-only fade.
- Keep all RC1 background session validation and cloud refresh behaviour.

## Test
Navigate repeatedly between Dashboard, Prep, Recipes, Waste, Handover, Inventory and Purchasing. The shell should feel stable, `Opening KitchenOps…` should not flash on normal route changes, and content should settle without a vertical jump.
