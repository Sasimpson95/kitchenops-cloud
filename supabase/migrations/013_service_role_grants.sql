-- KitchenOps RC migration reconciliation
-- Explicitly reproduce service_role privileges present in production.

grant select, insert, update, delete
on table public.cloud_operational_records
to service_role;

grant select, insert, update, delete
on table public.cloud_product_locations
to service_role;

grant select, insert, update, delete
on table public.cloud_recipes
to service_role;

grant select, insert, update, delete
on table public.staff_auth_attempts
to service_role;
