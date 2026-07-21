-- KitchenOps v0.9.7.2: managers choose whether a handover is visible to chefs.
alter table public.handover_versions
  add column if not exists visible_to_chefs boolean not null default false;
