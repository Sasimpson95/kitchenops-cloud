import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  STAFF_COOKIE_NAME,
  createStaffSessionToken,
  readStaffSessionToken,
} from "@/lib/auth/staffSession";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function clearStaffCookie(response: NextResponse): NextResponse {
  response.cookies.set(STAFF_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
  return response;
}

export async function GET() {
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
          name,
          active
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

    const rawBusiness = staff?.businesses;
    const business = Array.isArray(rawBusiness) ? rawBusiness[0] : rawBusiness;
    const rawSite = staff?.sites;
    const site = Array.isArray(rawSite) ? rawSite[0] : rawSite;

    if (
      error ||
      !staff ||
      !staff.active ||
      !business?.active ||
      !site?.active ||
      (staff.role !== "manager" && staff.role !== "chef")
    ) {
      return clearStaffCookie(
        NextResponse.json({ authenticated: false }, { status: 401 })
      );
    }

    const expiresAt = signedStaff.expiresAt;
    const refreshedSession = {
      staffId: staff.id,
      businessId: staff.business_id,
      businessName: business.name,
      siteId: staff.site_id,
      siteName: site.name,
      name: staff.name,
      role: staff.role as "manager" | "chef",
      expiresAt,
    };

    const response = NextResponse.json({
      authenticated: true,
      user: {
        name: refreshedSession.name,
        role: refreshedSession.role,
        site: refreshedSession.siteName,
        siteId: refreshedSession.siteId,
      },
      business: {
        id: refreshedSession.businessId,
        name: refreshedSession.businessName,
      },
      siteId: refreshedSession.siteId,
      authType: "pin",
    });

    // Re-sign current authoritative role/site details so changes take effect
    // without waiting for the original 12-hour cookie to expire.
    response.cookies.set(
      STAFF_COOKIE_NAME,
      createStaffSessionToken(refreshedSession),
      {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        expires: new Date(expiresAt),
      }
    );

    return response;
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );
  }

  const { data: membership, error } = await supabase
    .from("business_memberships")
    .select(`
      business_id,
      display_name,
      role,
      active,
      businesses (
        id,
        name,
        code
      )
    `)
    .eq("auth_user_id", user.id)
    .eq("active", true)
    .maybeSingle();

  if (error || !membership) {
    return NextResponse.json(
      {
        authenticated: false,
        needsOnboarding: true,
      },
      { status: 403 }
    );
  }

  const rawBusiness = membership.businesses;
  const business = Array.isArray(rawBusiness)
    ? rawBusiness[0]
    : rawBusiness;

  return NextResponse.json({
    authenticated: true,
    user: {
      name: membership.display_name,
      role: "operations",
      site: "All Sites",
    },
    business: business
      ? {
          id: business.id,
          name: business.name,
          code: business.code,
        }
      : null,
    authType: "supabase",
  });
}
