# KitchenOps RC1.4

## Improved

- Added guided empty states for Products, Suppliers, Recipes, Purchasing, Inventory and Storage Areas.
- Empty pages now explain what each module is for and provide a clear next action where the current role has permission.
- Search and filter empty results now use different wording from a genuinely empty business.

# KitchenOps RC1.3

## Fixed
- Marked both desktop and mobile dashboard preview instances for eager loading so Next.js no longer reports the shared preview asset as an unprioritised Largest Contentful Paint image.

# KitchenOps RC1.1

## Fixed

- Added a proper site guard before creating a storage area.
- Prevented Storage Areas from accessing a site before site loading has completed.
- Resolved the TypeScript null-safety failure in `src/app/storage-areas/page.tsx`.

## Retained

- Single-site businesses automatically open their only site.
- Multi-site Operations users retain the All Sites option where appropriate.
- RC-003 login first-impression refresh remains included.

## Quality gate

Run these commands before deployment:

```powershell
npm run typecheck
npm run build
```

## RC1.2

### Fixed
- Replaced the blurry raster dashboard preview with a resolution-independent SVG preview.
- Marked the desktop dashboard preview as eager/high-priority to improve Largest Contentful Paint behaviour.
