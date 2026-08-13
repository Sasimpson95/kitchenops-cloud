import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  STAFF_COOKIE_NAME,
  createStaffSessionToken,
  readStaffSessionToken,
} from "@/lib/auth/staffSession";
import { createAdminClient } from "@/lib/supabase/admin";

type ChangePinBody = {
  newPin?: string;
  confirmPin?: string;
};

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const signedStaff = readStaffSessionToken(
      cookieStore.get(STAFF_COOKIE_NAME)?.value
    );

    if (!signedStaff) {
      return NextResponse.json(
        { error: "Your staff session has expired. Sign in again." },
        { status: 401 }
      );
    }

    const body = (await request.json()) as ChangePinBody;
    const newPin = body.newPin?.trim();
    const confirmPin = body.confirmPin?.trim();

    if (!newPin || !/^\d{4}$/.test(newPin)) {
      return NextResponse.json(
        { error: "Enter a new four-digit PIN." },
        { status: 400 }
      );
    }

    if (newPin !== confirmPin) {
      return NextResponse.json(
        { error: "The PINs do not match." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: staff, error: staffError } = await admin
      .from("staff_members")
      .select("id,business_id,site_id,name,role,active,must_change_pin,businesses!inner(id,name,active),sites!inner(id,name,active)")
      .eq("id", signedStaff.staffId)
      .eq("business_id", signedStaff.businessId)
      .maybeSingle();

    const rawBusiness = staff?.businesses;
    const business = Array.isArray(rawBusiness) ? rawBusiness[0] : rawBusiness;
    const rawSite = staff?.sites;
    const site = Array.isArray(rawSite) ? rawSite[0] : rawSite;

    if (
      staffError ||
      !staff ||
      !staff.active ||
      !business?.active ||
      !site?.active ||
      !staff.must_change_pin ||
      !signedStaff.pinChangeRequired
    ) {
      return NextResponse.json(
        { error: "Sign in with the current temporary PIN before choosing a new PIN." },
        { status: 403 }
      );
    }

    const { error: rpcError } = await admin.rpc("complete_staff_pin_change", {
      requested_staff_id: signedStaff.staffId,
      new_pin: newPin,
    });

    if (rpcError) {
      return NextResponse.json(
        { error: rpcError.message },
        { status: 400 }
      );
    }

    const refreshedSession = {
      staffId: staff.id,
      businessId: staff.business_id,
      businessName: business.name,
      siteId: staff.site_id,
      siteName: site.name,
      name: staff.name,
      role: staff.role as "manager" | "chef",
      pinChangeRequired: false,
      expiresAt: signedStaff.expiresAt,
    };

    const response = NextResponse.json({ success: true });
    response.cookies.set(
      STAFF_COOKIE_NAME,
      createStaffSessionToken(refreshedSession),
      {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        expires: new Date(signedStaff.expiresAt),
      }
    );

    return response;
  } catch (error) {
    console.error("Staff PIN change route error:", error);
    return NextResponse.json(
      { error: "The PIN could not be changed. Please try again." },
      { status: 500 }
    );
  }
}
