-- KitchenOps
-- Account deletion hardening
--
-- Business membership changes are managed through authenticated server-side
-- flows. Direct anonymous access is not required.

revoke all on table public.business_memberships from anon;

-- Authenticated users only need to read their permitted memberships through
-- RLS. Membership creation/deletion is handled through trusted server/database
-- workflows.
revoke insert, update, delete
on table public.business_memberships
from authenticated;

grant select
on table public.business_memberships
to authenticated;

-- Preserve full service-role access for trusted KitchenOps server operations.
grant select, insert, update, delete
on table public.business_memberships
to service_role;