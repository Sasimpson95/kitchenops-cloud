-- KitchenOps Sprint 2: cloud suppliers, products, storage areas and inventory.

create table if not exists public.cloud_suppliers (
  business_id uuid not null references public.businesses(id) on delete cascade,
  legacy_id bigint not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (business_id, legacy_id)
);

create table if not exists public.cloud_products (
  business_id uuid not null references public.businesses(id) on delete cascade,
  legacy_id bigint not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (business_id, legacy_id)
);

create table if not exists public.cloud_storage_areas (
  business_id uuid not null references public.businesses(id) on delete cascade,
  site_id text not null,
  external_id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (business_id, site_id, external_id)
);

create table if not exists public.cloud_inventory_stock (
  business_id uuid not null references public.businesses(id) on delete cascade,
  site_id text not null,
  product_legacy_id bigint not null,
  quantity numeric not null default 0,
  updated_at timestamptz not null default now(),
  primary key (business_id, site_id, product_legacy_id)
);

create table if not exists public.cloud_inventory_movements (
  id text primary key,
  business_id uuid not null references public.businesses(id) on delete cascade,
  site_id text not null,
  product_legacy_id bigint not null,
  movement_type text not null,
  quantity numeric not null,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists cloud_products_business_idx
  on public.cloud_products (business_id);
create index if not exists cloud_storage_business_site_idx
  on public.cloud_storage_areas (business_id, site_id);
create index if not exists cloud_stock_business_site_idx
  on public.cloud_inventory_stock (business_id, site_id);
create index if not exists cloud_movements_business_site_idx
  on public.cloud_inventory_movements (business_id, site_id, created_at desc);

alter table public.cloud_suppliers enable row level security;
alter table public.cloud_products enable row level security;
alter table public.cloud_storage_areas enable row level security;
alter table public.cloud_inventory_stock enable row level security;
alter table public.cloud_inventory_movements enable row level security;

-- Browser access is intentionally blocked. Next.js server routes verify the
-- Operations/staff session and access these tables with the server-only secret.
revoke all on public.cloud_suppliers from anon, authenticated;
revoke all on public.cloud_products from anon, authenticated;
revoke all on public.cloud_storage_areas from anon, authenticated;
revoke all on public.cloud_inventory_stock from anon, authenticated;
revoke all on public.cloud_inventory_movements from anon, authenticated;
