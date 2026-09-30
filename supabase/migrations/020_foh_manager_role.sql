-- KitchenOps: add FOH Manager as a staff role.
-- Existing "manager" accounts remain BOH Managers.

alter table public.staff_members
  drop constraint if exists staff_members_role_valid;

alter table public.staff_members
  add constraint staff_members_role_valid
  check (
    role in (
      'manager',
      'foh_manager',
      'chef'
    )
  );

create or replace function public.create_staff_member(
  requested_business_id uuid,
  requested_site_id uuid,
  staff_name text,
  staff_role text,
  temporary_pin text
)
returns public.staff_members
language plpgsql
security definer
set search_path = public
as $$
declare
  created_staff public.staff_members;
begin
  if not public.is_business_operations(requested_business_id) then
    raise exception 'Operations permission required.';
  end if;

  if staff_role not in (
    'manager',
    'foh_manager',
    'chef'
  ) then
    raise exception 'Role must be BOH Manager, FOH Manager or Chef.';
  end if;

  if temporary_pin !~ '^[0-9]{4}$' then
    raise exception 'PIN must contain exactly 4 digits.';
  end if;

  if not exists (
    select 1
    from public.sites
    where id = requested_site_id
      and business_id = requested_business_id
      and active = true
  ) then
    raise exception 'The selected site is invalid.';
  end if;

  insert into public.staff_members (
    business_id,
    site_id,
    name,
    role,
    pin_hash,
    must_change_pin
  )
  values (
    requested_business_id,
    requested_site_id,
    trim(staff_name),
    staff_role,
    crypt(
      temporary_pin,
      gen_salt('bf')
    ),
    true
  )
  returning *
  into created_staff;

  return created_staff;
end;
$$;
