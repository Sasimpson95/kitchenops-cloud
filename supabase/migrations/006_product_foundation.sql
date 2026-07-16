-- KitchenOps Sprint 2.1: product categories and units.

create table if not exists public.product_categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  product_type text not null default 'ingredient',
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_categories_name_required check (length(trim(name)) > 0),
  constraint product_categories_type_valid check (
    product_type in ('ingredient', 'packaging', 'retail', 'cleaning', 'consumable')
  )
);

create unique index if not exists product_categories_business_name_unique
  on public.product_categories (business_id, lower(name));

create index if not exists product_categories_business_sort_idx
  on public.product_categories (business_id, sort_order, name);

create table if not exists public.product_units (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  symbol text not null,
  unit_kind text not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_units_name_required check (length(trim(name)) > 0),
  constraint product_units_symbol_required check (length(trim(symbol)) > 0),
  constraint product_units_kind_valid check (
    unit_kind in ('each', 'weight', 'volume', 'packaging', 'portion')
  )
);

create unique index if not exists product_units_business_name_unique
  on public.product_units (business_id, lower(name));

create index if not exists product_units_business_sort_idx
  on public.product_units (business_id, sort_order, name);

alter table public.product_categories enable row level security;
alter table public.product_units enable row level security;

-- Access is through authenticated Next.js server routes only.
revoke all on public.product_categories from anon, authenticated;
revoke all on public.product_units from anon, authenticated;
