-- KitchenOps RC1 hardening
-- Shared operational records, atomic inventory movements and staff PIN rate limiting.

create table if not exists public.cloud_operational_records (
  business_id uuid not null references public.businesses(id) on delete cascade,
  kind text not null,
  record_id text not null,
  site_keys text[] not null default '{}',
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (business_id, kind, record_id),
  constraint cloud_operational_records_kind_valid check (
    kind in (
      'prep',
      'prep_history',
      'orders',
      'waste',
      'stocktakes',
      'transfers',
      'handovers'
    )
  )
);

create index if not exists cloud_operational_records_business_kind_idx
  on public.cloud_operational_records (business_id, kind, updated_at desc);

create index if not exists cloud_operational_records_site_keys_idx
  on public.cloud_operational_records using gin (site_keys);

alter table public.cloud_operational_records enable row level security;
revoke all on public.cloud_operational_records from anon, authenticated;

create table if not exists public.staff_auth_attempts (
  id bigint generated always as identity primary key,
  attempt_type text not null check (attempt_type in ('lookup', 'pin')),
  client_key text not null,
  business_code text not null,
  site_id uuid,
  staff_id uuid,
  attempted_at timestamptz not null default now()
);

create index if not exists staff_auth_attempts_client_idx
  on public.staff_auth_attempts (client_key, attempt_type, attempted_at desc);

create index if not exists staff_auth_attempts_staff_idx
  on public.staff_auth_attempts (business_code, site_id, staff_id, attempt_type, attempted_at desc);

alter table public.staff_auth_attempts enable row level security;
revoke all on public.staff_auth_attempts from anon, authenticated;

-- Staff PIN functions must only be callable through the KitchenOps server API.
-- Leaving them executable by anon/authenticated would allow direct RPC calls to
-- bypass the persistent rate limiter above.
-- PostgreSQL grants EXECUTE on new functions to PUBLIC by default. Revoking
-- only the Supabase anon/authenticated roles would therefore still leave the
-- RPC callable through their inherited PUBLIC privilege.
revoke execute on function public.lookup_staff_login(text) from public, anon, authenticated;
grant execute on function public.lookup_staff_login(text) to service_role;

revoke execute on function public.verify_staff_pin(text, uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.verify_staff_pin(text, uuid, uuid, text) to service_role;

-- Applies one inventory delta exactly once. The stock row is locked before the
-- quantity changes, so simultaneous devices cannot overwrite each other.
create or replace function public.apply_cloud_inventory_movement(
  requested_business_id uuid,
  requested_site_id text,
  requested_product_legacy_id bigint,
  requested_quantity numeric,
  requested_movement_id text,
  requested_movement_type text,
  requested_data jsonb,
  requested_created_at timestamptz
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  current_quantity numeric;
  next_quantity numeric;
begin
  if requested_business_id is null
    or length(trim(coalesce(requested_site_id, ''))) = 0
    or requested_product_legacy_id is null
    or requested_quantity is null
    or requested_quantity = 0
    or length(trim(coalesce(requested_movement_id, ''))) = 0
  then
    raise exception 'Inventory movement is incomplete.';
  end if;

  -- Idempotency: retrying a movement must never apply stock twice.
  if exists (
    select 1
    from public.cloud_inventory_movements
    where id = requested_movement_id
      and business_id = requested_business_id
  ) then
    select quantity
      into current_quantity
    from public.cloud_inventory_stock
    where business_id = requested_business_id
      and site_id = requested_site_id
      and product_legacy_id = requested_product_legacy_id;

    return coalesce(current_quantity, 0);
  end if;

  insert into public.cloud_inventory_stock (
    business_id,
    site_id,
    product_legacy_id,
    quantity,
    updated_at
  )
  values (
    requested_business_id,
    requested_site_id,
    requested_product_legacy_id,
    0,
    now()
  )
  on conflict (business_id, site_id, product_legacy_id) do nothing;

  select quantity
    into current_quantity
  from public.cloud_inventory_stock
  where business_id = requested_business_id
    and site_id = requested_site_id
    and product_legacy_id = requested_product_legacy_id
  for update;

  -- A concurrent retry can pass the first idempotency check while the original
  -- transaction is still uncommitted. Re-check after acquiring the stock-row
  -- lock so the second request returns the committed quantity instead of
  -- hitting the movement primary-key constraint and remaining queued forever.
  if exists (
    select 1
    from public.cloud_inventory_movements
    where id = requested_movement_id
      and business_id = requested_business_id
  ) then
    return coalesce(current_quantity, 0);
  end if;

  next_quantity := coalesce(current_quantity, 0) + requested_quantity;

  -- KitchenOps records the real movement even if it exposes a negative book
  -- balance; a later stocktake corrects the discrepancy without losing audit
  -- history. Client workflows still warn/prevent obvious over-consumption.

  insert into public.cloud_inventory_movements (
    id,
    business_id,
    site_id,
    product_legacy_id,
    movement_type,
    quantity,
    data,
    created_at
  )
  values (
    requested_movement_id,
    requested_business_id,
    requested_site_id,
    requested_product_legacy_id,
    requested_movement_type,
    requested_quantity,
    requested_data,
    coalesce(requested_created_at, now())
  );

  update public.cloud_inventory_stock
  set quantity = next_quantity,
      updated_at = now()
  where business_id = requested_business_id
    and site_id = requested_site_id
    and product_legacy_id = requested_product_legacy_id;

  return next_quantity;
end;
$$;

revoke all on function public.apply_cloud_inventory_movement(
  uuid, text, bigint, numeric, text, text, jsonb, timestamptz
) from public;
grant execute on function public.apply_cloud_inventory_movement(
  uuid, text, bigint, numeric, text, text, jsonb, timestamptz
) to service_role;

create or replace function public.apply_cloud_inventory_movements(
  requested_business_id uuid,
  requested_movements jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  movement jsonb;
  applied_quantity numeric;
  result jsonb := '[]'::jsonb;
begin
  if requested_business_id is null
    or requested_movements is null
    or jsonb_typeof(requested_movements) <> 'array'
  then
    raise exception 'Inventory movement batch is invalid.';
  end if;

  for movement in
    select value from jsonb_array_elements(requested_movements)
  loop
    applied_quantity := public.apply_cloud_inventory_movement(
      requested_business_id,
      movement->>'siteId',
      (movement->>'productId')::bigint,
      (movement->>'quantity')::numeric,
      movement->>'id',
      coalesce(movement->>'movementType', 'Adjustment'),
      movement,
      coalesce((movement->>'createdAt')::timestamptz, now())
    );

    result := result || jsonb_build_array(
      jsonb_build_object(
        'id', movement->>'id',
        'siteId', movement->>'siteId',
        'productId', (movement->>'productId')::bigint,
        'quantity', applied_quantity
      )
    );
  end loop;

  return result;
end;
$$;

revoke all on function public.apply_cloud_inventory_movements(uuid, jsonb) from public;
grant execute on function public.apply_cloud_inventory_movements(uuid, jsonb) to service_role;

-- Shared recipe catalogue and product-to-storage-area assignments. These were
-- previously browser-only, which meant chef/manager devices could disagree.
create table if not exists public.cloud_recipes (
  business_id uuid not null references public.businesses(id) on delete cascade,
  recipe_key text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (business_id, recipe_key)
);

create index if not exists cloud_recipes_business_idx
  on public.cloud_recipes (business_id, updated_at desc);

alter table public.cloud_recipes enable row level security;
revoke all on public.cloud_recipes from anon, authenticated;

create table if not exists public.cloud_product_locations (
  business_id uuid not null references public.businesses(id) on delete cascade,
  site_id text not null,
  external_id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (business_id, site_id, external_id)
);

create index if not exists cloud_product_locations_business_site_idx
  on public.cloud_product_locations (business_id, site_id);

alter table public.cloud_product_locations enable row level security;
revoke all on public.cloud_product_locations from anon, authenticated;

-- Normalise legacy name-derived site keys in stock/storage data to the real
-- sites.id UUID before RC2 starts applying atomic inventory movements. Where a
-- legacy and UUID stock snapshot both exist, keep the most recently updated
-- snapshot rather than adding two snapshots together.
with stock_candidates as (
  select
    stock.business_id,
    site.id::text as canonical_site_id,
    stock.product_legacy_id,
    stock.quantity,
    stock.updated_at,
    row_number() over (
      partition by stock.business_id, site.id, stock.product_legacy_id
      order by stock.updated_at desc,
               case when stock.site_id = site.id::text then 0 else 1 end
    ) as row_rank
  from public.cloud_inventory_stock stock
  join public.sites site
    on site.business_id = stock.business_id
   and stock.site_id in (
     site.id::text,
     trim(both '-' from regexp_replace(lower(trim(site.name)), '[^a-z0-9]+', '-', 'g'))
   )
), latest_stock as (
  select business_id, canonical_site_id, product_legacy_id, quantity, updated_at
  from stock_candidates
  where row_rank = 1
)
insert into public.cloud_inventory_stock (
  business_id, site_id, product_legacy_id, quantity, updated_at
)
select business_id, canonical_site_id, product_legacy_id, quantity, updated_at
from latest_stock
on conflict (business_id, site_id, product_legacy_id)
do update set
  quantity = excluded.quantity,
  updated_at = excluded.updated_at
where excluded.updated_at >= public.cloud_inventory_stock.updated_at;

delete from public.cloud_inventory_stock stock
using public.sites site
where site.business_id = stock.business_id
  and stock.site_id = trim(
    both '-' from regexp_replace(lower(trim(site.name)), '[^a-z0-9]+', '-', 'g')
  )
  and stock.site_id <> site.id::text;

update public.cloud_inventory_movements movement
set site_id = site.id::text,
    data = jsonb_set(
      movement.data,
      '{siteId}',
      to_jsonb(site.id::text),
      true
    )
from public.sites site
where site.business_id = movement.business_id
  and movement.site_id = trim(
    both '-' from regexp_replace(lower(trim(site.name)), '[^a-z0-9]+', '-', 'g')
  )
  and movement.site_id <> site.id::text;

with storage_candidates as (
  select
    area.business_id,
    site.id::text as canonical_site_id,
    area.external_id,
    jsonb_set(area.data, '{siteId}', to_jsonb(site.id::text), true) as data,
    area.updated_at,
    row_number() over (
      partition by area.business_id, site.id, area.external_id
      order by area.updated_at desc,
               case when area.site_id = site.id::text then 0 else 1 end
    ) as row_rank
  from public.cloud_storage_areas area
  join public.sites site
    on site.business_id = area.business_id
   and area.site_id in (
     site.id::text,
     trim(both '-' from regexp_replace(lower(trim(site.name)), '[^a-z0-9]+', '-', 'g'))
   )
), latest_storage as (
  select business_id, canonical_site_id, external_id, data, updated_at
  from storage_candidates
  where row_rank = 1
)
insert into public.cloud_storage_areas (
  business_id, site_id, external_id, data, updated_at
)
select business_id, canonical_site_id, external_id, data, updated_at
from latest_storage
on conflict (business_id, site_id, external_id)
do update set
  data = excluded.data,
  updated_at = excluded.updated_at
where excluded.updated_at >= public.cloud_storage_areas.updated_at;

delete from public.cloud_storage_areas area
using public.sites site
where site.business_id = area.business_id
  and area.site_id = trim(
    both '-' from regexp_replace(lower(trim(site.name)), '[^a-z0-9]+', '-', 'g')
  )
  and area.site_id <> site.id::text;
