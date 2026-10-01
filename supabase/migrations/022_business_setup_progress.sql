-- KitchenOps guided onboarding progress.
-- Existing businesses remain unclassified.
-- New businesses default to pending.

alter table public.businesses
  add column if not exists setup_status text,
  add column if not exists setup_step text,
  add column if not exists setup_updated_at timestamptz;

-- Existing businesses must not be forced back into onboarding.
-- This statement deliberately affects defaults only, not existing rows.
alter table public.businesses
  alter column setup_status set default 'pending',
  alter column setup_step set default 'welcome';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'businesses_setup_status_valid'
  ) then
    alter table public.businesses
      add constraint businesses_setup_status_valid
      check (
        setup_status is null
        or setup_status in ('pending', 'complete', 'dismissed')
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'businesses_setup_step_valid'
  ) then
    alter table public.businesses
      add constraint businesses_setup_step_valid
      check (
        setup_step is null
        or setup_step in (
          'welcome',
          'site',
          'supplier',
          'products',
          'storage',
          'team',
          'ready'
        )
      );
  end if;
end
$$;


-- Read setup progress for an authorised Operations member.

create or replace function public.get_kitchenops_setup_progress(
  requested_business_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if auth.uid() is null or not exists (
    select 1
    from public.business_memberships m
    join public.businesses b
      on b.id = m.business_id
    where m.business_id = requested_business_id
      and m.auth_user_id = auth.uid()
      and m.role = 'operations'
      and m.active = true
      and b.active = true
  ) then
    raise exception 'Operations access required.';
  end if;

  select jsonb_build_object(
    'status', b.setup_status,
    'step', b.setup_step,
    'updatedAt', b.setup_updated_at
  )
  into result
  from public.businesses b
  where b.id = requested_business_id;

  return result;
end;
$$;


-- Persist setup progress against the business, not the device.

create or replace function public.set_kitchenops_setup_progress(
  requested_business_id uuid,
  requested_status text,
  requested_step text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if auth.uid() is null or not exists (
    select 1
    from public.business_memberships m
    join public.businesses b
      on b.id = m.business_id
    where m.business_id = requested_business_id
      and m.auth_user_id = auth.uid()
      and m.role = 'operations'
      and m.active = true
      and b.active = true
  ) then
    raise exception 'Operations access required.';
  end if;

  if requested_status is null or requested_status not in (
    'pending', 'complete', 'dismissed'
  ) then
    raise exception 'Invalid setup status.';
  end if;

  if requested_step is null or requested_step not in (
    'welcome', 'site', 'supplier', 'products',
    'storage', 'team', 'ready'
  ) then
    raise exception 'Invalid setup step.';
  end if;

  update public.businesses
  set
    setup_status = case
      when setup_status = 'complete' then 'complete'
      when setup_status = 'dismissed' and requested_status = 'pending'
        then 'dismissed'
      else requested_status
    end,
    setup_step = case
      when coalesce(
        array_position(
          array['welcome','site','supplier','products','storage','team','ready'],
          setup_step
        ),
        0
      ) >= array_position(
        array['welcome','site','supplier','products','storage','team','ready'],
        requested_step
      )
        then setup_step
      else requested_step
    end,
    setup_updated_at = now()
  where id = requested_business_id;

  select jsonb_build_object(
    'status', b.setup_status,
    'step', b.setup_step,
    'updatedAt', b.setup_updated_at
  )
  into result
  from public.businesses b
  where b.id = requested_business_id;

  return result;
end;
$$;

revoke all on function public.get_kitchenops_setup_progress(uuid)
  from public, anon;

revoke all on function public.set_kitchenops_setup_progress(uuid, text, text)
  from public, anon;

grant execute on function public.get_kitchenops_setup_progress(uuid)
  to authenticated;

grant execute on function public.set_kitchenops_setup_progress(uuid, text, text)
  to authenticated;
