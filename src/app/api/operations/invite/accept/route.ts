import { createHash } from "crypto";

import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type AcceptInviteBody = {
  token?: string;
};

function normaliseEmail(value: string): string {
  return value.trim().toLowerCase();
}

function hashToken(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

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
          code: "AUTH_REQUIRED",
          error: "Sign in or create your account before accepting this invitation.",
        },
        { status: 401 }
      );
    }

    if (!user.email) {
      return NextResponse.json(
        {
          ok: false,
          error: "Your KitchenOps account does not have an email address.",
        },
        { status: 400 }
      );
    }

    let body: AcceptInviteBody;

    try {
      body = (await request.json()) as AcceptInviteBody;
    } catch {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid invitation request.",
        },
        { status: 400 }
      );
    }

    const token = body.token?.trim() ?? "";

    if (token.length < 32) {
      return NextResponse.json(
        {
          ok: false,
          error: "This invitation link is invalid.",
        },
        { status: 400 }
      );
    }

    const tokenHash = hashToken(token);
    const admin = createAdminClient();

    const {
      data: invitation,
      error: invitationError,
    } = await admin
      .from("operations_invitations")
      .select(
        "id,business_id,email,display_name,status,expires_at"
      )
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (invitationError) {
      console.error(
        "Operations invitation lookup failed:",
        invitationError
      );

      return NextResponse.json(
        {
          ok: false,
          error: "KitchenOps could not check this invitation.",
        },
        { status: 500 }
      );
    }

    if (!invitation) {
      return NextResponse.json(
        {
          ok: false,
          code: "INVALID_INVITE",
          error: "This invitation could not be found.",
        },
        { status: 404 }
      );
    }

    if (invitation.status !== "pending") {
      return NextResponse.json(
        {
          ok: false,
          code: "INVITE_NOT_PENDING",
          error:
            invitation.status === "accepted"
              ? "This invitation has already been accepted."
              : "This invitation is no longer active.",
        },
        { status: 409 }
      );
    }

    const expiresAt = new Date(invitation.expires_at);

    if (
      Number.isNaN(expiresAt.getTime()) ||
      expiresAt.getTime() <= Date.now()
    ) {
      await admin
        .from("operations_invitations")
        .update({
          status: "expired",
        })
        .eq("id", invitation.id)
        .eq("status", "pending");

      return NextResponse.json(
        {
          ok: false,
          code: "INVITE_EXPIRED",
          error: "This Operations invitation has expired.",
        },
        { status: 410 }
      );
    }

    const authenticatedEmail = normaliseEmail(user.email);
    const invitedEmail = normaliseEmail(invitation.email);

    if (authenticatedEmail !== invitedEmail) {
      return NextResponse.json(
        {
          ok: false,
          code: "EMAIL_MISMATCH",
          error:
            `This invitation was sent to ${invitedEmail}. ` +
            "Sign in using that email address to accept it.",
        },
        { status: 403 }
      );
    }

    const {
      data: existingMemberships,
      error: membershipLookupError,
    } = await admin
      .from("business_memberships")
      .select("id,business_id,active")
      .eq("auth_user_id", user.id)
      .eq("active", true);

    if (membershipLookupError) {
      console.error(
        "Operations invitation membership check failed:",
        membershipLookupError
      );

      return NextResponse.json(
        {
          ok: false,
          error: "KitchenOps could not check your existing business access.",
        },
        { status: 500 }
      );
    }

    const activeMemberships = existingMemberships ?? [];

    const membershipForThisBusiness =
      activeMemberships.find(
        (membership) =>
          membership.business_id === invitation.business_id
      );

    if (membershipForThisBusiness) {
      await admin
        .from("operations_invitations")
        .update({
          status: "accepted",
          accepted_at: new Date().toISOString(),
        })
        .eq("id", invitation.id)
        .eq("status", "pending");

      return NextResponse.json({
        ok: true,
        alreadyMember: true,
        message: "You already have Operations access to this business.",
      });
    }

    if (activeMemberships.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          code: "ALREADY_IN_BUSINESS",
          error:
            "This KitchenOps account already belongs to another business.",
        },
        { status: 409 }
      );
    }

    const {
      data: createdMembership,
      error: membershipInsertError,
    } = await admin
      .from("business_memberships")
      .insert({
        business_id: invitation.business_id,
        auth_user_id: user.id,
        display_name: invitation.display_name,
        role: "operations",
        active: true,
      })
      .select("id")
      .single();

    if (membershipInsertError || !createdMembership) {
      console.error(
        "Operations membership creation failed:",
        membershipInsertError
      );

      return NextResponse.json(
        {
          ok: false,
          error: "Your Operations access could not be created.",
        },
        { status: 500 }
      );
    }

    const {
      data: acceptedInvitation,
      error: invitationUpdateError,
    } = await admin
      .from("operations_invitations")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", invitation.id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();

    if (invitationUpdateError || !acceptedInvitation) {
      console.error(
        "Operations invitation acceptance update failed:",
        invitationUpdateError
      );

      const { error: rollbackError } = await admin
        .from("business_memberships")
        .delete()
        .eq("id", createdMembership.id);

      if (rollbackError) {
        console.error(
          "Operations membership rollback failed:",
          rollbackError
        );
      }

      return NextResponse.json(
        {
          ok: false,
          error:
            "KitchenOps could not complete the invitation acceptance.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Your Operations access is ready.",
    });
  } catch (error) {
    console.error(
      "Unexpected Operations invitation acceptance error:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error: "This Operations invitation could not be accepted.",
      },
      { status: 500 }
    );
  }
}