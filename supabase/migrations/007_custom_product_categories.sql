-- KitchenOps Sprint 2.2
-- Product categories are fully business-defined and independent of product type.

alter table public.product_categories
  drop constraint if exists product_categories_type_valid;

alter table public.product_categories
  drop column if exists product_type;
