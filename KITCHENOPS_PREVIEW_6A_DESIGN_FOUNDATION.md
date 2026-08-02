# KitchenOps Preview 6A — Design Foundation

Preview 6A introduces the reusable KitchenOps interface foundation without changing operational workflows.

## Included components

- `Button`: primary, secondary, danger and ghost variants; three sizes; loading and icon support.
- `Card`: consistent borders, radius, spacing, shadow and interactive state.
- `PageHeader`: title, description, eyebrow, metadata and flexible actions.
- `SectionCard`: standard section heading and content layout.
- `KpiCard`: reusable statistics card for dashboard and reporting screens.
- `StatusBadge`: consistent status colours with automatic tone selection.
- `SearchBar`: accessible search input with a clear control.
- `FilterBar`: responsive container for filters and actions.
- `Input` and `Textarea`: labels, helper text, validation errors and accessible states.
- `EmptyState`: icon, explanation and optional actions.
- `Skeleton`: loading placeholders.
- `ConfirmModal`: consistent mobile-friendly confirmation dialog.

## Design tokens

Global tokens are defined in `src/app/globals.css` for primary colours, surfaces, borders, text, radius and shadows.

## Version

- Web version: `1.0.0-preview6a`
- Android version code: `5`
- Android version name: `1.0.0-preview6a`

## Scope

This release is the design foundation. Preview 6B will convert the remaining pages to these components. No Supabase migration is required.
