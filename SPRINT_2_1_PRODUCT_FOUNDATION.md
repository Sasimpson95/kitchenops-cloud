# KitchenOps Sprint 2.1 – Product Foundation

Adds cloud-managed product categories and units, plus Product Type, Internal Code, POS/Sales Code and Barcode fields.

## Required migration
Run `supabase/migrations/006_product_foundation.sql` after migration 005.

## Settings route
`/settings/product-options`

## Git workflow
Create and work on a `develop` branch. Vercel production should remain attached to `main`; preview deployments are created from `develop` pushes.
