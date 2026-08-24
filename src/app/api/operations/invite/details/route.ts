import { createHash } from "crypto";

import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

function hashToken(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token")?.trim() ?? "";

    if (token.length < 32) {
      return NextResponse.json(
        {
          ok: false,
          code: "INVALID_INVITE",
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
        "id,business_id,email,display_name,status,expires_at,businesses(name)"
      )
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (invitationError) {
      console.error(
        "Operations invitation details lookup failed:",
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

    const businessRelation = invitation.businesses as
      | { name: string }
      | { name: string }[]
      | null;

    const businessName = Array.isArray(businessRelation)
      ? businessRelation[0]?.name ?? "KitchenOps"
      : businessRelation?.name ?? "KitchenOps";

    return NextResponse.json({
      ok: true,
      invitation: {
        email: invitation.email,
        name: invitation.display_name,
        businessName,
        expiresAt: invitation.expires_at,
      },
    });
  } catch (error) {
    console.error(
      "Unexpected Operations invitation details error:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error: "KitchenOps could not check this invitation.",
      },
      { status: 500 }
    );
  }
}