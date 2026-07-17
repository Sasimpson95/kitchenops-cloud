-- KitchenOps 009: true fresh-start onboarding
-- New businesses contain only the business and Operations membership.
-- Sites and catalogue records are created later by the user.

create or replace function public.create_kitchenops_business(
  business_name text,
  business_code text,
  operations_name text,
  first_site_name text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_auth_user uuid;
  created_business public.businesses;
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
  if exists (
    select 1 from public.business_memberships
    where auth_user_id = current_auth_user and active = true
  ) then
    raise exception 'This account already belongs to a KitchenOps business.';
  end if;

  insert into public.businesses (name, code)
  values (trim(business_name), upper(trim(business_code)))
  returning * into created_business;

  insert into public.business_memberships (
    business_id, auth_user_id, display_name, role
  ) values (
    created_business.id, current_auth_user, trim(operations_name), 'operations'
  );

  return jsonb_build_object(
    'businessId', created_business.id,
    'businessName', created_business.name,
    'businessCode', created_business.code,
    'siteId', null,
    'siteName', null
  );
end;
$$;
