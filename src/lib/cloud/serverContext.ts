import { cookies } from "next/headers";

import {
  STAFF_COOKIE_NAME,
  readStaffSessionToken,
} from "@/lib/auth/staffSession";
import { siteNameToKey } from "@/lib/siteKey";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getKitchenOpsAccessState } from "@/lib/subscriptionAccess";

export type CloudRequestContext = {
  businessId: string;
  role: "operations" | "manager" | "chef";
  staffId?: string;
  staffName?: string;
  /** Canonical Supabase site UUID. */
  siteId?: string;
  siteName?: string;
  /** Legacy/name-derived key retained for prep/handover compatibility. */
  siteKey?: string;
};

export function getContextSiteAccessKeys(context: CloudRequestContext): string[] {
  return Array.from(
    new Set([context.siteId, context.siteKey].map((value) => value?.trim()).filter(Boolean) as string[])
  );
}

export async function getCloudRequestContext(): Promise<CloudRequestContext | null> {
  const cookieStore = await cookies();
  const signedStaff = readStaffSessionToken(
    cookieStore.get(STAFF_COOKIE_NAME)?.value
  );

  if (signedStaff) {
    const admin = createAdminClient();
    const { data: staff, error } = await admin
      .from("staff_members")
      .select(`
        id,
        business_id,
        site_id,
        name,
        role,
        active,
        businesses!inner (
          id,
          active,
          subscription_status,
          trial_ends_at
        ),
        sites!inner (
          id,
          name,
          active
        )
      `)
      .eq("id", signedStaff.staffId)
      .eq("business_id", signedStaff.businessId)
      .maybeSingle();

    if (error || !staff || !staff.active) return null;

    const rawBusiness = staff.businesses;
    const business = Array.isArray(rawBusiness) ? rawBusiness[0] : rawBusiness;
    const rawSite = staff.sites;
    const site = Array.isArray(rawSite) ? rawSite[0] : rawSite;

    if (!business?.active || !site?.active) return null;
    if (!getKitchenOpsAccessState(business).allowed) return null;
    if (staff.role !== "manager" && staff.role !== "chef") return null;

    return {
      businessId: staff.business_id,
      role: staff.role,
      staffId: staff.id,
      staffName: staff.name,
      siteId: staff.site_id,
      siteName: site.name,
      siteKey: siteNameToKey(site.name),
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: membership } = await supabase
    .from("business_memberships")
    .select(`
      business_id,
      role,
      active,
      businesses!inner (
        id,
        active,
        subscription_status,
        trial_ends_at
      )
    `)
    .eq("auth_user_id", user.id)
    .eq("active", true)
    .maybeSingle();

  if (!membership) return null;

  const rawBusiness = membership.businesses;
  const business = Array.isArray(rawBusiness) ? rawBusiness[0] : rawBusiness;
  if (!business?.active || !getKitchenOpsAccessState(business).allowed) return null;

  return {
    businessId: membership.business_id,
    role: "operations",
  };
}
