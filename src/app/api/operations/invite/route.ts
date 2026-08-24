import { createHash, randomBytes } from "crypto";

import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type InviteBody = {
  name?: string;
  email?: string;
};

function normaliseEmail(value: string): string {
  return value.trim().toLowerCase();
}

function hashToken(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

async function sendInviteEmail(args: {
  apiKey: string;
  fromEmail: string;
  email: string;
  name: string;
  businessName: string;
  inviteUrl: string;
}) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: args.fromEmail,
      to: [args.email],
      subject: `You've been invited to ${args.businessName} on KitchenOps`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937">
          <h2 style="margin-bottom:12px">You're invited to KitchenOps</h2>

          <p>Hi ${args.name},</p>

          <p>
            You've been invited to join
            <strong>${args.businessName}</strong>
            as an Operations user on KitchenOps.
          </p>

          <p>
            Operations users can manage the business across KitchenOps,
            including sites, kitchen users, purchasing, inventory and settings.
          </p>

          <p style="margin:28px 0">
            <a
              href="${args.inviteUrl}"
              style="
                display:inline-block;
                background:#5b21b6;
                color:#ffffff;
                text-decoration:none;
                padding:12px 18px;
                border-radius:10px;
                font-weight:700;
              "
            >
              Accept invitation
            </a>
          </p>

          <p>
            This invitation expires in 7 days.
          </p>

          <p>
            If you weren't expecting this invitation, you can ignore this email.
          </p>
        </div>
      `,
    }),
  });

  const raw = await response.text();

  if (!response.ok) {
    throw new Error(
      `Resend returned ${response.status}: ${raw.slice(0, 500)}`
    );
  }
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
          error: "You must be signed in to invite an Operations user.",
        },
        { status: 401 }
      );
    }

    let body: InviteBody;

    try {
      body = (await request.json()) as InviteBody;
    } catch {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid invitation request.",
        },
        { status: 400 }
      );
    }

    const name = body.name?.trim() ?? "";
    const email = normaliseEmail(body.email ?? "");

    if (name.length < 2) {
      return NextResponse.json(
        {
          ok: false,
          error: "Enter the person's name.",
        },
        { status: 400 }
      );
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        {
          ok: false,
          error: "Enter a valid email address.",
        },
        { status: 400 }
      );
    }

    if (user.email && normaliseEmail(user.email) === email) {
      return NextResponse.json(
        {
          ok: false,
          error: "You cannot invite your own email address.",
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
      .select("business_id,role,active,businesses(name)")
      .eq("auth_user_id", user.id)
      .eq("active", true)
      .eq("role", "operations")
      .maybeSingle();

    if (membershipError) {
      console.error(
        "Operations invite membership lookup failed:",
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

    const { data: existingUsers, error: existingUsersError } =
      await admin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });

    if (existingUsersError) {
      console.error(
        "Operations invite auth lookup failed:",
        existingUsersError
      );

      return NextResponse.json(
        {
          ok: false,
          error: "KitchenOps could not check that email address.",
        },
        { status: 500 }
      );
    }

    const existingAuthUser = existingUsers.users.find(
      (candidate) =>
        candidate.email &&
        normaliseEmail(candidate.email) === email
    );

    if (existingAuthUser) {
      const { data: existingMembership } = await admin
        .from("business_memberships")
        .select("id,active")
        .eq("business_id", membership.business_id)
        .eq("auth_user_id", existingAuthUser.id)
        .maybeSingle();

      if (existingMembership?.active) {
        return NextResponse.json(
          {
            ok: false,
            error: "That person is already an active Operations user.",
          },
          { status: 409 }
        );
      }
    }

    const { data: existingInvite, error: existingInviteError } =
      await admin
        .from("operations_invitations")
        .select("id")
        .eq("business_id", membership.business_id)
        .eq("email", email)
        .eq("status", "pending")
        .maybeSingle();

    if (existingInviteError) {
      console.error(
        "Operations invite duplicate lookup failed:",
        existingInviteError
      );

      return NextResponse.json(
        {
          ok: false,
          error: "KitchenOps could not check existing invitations.",
        },
        { status: 500 }
      );
    }

    if (existingInvite) {
      return NextResponse.json(
        {
          ok: false,
          code: "INVITE_PENDING",
          error:
            "An Operations invitation is already pending for that email address.",
        },
        { status: 409 }
      );
    }

    const token = randomBytes(32).toString("hex");
    const tokenHash = hashToken(token);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data: invitation, error: insertError } = await admin
      .from("operations_invitations")
      .insert({
        business_id: membership.business_id,
        email,
        display_name: name,
        token_hash: tokenHash,
        status: "pending",
        invited_by: user.id,
        expires_at: expiresAt.toISOString(),
      })
      .select("id")
      .single();

    if (insertError || !invitation) {
      console.error(
        "Operations invitation insert failed:",
        insertError
      );

      return NextResponse.json(
        {
          ok: false,
          error: "The Operations invitation could not be created.",
        },
        { status: 500 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY?.trim();
    const fromEmail =
      process.env.KITCHENOPS_SIGNUP_FROM_EMAIL?.trim() ||
      "KitchenOps <hello@orders.kitchenops.co.uk>";

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL?.trim() ||
      "https://app.kitchenops.co.uk";

    const businessRelation = membership.businesses as
  | { name: string }
  | { name: string }[]
  | null;

const businessName = Array.isArray(businessRelation)
  ? businessRelation[0]?.name ?? "KitchenOps"
  : businessRelation?.name ?? "KitchenOps";

    const inviteUrl =
      `${appUrl}/operations/invite/accept?token=${encodeURIComponent(token)}`;

    if (!apiKey) {
      await admin
        .from("operations_invitations")
        .delete()
        .eq("id", invitation.id);

      return NextResponse.json(
        {
          ok: false,
          error: "Operations invitation email is not configured.",
        },
        { status: 500 }
      );
    }

    try {
      await sendInviteEmail({
        apiKey,
        fromEmail,
        email,
        name,
        businessName,
        inviteUrl,
      });
    } catch (emailError) {
      console.error(
        "Operations invitation email failed:",
        emailError
      );

      await admin
        .from("operations_invitations")
        .delete()
        .eq("id", invitation.id);

      return NextResponse.json(
        {
          ok: false,
          error:
            "The invitation email could not be sent. No invitation was saved.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: `Invitation sent to ${email}.`,
    });
  } catch (error) {
    console.error(
      "Unexpected Operations invitation error:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error: "The Operations invitation could not be sent.",
      },
      { status: 500 }
    );
  }
}