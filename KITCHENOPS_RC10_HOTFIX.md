# KitchenOps 1.0.0 RC10

## KOPS-RC-025 — Configurable stocktake units

Products now explicitly select the units that are permitted during stocktake.
Only the purchase unit and inventory unit are available because those are the
conversions KitchenOps can currently prove from product data.

Examples:
- Milk: Bottle + Litre
- Eggs: Case + Each

The counter preserves the exact quantities entered in each enabled unit and
converts the aggregate to the inventory unit for inventory movements/valuation.
No database migration is required because products and stocktakes are stored as
JSON catalogue/operational records.
