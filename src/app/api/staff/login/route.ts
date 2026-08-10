import { NextRequest, NextResponse } from "next/server";

import {
  checkPinRateLimit,
  clearSuccessfulPinAttempts,
  getAuthClientKey,
  recordFailedPinAttempt,
} from "@/lib/auth/rateLimit";
import {
  STAFF_COOKIE_NAME,
  createStaffSessionToken,
} from "@/lib/auth/staffSession";
import { createAdminClient } from "@/lib/supabase/admin";

type StaffLoginBody = {
  businessCode?: string;
  siteId?: string;
  staffId?: string;
  pin?: string;
};

type StaffLoginResult = {
  staffId: string;
  businessId: string;
  businessName: string;
  siteId: string;
  siteName: string;
  name: string;
  role: "manager" | "chef";
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as StaffLoginBody;
    const businessCode = body.businessCode?.trim().toUpperCase();
    const siteId = body.siteId?.trim();
    const staffId = body.staffId?.trim();
    const pin = body.pin?.trim();

    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (
      !businessCode ||
      !/^[A-Z0-9_-]{3,32}$/.test(businessCode) ||
      !siteId ||
      !uuidPattern.test(siteId) ||
      !staffId ||
      !uuidPattern.test(staffId) ||
      !pin ||
      !/^\d{4}$/.test(pin)
    ) {
      return NextResponse.json(
        { error: "Enter a valid business, site, staff member and 4-digit PIN." },
        { status: 400 }
      );
    }

    const clientKey = getAuthClientKey(request);
    const limit = await checkPinRateLimit({
      clientKey,
      businessCode,
      siteId,
      staffId,
    });

    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many incorrect PIN attempts. Try again in 15 minutes." },
        { status: 429 }
      );
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("verify_staff_pin", {
      requested_business_code: businessCode,
      requested_site_id: siteId,
      requested_staff_id: staffId,
      supplied_pin: pin,
    });

    if (error || !data) {
      await recordFailedPinAttempt({
        clientKey,
        businessCode,
        siteId,
        staffId,
      });
      return NextResponse.json(
        { error: "Incorrect PIN or inactive account." },
        { status: 401 }
      );
    }

    const session = data as StaffLoginResult;

    if (
      !session.staffId ||
      !session.businessId ||
      !session.siteId ||
      !session.name ||
      !session.role
    ) {
      return NextResponse.json(
        { error: "The staff login response was incomplete." },
        { status: 500 }
      );
    }

    await clearSuccessfulPinAttempts({
      clientKey,
      businessCode,
      siteId,
      staffId,
    });

    const expiresAt = Date.now() + 12 * 60 * 60 * 1000;
    const response = NextResponse.json({
      success: true,
      user: {
        name: session.name,
        role: session.role,
        site: session.siteName,
        siteId: session.siteId,
      },
    });

    response.cookies.set(
      STAFF_COOKIE_NAME,
      createStaffSessionToken({ ...session, expiresAt }),
      {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        expires: new Date(expiresAt),
      }
    );

    return response;
  } catch (caughtError) {
    console.error("Staff login route error:", caughtError);
    return NextResponse.json(
      { error: "Staff login failed. Please try again." },
      { status: 500 }
    );
  }
}
