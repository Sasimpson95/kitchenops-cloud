import { NextRequest, NextResponse } from "next/server";

import {
  checkLookupRateLimit,
  getAuthClientKey,
  recordLookupAttempt,
} from "@/lib/auth/rateLimit";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      businessCode?: string;
    };

    const businessCode = body.businessCode?.trim().toUpperCase();

    if (!businessCode || !/^[A-Z0-9_-]{3,32}$/.test(businessCode)) {
      return NextResponse.json(
        { error: "Enter a valid business code." },
        { status: 400 }
      );
    }

    const clientKey = getAuthClientKey(request);
    const allowed = await checkLookupRateLimit({ clientKey });

    if (!allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Try again in 15 minutes." },
        { status: 429 }
      );
    }

    await recordLookupAttempt({ clientKey, businessCode });

    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("lookup_staff_login", {
      requested_business_code: businessCode,
    });

    if (error) {
      return NextResponse.json(
        { error: "Business not found." },
        { status: 400 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Staff lookup route error:", error);
    return NextResponse.json(
      { error: "KitchenOps could not check that business right now." },
      { status: 500 }
    );
  }
}
