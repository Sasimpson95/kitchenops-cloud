import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@/lib/supabase/server";

export async function POST(
  request: NextRequest
) {
  const body = await request.json() as {
    businessCode?: string;
  };

  const businessCode =
    body.businessCode
      ?.trim()
      .toUpperCase();

  if (!businessCode) {
    return NextResponse.json(
      { error: "Enter a business code." },
      { status: 400 }
    );
  }

  const supabase =
    await createClient();

  const { data, error } =
    await supabase.rpc(
      "lookup_staff_login",
      {
        requested_business_code:
          businessCode,
      }
    );

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  return NextResponse.json(data);
}
