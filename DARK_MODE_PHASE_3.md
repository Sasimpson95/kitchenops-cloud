# KitchenOps Dark Mode — Phase 3

## Scope
Phase 3 is the app-wide colour cleanup after the theme foundation and Dashboard pass.

### Dark-mode polish added for
- Prep Planner status cards and approval states
- Recipe costing KPI/status cards and warning banners
- Inventory KPI/status cards
- Transfers overview card
- Waste completion and missing-status cards
- Reports KPI cards
- Empty states, including Storage Areas
- Disabled buttons and muted controls
- Common blue, amber, yellow, red, green and purple semantic surfaces

Light mode remains unchanged because every new override is scoped under `html.dark`.

## Small product display fix
Product stock quantities are now formatted to a maximum of three decimal places. This prevents floating-point values such as `370.99999999999994` from appearing in product cards; the same value displays as `371`.

## Suggested visual checks
1. Prep Planner — All Sites overview and single-site status cards
2. Recipes — costing cards and attention banner
3. Inventory — KPI row
4. Transfers — Viewing card
5. Waste — Missing/completion calendar cells
6. Reports — executive KPI cards
7. Storage Areas — empty state
8. Products — confirm stock values no longer show floating-point noise
9. Toggle back to Light mode and confirm the original light palette is unchanged
