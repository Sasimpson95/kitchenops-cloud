-- KitchenOps RC14: first-login and reset-PIN completion flow.

create or replace function public.complete_staff_pin_change(
  requested_staff_id uuid,
  new_pin text
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  selected_staff public.staff_members;
begin
  if new_pin !~ '^[0-9]{4}$' then
    raise exception 'PIN must contain exactly 4 digits.';
  end if;

  select * into selected_staff
  from public.staff_members
  where id = requested_staff_id
    and active = true;

  if selected_staff.id is null then
    raise exception 'Staff member not found.';
  end if;

  if selected_staff.must_change_pin is not true then
    raise exception 'A PIN change is not currently required.';
  end if;

  if selected_staff.pin_hash = crypt(new_pin, selected_staff.pin_hash) then
    raise exception 'Choose a PIN different from the temporary PIN.';
  end if;

  update public.staff_members
  set
    pin_hash = crypt(new_pin, gen_salt('bf')),
    must_change_pin = false
  where id = requested_staff_id;
end;
$$;

revoke all on function public.complete_staff_pin_change(uuid, text) from public, anon, authenticated;
grant execute on function public.complete_staff_pin_change(uuid, text) to service_role;
