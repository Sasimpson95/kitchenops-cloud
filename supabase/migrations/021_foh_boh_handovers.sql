-- KitchenOps: separate BOH and FOH manager handovers.
-- Existing handover records are BOH handovers.

alter table public.handover_versions
  add column if not exists handover_department text not null default 'boh';

alter table public.handover_versions
  drop constraint if exists handover_versions_department_valid;

alter table public.handover_versions
  add constraint handover_versions_department_valid
  check (handover_department in ('boh', 'foh'));

create index if not exists handover_versions_business_site_department_idx
  on public.handover_versions (
    business_id,
    site_name,
    handover_department,
    created_at desc
  );
