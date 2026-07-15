-- KitchenOps Cloud
-- Migration 002: onboarding and staff-management functions

create or replace function public.is_business_operations(
  requested_business_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.business_memberships membership
    where membership.business_id = requested_business_id
      and membership.auth_user_id = auth.uid()
      and membership.role = 'operations'
      and membership.active = true
  );
$$;


create or replace function public.create_kitchenops_business(
  business_name text,
  business_code text,
  operations_name text,
  first_site_name text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_auth_user uuid;
  created_business public.businesses;
  created_site public.sites;
begin
  current_auth_user := auth.uid();

  if current_auth_user is null then
    raise exception 'You must be signed in.';
  end if;

  if length(trim(business_name)) < 2 then
    raise exception 'Enter a valid business name.';
  end if;

  if length(trim(business_code)) < 3 then
    raise exception 'Business code must contain at least 3 characters.';
  end if;

  if length(trim(operations_name)) < 2 then
    raise exception 'Enter your name.';
  end if;

  if length(trim(first_site_name)) < 2 then
    raise exception 'Enter a valid site name.';
  end if;

  if exists (
    select 1
    from public.business_memberships
    where auth_user_id = current_auth_user
      and active = true
  ) then
    raise exception 'This account already belongs to a KitchenOps business.';
  end if;

  insert into public.businesses (
    name,
    code
  )
  values (
    trim(business_name),
    upper(trim(business_code))
  )
  returning *
  into created_business;

  insert into public.sites (
    business_id,
    name
  )
  values (
    created_business.id,
    trim(first_site_name)
  )
  returning *
  into created_site;

  insert into public.business_memberships (
    business_id,
    auth_user_id,
    display_name,
    role
  )
  values (
    created_business.id,
    current_auth_user,
    trim(operations_name),
    'operations'
  );

  return jsonb_build_object(
    'businessId',
    created_business.id,
    'businessName',
    created_business.name,
    'businessCode',
    created_business.code,
    'siteId',
    created_site.id,
    'siteName',
    created_site.name
  );
end;
$$;


create or replace function public.create_kitchenops_site(
  requested_business_id uuid,
  site_name text,
  frequency text default 'weekly'
)
returns public.sites
language plpgsql
security definer
set search_path = public
as $$
declare
  created_site public.sites;
begin
  if not public.is_business_operations(requested_business_id) then
    raise exception 'Operations permission required.';
  end if;

  if frequency not in (
    'weekly',
    'fortnightly',
    'monthly'
  ) then
    raise exception 'Invalid stocktake frequency.';
  end if;

  insert into public.sites (
    business_id,
    name,
    stocktake_frequency
  )
  values (
    requested_business_id,
    trim(site_name),
    frequency
  )
  returning *
  into created_site;

  return created_site;
end;
$$;


create or replace function public.create_staff_member(
  requested_business_id uuid,
  requested_site_id uuid,
  staff_name text,
  staff_role text,
  temporary_pin text
)
returns public.staff_members
language plpgsql
security definer
set search_path = public
as $$
declare
  created_staff public.staff_members;
begin
  if not public.is_business_operations(requested_business_id) then
    raise exception 'Operations permission required.';
  end if;

  if staff_role not in (
    'manager',
    'chef'
  ) then
    raise exception 'Role must be manager or chef.';
  end if;

  if temporary_pin !~ '^[0-9]{4}$' then
    raise exception 'PIN must contain exactly 4 digits.';
  end if;

  if not exists (
    select 1
    from public.sites
    where id = requested_site_id
      and business_id = requested_business_id
      and active = true
  ) then
    raise exception 'The selected site is invalid.';
  end if;

  insert into public.staff_members (
    business_id,
    site_id,
    name,
    role,
    pin_hash,
    must_change_pin
  )
  values (
    requested_business_id,
    requested_site_id,
    trim(staff_name),
    staff_role,
    crypt(
      temporary_pin,
      gen_salt('bf')
    ),
    true
  )
  returning *
  into created_staff;

  return created_staff;
end;
$$;


create or replace function public.reset_staff_pin(
  requested_staff_id uuid,
  temporary_pin text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  staff_business_id uuid;
begin
  select business_id
  into staff_business_id
  from public.staff_members
  where id = requested_staff_id;

  if staff_business_id is null then
    raise exception 'Staff member not found.';
  end if;

  if not public.is_business_operations(staff_business_id) then
    raise exception 'Operations permission required.';
  end if;

  if temporary_pin !~ '^[0-9]{4}$' then
    raise exception 'PIN must contain exactly 4 digits.';
  end if;

  update public.staff_members
  set
    pin_hash = crypt(
      temporary_pin,
      gen_salt('bf')
    ),
    must_change_pin = true
  where id = requested_staff_id;
end;
$$;


revoke all on function public.create_kitchenops_business(
  text,
  text,
  text,
  text
) from public;

grant execute on function public.create_kitchenops_business(
  text,
  text,
  text,
  text
) to authenticated;


revoke all on function public.create_kitchenops_site(
  uuid,
  text,
  text
) from public;

grant execute on function public.create_kitchenops_site(
  uuid,
  text,
  text
) to authenticated;


revoke all on function public.create_staff_member(
  uuid,
  uuid,
  text,
  text,
  text
) from public;

grant execute on function public.create_staff_member(
  uuid,
  uuid,
  text,
  text,
  text
) to authenticated;


revoke all on function public.reset_staff_pin(
  uuid,
  text
) from public;

grant execute on function public.reset_staff_pin(
  uuid,
  text
) to authenticated;