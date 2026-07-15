import {
  NextResponse,
} from "next/server";

import {
  cookies,
} from "next/headers";

import {
  STAFF_COOKIE_NAME,
} from "@/lib/auth/staffSession";

import {
  createClient,
} from "@/lib/supabase/server";

export async function POST() {
  const cookieStore =
    await cookies();

  cookieStore.delete(
    STAFF_COOKIE_NAME
  );

  const supabase =
    await createClient();

  await supabase.auth.signOut();

  return NextResponse.json({
    success: true,
  });
}
