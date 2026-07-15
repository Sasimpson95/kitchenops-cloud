import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  STAFF_COOKIE_NAME,
  createStaffSessionToken,
} from "@/lib/auth/staffSession";
import {
  createClient,
} from "@/lib/supabase/server";

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
    const body = await request.json() as StaffLoginBody;
    const businessCode = body.businessCode?.trim().toUpperCase();
    const siteId = body.siteId?.trim();
    const staffId = body.staffId?.trim();
    const pin = body.pin?.trim();

    if (!businessCode || !siteId || !staffId || !pin) {
      return NextResponse.json(
        { error: "Business, site, staff member and PIN are required." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase.rpc(
      "verify_staff_pin",
      {
        requested_business_code: businessCode,
        requested_site_id: siteId,
        requested_staff_id: staffId,
        supplied_pin: pin,
      }
    );

    if (error) {
      console.error("verify_staff_pin failed:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    if (!data) {
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

    const expiresAt = Date.now() + 12 * 60 * 60 * 1000;
    const response = NextResponse.json({
      success: true,
      user: {
        name: session.name,
        role: session.role,
        site: session.siteName,
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
      {
        error:
          caughtError instanceof Error
            ? caughtError.message
            : "Staff login failed.",
      },
      { status: 500 }
    );
  }
}
