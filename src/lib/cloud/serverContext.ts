import { cookies } from "next/headers";

import {
  STAFF_COOKIE_NAME,
  readStaffSessionToken,
} from "@/lib/auth/staffSession";
import { createClient } from "@/lib/supabase/server";

export type CloudRequestContext = {
  businessId: string;
  role: "operations" | "manager" | "chef";
  siteId?: string;
};

export async function getCloudRequestContext(): Promise<CloudRequestContext | null> {
  const cookieStore = await cookies();
  const staff = readStaffSessionToken(
    cookieStore.get(STAFF_COOKIE_NAME)?.value
  );

  if (staff) {
    return {
      businessId: staff.businessId,
      role: staff.role,
      siteId: staff.siteId,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: membership } = await supabase
    .from("business_memberships")
    .select("business_id, role, active")
    .eq("auth_user_id", user.id)
    .eq("active", true)
    .maybeSingle();

  if (!membership) return null;

  return {
    businessId: membership.business_id,
    role: "operations",
  };
}
