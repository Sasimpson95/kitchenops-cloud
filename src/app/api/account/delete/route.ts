import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type DeleteAccountBody = {
  confirmation?: string;
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          ok: false,
          error: "You must be signed in to delete your account.",
        },
        { status: 401 }
      );
    }

    let body: DeleteAccountBody;

    try {
      body = (await request.json()) as DeleteAccountBody;
    } catch {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid deletion request.",
        },
        { status: 400 }
      );
    }

    if (body.confirmation !== "DELETE") {
      return NextResponse.json(
        {
          ok: false,
          error: 'Type "DELETE" to confirm account deletion.',
        },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data: memberships, error: membershipError } = await admin
      .from("business_memberships")
      .select("id,business_id,active")
      .eq("auth_user_id", user.id)
      .eq("active", true);

    if (membershipError) {
      console.error(
        "Account deletion membership lookup failed:",
        membershipError
      );

      return NextResponse.json(
        {
          ok: false,
          error: "Your account could not be checked for deletion.",
        },
        { status: 500 }
      );
    }

    if (!memberships || memberships.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "No active KitchenOps business membership was found.",
        },
        { status: 400 }
      );
    }

    for (const membership of memberships) {
      const { count, error: countError } = await admin
        .from("business_memberships")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("business_id", membership.business_id)
        .eq("active", true);

      if (countError) {
        console.error(
          "Account deletion membership count failed:",
          countError
        );

        return NextResponse.json(
          {
            ok: false,
            error: "Your business access could not be checked.",
          },
          { status: 500 }
        );
      }

      if ((count ?? 0) <= 1) {
        return NextResponse.json(
          {
            ok: false,
            code: "SOLE_OPERATIONS_USER",
            error:
              "You are the only Operations user for this business. Add another Operations user before deleting your account, or contact KitchenOps if the entire business should be deleted.",
          },
          { status: 409 }
        );
      }
    }

    const { error: deleteError } =
      await admin.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error(
        "Supabase account deletion failed:",
        deleteError
      );

      return NextResponse.json(
        {
          ok: false,
          error: "Your account could not be deleted.",
        },
        { status: 500 }
      );
    }

    // Best effort: clear the local Supabase session after the
    // authoritative Auth user has been removed.
    try {
      await supabase.auth.signOut();
    } catch {
      // The Auth user is already deleted, so deletion itself succeeded.
    }

    return NextResponse.json({
      ok: true,
      message: "Your KitchenOps account has been deleted.",
    });
  } catch (error) {
    console.error("Unexpected account deletion error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Your account could not be deleted.",
      },
      { status: 500 }
    );
  }
}