-- KitchenOps Cloud
-- Migration 003: Row Level Security

alter table public.businesses
enable row level security;

alter table public.sites
enable row level security;

alter table public.business_memberships
enable row level security;

alter table public.staff_members
enable row level security;


drop policy if exists
  "operations can view their businesses"
  on public.businesses;

create policy
  "operations can view their businesses"
on public.businesses
for select
to authenticated
using (
  exists (
    select 1
    from public.business_memberships membership
    where membership.business_id = businesses.id
      and membership.auth_user_id = (select auth.uid())
      and membership.active = true
  )
);


drop policy if exists
  "operations can update their businesses"
  on public.businesses;

create policy
  "operations can update their businesses"
on public.businesses
for update
to authenticated
using (
  public.is_business_operations(id)
)
with check (
  public.is_business_operations(id)
);


drop policy if exists
  "operations can view business sites"
  on public.sites;

create policy
  "operations can view business sites"
on public.sites
for select
to authenticated
using (
  exists (
    select 1
    from public.business_memberships membership
    where membership.business_id = sites.business_id
      and membership.auth_user_id = (select auth.uid())
      and membership.active = true
  )
);


drop policy if exists
  "operations can manage business sites"
  on public.sites;

create policy
  "operations can manage business sites"
on public.sites
for all
to authenticated
using (
  public.is_business_operations(business_id)
)
with check (
  public.is_business_operations(business_id)
);


drop policy if exists
  "members can view their memberships"
  on public.business_memberships;

create policy
  "members can view their memberships"
on public.business_memberships
for select
to authenticated
using (
  auth_user_id = (select auth.uid())
);


drop policy if exists
  "operations can view business staff"
  on public.staff_members;

create policy
  "operations can view business staff"
on public.staff_members
for select
to authenticated
using (
  public.is_business_operations(business_id)
);


drop policy if exists
  "operations can update business staff"
  on public.staff_members;

create policy
  "operations can update business staff"
on public.staff_members
for update
to authenticated
using (
  public.is_business_operations(business_id)
)
with check (
  public.is_business_operations(business_id)
);