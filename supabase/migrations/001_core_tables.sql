-- KitchenOps Cloud
-- Migration 001: core business, site and user tables

create extension if not exists pgcrypto;

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  code text not null,

  active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint businesses_name_required
    check (length(trim(name)) > 0),

  constraint businesses_code_required
    check (length(trim(code)) >= 3)
);

create unique index if not exists businesses_code_unique
  on public.businesses (lower(code));


create table if not exists public.sites (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null
    references public.businesses(id)
    on delete cascade,

  name text not null,

  active boolean not null default true,

  stocktake_frequency text not null default 'weekly',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint sites_name_required
    check (length(trim(name)) > 0),

  constraint sites_stocktake_frequency_valid
    check (
      stocktake_frequency in (
        'weekly',
        'fortnightly',
        'monthly'
      )
    )
);

create unique index if not exists sites_business_name_unique
  on public.sites (
    business_id,
    lower(name)
  );


create table if not exists public.business_memberships (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null
    references public.businesses(id)
    on delete cascade,

  auth_user_id uuid not null
    references auth.users(id)
    on delete cascade,

  display_name text not null,

  role text not null default 'operations',

  active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint business_memberships_name_required
    check (length(trim(display_name)) > 0),

  constraint business_memberships_role_valid
    check (
      role in (
        'operations'
      )
    )
);

create unique index if not exists business_memberships_unique
  on public.business_memberships (
    business_id,
    auth_user_id
  );


create table if not exists public.staff_members (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null
    references public.businesses(id)
    on delete cascade,

  site_id uuid not null
    references public.sites(id)
    on delete restrict,

  name text not null,

  role text not null,

  pin_hash text not null,

  must_change_pin boolean not null default true,
  active boolean not null default true,

  last_login_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint staff_members_name_required
    check (length(trim(name)) > 0),

  constraint staff_members_role_valid
    check (
      role in (
        'manager',
        'chef'
      )
    )
);

create unique index if not exists staff_members_site_name_unique
  on public.staff_members (
    site_id,
    lower(name)
  );


create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


drop trigger if exists businesses_set_updated_at
  on public.businesses;

create trigger businesses_set_updated_at
before update on public.businesses
for each row
execute function public.set_updated_at();


drop trigger if exists sites_set_updated_at
  on public.sites;

create trigger sites_set_updated_at
before update on public.sites
for each row
execute function public.set_updated_at();


drop trigger if exists memberships_set_updated_at
  on public.business_memberships;

create trigger memberships_set_updated_at
before update on public.business_memberships
for each row
execute function public.set_updated_at();


drop trigger if exists staff_members_set_updated_at
  on public.staff_members;

create trigger staff_members_set_updated_at
before update on public.staff_members
for each row
execute function public.set_updated_at();