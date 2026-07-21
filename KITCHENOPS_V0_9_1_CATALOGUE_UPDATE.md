# KitchenOps v0.9.1 - Products & Catalogue

## Included
- External and Internal Kitchen supplier types.
- Internal suppliers link directly to a real KitchenOps site.
- Selecting an internal site automatically names the supplier `<Site> Kitchen`.
- Internal suppliers default to same-day lead time and daily availability.
- Supplier cards clearly show Internal Kitchen vs External Supplier.
- Product categories remain fully business-specific.
- Product units can now be renamed and their symbols edited as well as archived/restored.
- Existing products, suppliers and cloud catalogue data remain compatible.

## No database migration required
Supplier type/site-link fields are stored inside the existing cloud catalogue JSON payload, so this release does not require an additional Supabase migration.
