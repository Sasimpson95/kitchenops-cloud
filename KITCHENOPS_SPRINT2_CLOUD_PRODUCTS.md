# KitchenOps Sprint 2 — Cloud Products

This release moves the shared catalogue foundation to Supabase while preserving the existing KitchenOps screens and workflows.

## Cloud-backed data

- Suppliers
- Products
- Storage areas
- Inventory stock
- Inventory movement history

## How synchronisation works

- KitchenOps loads the business catalogue when an authenticated page opens.
- Existing local browser data becomes the initial cloud catalogue the first time Sprint 2 runs.
- Subsequent changes are saved to Supabase automatically.
- Other phones, tablets and computers load the same business data.
- Staff only receive inventory/storage data for their site. Operations receives all sites.
- Only Operations can change the master Product and Supplier catalogue.

## Required SQL

Run `supabase/migrations/005_cloud_catalogue.sql` in the Supabase SQL Editor after migrations 001–004.

## Important testing rule

Open the updated app first on the browser containing the catalogue you want to keep. That browser uploads the initial Products, Suppliers, Storage Areas and Inventory data. Then open KitchenOps on other devices.
