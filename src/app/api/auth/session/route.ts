import {
  NextResponse,
} from "next/server";

import {
  cookies,
} from "next/headers";

import {
  STAFF_COOKIE_NAME,
  readStaffSessionToken,
} from "@/lib/auth/staffSession";

import {
  createClient,
} from "@/lib/supabase/server";

export async function GET() {
  const cookieStore =
    await cookies();

  const staffSession =
    readStaffSessionToken(
      cookieStore.get(
        STAFF_COOKIE_NAME
      )?.value
    );

  if (staffSession) {
    return NextResponse.json({
      authenticated: true,
      user: {
        name: staffSession.name,
        role: staffSession.role,
        site: staffSession.siteName,
      },
      business: {
        id: staffSession.businessId,
        name: staffSession.businessName,
      },
      siteId: staffSession.siteId,
      authType: "pin",
    });
  }

  const supabase =
    await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );
  }

  const {
    data: membership,
    error,
  } = await supabase
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
