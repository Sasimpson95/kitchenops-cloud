-- KitchenOps 1.0.6 RC1
-- Commercial trial entitlement foundation.
-- Existing businesses are grandfathered as `legacy` so this migration cannot
-- unexpectedly lock an established workspace. Every business created after
-- this migration starts a 30-day trial server-side.

alter table public.businesses
  add column if not exists subscription_status text,
  add column if not exists trial_started_at timestamptz,
  add column if not exists trial_ends_at timestamptz;

-- Grandfather only businesses that existed before this migration. New rows
-- default to `trialing`, so a future alternative creation path cannot silently
-- receive unrestricted legacy access.
update public.businesses
set subscription_status = 'legacy'
where subscription_status is null;

alter table public.businesses
  alter column subscription_status set default 'trialing',
  alter column subscription_status set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'businesses_subscription_status_valid'
  ) then
    alter table public.businesses
      add constraint businesses_subscription_status_valid
      check (subscription_status in (
        'legacy',
        'trialing',
        'active',
        'past_due',
        'canceled',
        'expired'
      ));
  end if;
end
$$;

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
  trial_start timestamptz := now();
  trial_end timestamptz := now() + interval '30 days';
begin
  current_auth_user := auth.uid();

  if current_auth_user is null then
    raise exception 'You must be signed in.';
  end if;

  if length(trim(business_name)) < 2 then
    raise exception 'Business name must contain at least 2 characters.';
  end if;

  if length(trim(business_code)) < 3 then
    raise exception 'Business code must contain at least 3 characters.';
  end if;

  if length(trim(operations_name)) < 2 then
    raise exception 'Enter your name.';
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
    code,
    subscription_status,
    trial_started_at,
    trial_ends_at
  )
  values (
    trim(business_name),
    upper(trim(business_code)),
    'trialing',
    trial_start,
    trial_end
  )
  returning * into created_business;

  insert into public.business_memberships (
    business_id,
    auth_user_id,
    display_name,
    role,
    active
  )
  values (
    created_business.id,
    current_auth_user,
    trim(operations_name),
    'operations',
    true
  );

  return jsonb_build_object(
    'business_id', created_business.id,
    'business_name', created_business.name,
    'business_code', created_business.code,
    'subscription_status', created_business.subscription_status,
    'trial_started_at', created_business.trial_started_at,
    'trial_ends_at', created_business.trial_ends_at
  );
exception
  when unique_violation then
    raise exception 'That business code is already in use.';
end;
$$;
