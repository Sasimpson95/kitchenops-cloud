-- KitchenOps workflow polish: unplanned invoices and handover history.
create table if not exists public.received_invoices (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  site_id text not null, site_name text not null, supplier_id bigint, supplier_name text not null,
  invoice_number text not null, invoice_date date not null, total numeric(12,2) not null default 0,
  received_by text not null, created_at timestamptz not null default now()
);
create unique index if not exists received_invoices_unique_number on public.received_invoices(business_id,site_id,supplier_name,invoice_number);
create table if not exists public.received_invoice_lines (
  id uuid primary key default gen_random_uuid(), invoice_id uuid not null references public.received_invoices(id) on delete cascade,
  product_legacy_id bigint not null, product_name text not null, purchase_units numeric not null, unit_price numeric(12,4) not null, line_total numeric(12,2) not null
);
create table if not exists public.handover_versions (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  site_id text, site_name text not null, handover_day text not null check(handover_day in('today','tomorrow')),
  notes jsonb not null default '[]'::jsonb, updated_by text not null, created_at timestamptz not null default now()
);
create index if not exists received_invoices_business_site_idx on public.received_invoices(business_id,site_id,created_at desc);
create index if not exists handover_versions_business_site_idx on public.handover_versions(business_id,site_name,created_at desc);
alter table public.received_invoices enable row level security; alter table public.received_invoice_lines enable row level security; alter table public.handover_versions enable row level security;
revoke all on public.received_invoices from anon,authenticated; revoke all on public.received_invoice_lines from anon,authenticated; revoke all on public.handover_versions from anon,authenticated;
