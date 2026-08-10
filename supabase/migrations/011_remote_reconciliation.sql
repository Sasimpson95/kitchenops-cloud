set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.create_kitchenops_business(business_name text, business_code text, operations_name text, first_site_name text DEFAULT ''::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  current_auth_user uuid;
  created_business public.businesses;
begin
  current_auth_user := auth.uid();
  if current_auth_user is null then raise exception 'You must be signed in.'; end if;
  if length(trim(business_name)) < 2 then raise exception 'Business name must contain at least 2 characters.'; end if;
  if length(trim(business_code)) < 3 then raise exception 'Business code must contain at least 3 characters.'; end if;
  if length(trim(operations_name)) < 2 then raise exception 'Enter your name.'; end if;
  if exists (select 1 from public.business_memberships where auth_user_id=current_auth_user and active=true) then
    raise exception 'This account already belongs to a KitchenOps business.';
  end if;
  insert into public.businesses(name, code)
  values(trim(business_name), upper(trim(business_code)))
  returning * into created_business;
  insert into public.business_memberships(business_id, auth_user_id, display_name, role, active)
  values(created_business.id, current_auth_user, trim(operations_name), 'operations', true);
  return jsonb_build_object('business_id', created_business.id, 'business_name', created_business.name, 'business_code', created_business.code);
exception when unique_violation then
  raise exception 'That business code is already in use.';
end;
$function$
;

CREATE OR REPLACE FUNCTION public.lookup_staff_login(requested_business_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.verify_staff_pin(requested_business_code text, requested_site_id uuid, requested_staff_id uuid, supplied_pin text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
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
$function$
;

grant delete on table "public"."business_memberships" to "anon";

grant insert on table "public"."business_memberships" to "anon";

grant select on table "public"."business_memberships" to "anon";

grant update on table "public"."business_memberships" to "anon";

grant delete on table "public"."business_memberships" to "authenticated";

grant insert on table "public"."business_memberships" to "authenticated";

grant select on table "public"."business_memberships" to "authenticated";

grant update on table "public"."business_memberships" to "authenticated";

grant delete on table "public"."business_memberships" to "service_role";

grant insert on table "public"."business_memberships" to "service_role";

grant select on table "public"."business_memberships" to "service_role";

grant update on table "public"."business_memberships" to "service_role";

grant delete on table "public"."businesses" to "anon";

grant insert on table "public"."businesses" to "anon";

grant select on table "public"."businesses" to "anon";

grant update on table "public"."businesses" to "anon";

grant delete on table "public"."businesses" to "authenticated";

grant insert on table "public"."businesses" to "authenticated";

grant select on table "public"."businesses" to "authenticated";

grant update on table "public"."businesses" to "authenticated";

grant delete on table "public"."businesses" to "service_role";

grant insert on table "public"."businesses" to "service_role";

grant select on table "public"."businesses" to "service_role";

grant update on table "public"."businesses" to "service_role";

grant delete on table "public"."cloud_inventory_movements" to "service_role";

grant insert on table "public"."cloud_inventory_movements" to "service_role";

grant select on table "public"."cloud_inventory_movements" to "service_role";

grant update on table "public"."cloud_inventory_movements" to "service_role";

grant delete on table "public"."cloud_inventory_stock" to "service_role";

grant insert on table "public"."cloud_inventory_stock" to "service_role";

grant select on table "public"."cloud_inventory_stock" to "service_role";

grant update on table "public"."cloud_inventory_stock" to "service_role";

grant delete on table "public"."cloud_products" to "service_role";

grant insert on table "public"."cloud_products" to "service_role";

grant select on table "public"."cloud_products" to "service_role";

grant update on table "public"."cloud_products" to "service_role";

grant delete on table "public"."cloud_storage_areas" to "service_role";

grant insert on table "public"."cloud_storage_areas" to "service_role";

grant select on table "public"."cloud_storage_areas" to "service_role";

grant update on table "public"."cloud_storage_areas" to "service_role";

grant delete on table "public"."cloud_suppliers" to "service_role";

grant insert on table "public"."cloud_suppliers" to "service_role";

grant select on table "public"."cloud_suppliers" to "service_role";

grant update on table "public"."cloud_suppliers" to "service_role";

grant delete on table "public"."handover_versions" to "service_role";

grant insert on table "public"."handover_versions" to "service_role";

grant select on table "public"."handover_versions" to "service_role";

grant update on table "public"."handover_versions" to "service_role";

grant delete on table "public"."product_categories" to "service_role";

grant insert on table "public"."product_categories" to "service_role";

grant select on table "public"."product_categories" to "service_role";

grant update on table "public"."product_categories" to "service_role";

grant delete on table "public"."product_units" to "service_role";

grant insert on table "public"."product_units" to "service_role";

grant select on table "public"."product_units" to "service_role";

grant update on table "public"."product_units" to "service_role";

grant delete on table "public"."received_invoice_lines" to "service_role";

grant insert on table "public"."received_invoice_lines" to "service_role";

grant select on table "public"."received_invoice_lines" to "service_role";

grant update on table "public"."received_invoice_lines" to "service_role";

grant delete on table "public"."received_invoices" to "service_role";

grant insert on table "public"."received_invoices" to "service_role";

grant select on table "public"."received_invoices" to "service_role";

grant update on table "public"."received_invoices" to "service_role";

grant delete on table "public"."sites" to "anon";

grant insert on table "public"."sites" to "anon";

grant select on table "public"."sites" to "anon";

grant update on table "public"."sites" to "anon";

grant delete on table "public"."sites" to "authenticated";

grant insert on table "public"."sites" to "authenticated";

grant select on table "public"."sites" to "authenticated";

grant update on table "public"."sites" to "authenticated";

grant delete on table "public"."sites" to "service_role";

grant insert on table "public"."sites" to "service_role";

grant select on table "public"."sites" to "service_role";

grant update on table "public"."sites" to "service_role";

grant delete on table "public"."staff_members" to "anon";

grant insert on table "public"."staff_members" to "anon";

grant select on table "public"."staff_members" to "anon";

grant update on table "public"."staff_members" to "anon";

grant delete on table "public"."staff_members" to "authenticated";

grant insert on table "public"."staff_members" to "authenticated";

grant select on table "public"."staff_members" to "authenticated";

grant update on table "public"."staff_members" to "authenticated";

grant delete on table "public"."staff_members" to "service_role";

grant insert on table "public"."staff_members" to "service_role";

grant select on table "public"."staff_members" to "service_role";

grant update on table "public"."staff_members" to "service_role";


