# KitchenOps Sprint 2.2 — Custom Categories

## What changed

- Product categories are fully business-defined.
- KitchenOps no longer creates preset categories such as Dairy & Eggs.
- Categories are independent from Product Type.
- Operations can add, rename, archive and restore categories.
- Add/Edit Product now has a Manage button beside Category.
- A newly created category can be selected immediately without leaving the product form.
- No product image field has been added.

## Required migration

Run:

`supabase/migrations/007_custom_product_categories.sql`

This removes the old `product_type` field from `product_categories`. It does not delete category rows or products.
