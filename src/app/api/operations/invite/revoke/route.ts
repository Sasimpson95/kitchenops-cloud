import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type RevokeInviteBody = {
  invitationId?: string;
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
          error: "You must be signed in.",
        },
        { status: 401 }
      );
    }

    let body: RevokeInviteBody;

    try {
      body = (await request.json()) as RevokeInviteBody;
    } catch {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid invitation request.",
        },
        { status: 400 }
      );
    }

    const invitationId =
      body.invitationId?.trim() ?? "";

    if (!invitationId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invitation ID is required.",
        },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const {
      data: membership,
      error: membershipError,
    } = await admin
      .from("business_memberships")
      .select("business_id,role,active")
      .eq("auth_user_id", user.id)
      .eq("active", true)
      .eq("role", "operations")
      .maybeSingle();

    if (membershipError) {
      console.error(
        "Operations invitation revoke membership lookup failed:",
        membershipError
      );

      return NextResponse.json(
        {
          ok: false,
          error: "Your business access could not be verified.",
        },
        { status: 500 }
      );
    }

    if (!membership) {
      return NextResponse.json(
        {
          ok: false,
          error: "Operations permission required.",
        },
        { status: 403 }
      );
    }

    const {
      data: invitation,
      error: invitationError,
    } = await admin
      .from("operations_invitations")
      .select("id,status")
      .eq("id", invitationId)
      .eq("business_id", membership.business_id)
      .maybeSingle();

    if (invitationError) {
      console.error(
        "Operations invitation revoke lookup failed:",
        invitationError
      );

      return NextResponse.json(
        {
          ok: false,
          error: "The invitation could not be checked.",
        },
        { status: 500 }
      );
    }

    if (!invitation) {
      return NextResponse.json(
        {
          ok: false,
          error: "That invitation could not be found.",
        },
        { status: 404 }
      );
    }

    if (invitation.status !== "pending") {
      return NextResponse.json(
        {
          ok: false,
          error: "Only pending invitations can be revoked.",
        },
        { status: 409 }
      );
    }

    const {
      data: revokedInvite,
      error: revokeError,
    } = await admin
      .from("operations_invitations")
      .update({
        status: "revoked",
      })
      .eq("id", invitation.id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();

    if (revokeError || !revokedInvite) {
      console.error(
        "Operations invitation revoke failed:",
        revokeError
      );

      return NextResponse.json(
        {
          ok: false,
          error: "The invitation could not be revoked.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Operations invitation revoked.",
    });
  } catch (error) {
    console.error(
      "Unexpected Operations invitation revoke error:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error: "The invitation could not be revoked.",
      },
      { status: 500 }
    );
  }
}