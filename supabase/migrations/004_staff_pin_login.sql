-- KitchenOps Cloud
-- Migration 004: public staff lookup and secure PIN verification

create or replace function public.lookup_staff_login(
  requested_business_code text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_business public.businesses;
  result jsonb;
begin
  select *
  into selected_business
  from public.businesses
  where lower(code) = lower(trim(requested_business_code))
    and active = true;

  if selected_business.id is null then
    raise exception 'Business not found.';
  end if;

  select jsonb_build_object(
    'businessName', selected_business.name,
    'sites', coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', site_rows.id,
          'name', site_rows.name,
          'staff', site_rows.staff
        )
        order by site_rows.name
      ),
      '[]'::jsonb
    )
  )
  into result
  from (
    select
      sites.id,
      sites.name,
      coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', staff.id,
            'name', staff.name,
            'role', staff.role
          )
          order by staff.name
        ) filter (where staff.id is not null),
        '[]'::jsonb
      ) as staff
    from public.sites
    left join public.staff_members staff
      on staff.site_id = sites.id
      and staff.business_id = selected_business.id
      and staff.active = true
    where sites.business_id = selected_business.id
      and sites.active = true
    group by sites.id, sites.name
  ) site_rows;

  return result;
end;
$$;

create or replace function public.verify_staff_pin(
  requested_business_code text,
  requested_site_id uuid,
  requested_staff_id uuid,
  supplied_pin text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_business public.businesses;
  selected_site public.sites;
  selected_staff public.staff_members;
begin
  select * into selected_business
  from public.businesses
  where lower(code) = lower(trim(requested_business_code))
    and active = true;

  if selected_business.id is null then
    raise exception 'Invalid login details.';
  end if;

  select * into selected_site
  from public.sites
  where id = requested_site_id
    and business_id = selected_business.id
    and active = true;

  select * into selected_staff
  from public.staff_members
  where id = requested_staff_id
    and business_id = selected_business.id
    and site_id = requested_site_id
    and active = true;

  if selected_site.id is null
    or selected_staff.id is null
    or supplied_pin is null
    or selected_staff.pin_hash <> crypt(supplied_pin, selected_staff.pin_hash)
  then
    raise exception 'Invalid login details.';
  end if;

  update public.staff_members
  set last_login_at = now()
  where id = selected_staff.id;

  return jsonb_build_object(
    'staffId', selected_staff.id,
    'businessId', selected_business.id,
    'businessName', selected_business.name,
    'siteId', selected_site.id,
    'siteName', selected_site.name,
    'name', selected_staff.name,
    'role', selected_staff.role
  );
end;
$$;

revoke all on function public.lookup_staff_login(text) from public;
grant execute on function public.lookup_staff_login(text) to anon, authenticated;

revoke all on function public.verify_staff_pin(text, uuid, uuid, text) from public;
grant execute on function public.verify_staff_pin(text, uuid, uuid, text) to anon, authenticated;
