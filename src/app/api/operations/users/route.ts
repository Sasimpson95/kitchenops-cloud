import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type OperationsUser = {
  id: string;
  authUserId: string;
  name: string;
  email: string;
  active: boolean;
  createdAt: string;
  currentUser: boolean;
};

type PendingInvite = {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
  expiresAt: string;
};

export async function GET() {
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

    const admin = createAdminClient();

    const {
      data: currentMembership,
      error: currentMembershipError,
    } = await admin
      .from("business_memberships")
      .select("business_id,role,active")
      .eq("auth_user_id", user.id)
      .eq("active", true)
      .eq("role", "operations")
      .maybeSingle();

    if (currentMembershipError) {
      console.error(
        "Operations users current membership lookup failed:",
        currentMembershipError
      );

      return NextResponse.json(
        {
          ok: false,
          error: "Your business access could not be verified.",
        },
        { status: 500 }
      );
    }

    if (!currentMembership) {
      return NextResponse.json(
        {
          ok: false,
          error: "Operations permission required.",
        },
        { status: 403 }
      );
    }

    const [
      membershipsResult,
      invitationsResult,
    ] = await Promise.all([
      admin
        .from("business_memberships")
        .select(
          "id,auth_user_id,display_name,active,created_at"
        )
        .eq(
          "business_id",
          currentMembership.business_id
        )
        .eq("role", "operations")
        .order("created_at"),

      admin
        .from("operations_invitations")
        .select(
          "id,email,display_name,status,created_at,expires_at"
        )
        .eq(
          "business_id",
          currentMembership.business_id
        )
        .eq("status", "pending")
        .order("created_at", {
          ascending: false,
        }),
    ]);

    if (membershipsResult.error) {
      console.error(
        "Operations users membership list failed:",
        membershipsResult.error
      );

      return NextResponse.json(
        {
          ok: false,
          error: "Operations users could not be loaded.",
        },
        { status: 500 }
      );
    }

    if (invitationsResult.error) {
      console.error(
        "Operations users invitation list failed:",
        invitationsResult.error
      );

      return NextResponse.json(
        {
          ok: false,
          error: "Pending invitations could not be loaded.",
        },
        { status: 500 }
      );
    }

    const memberships =
      membershipsResult.data ?? [];

    const operationsUsers: OperationsUser[] =
      await Promise.all(
        memberships.map(
          async (
            membership
          ): Promise<OperationsUser> => {
            const {
              data: authUserData,
              error: authLookupError,
            } =
              await admin.auth.admin.getUserById(
                membership.auth_user_id
              );

            if (authLookupError) {
              console.error(
                "Operations user Auth lookup failed:",
                authLookupError
              );
            }

            return {
              id: membership.id,
              authUserId:
                membership.auth_user_id,
              name:
                membership.display_name,
              email:
                authUserData.user?.email ??
                "Email unavailable",
              active:
                membership.active,
              createdAt:
                membership.created_at,
              currentUser:
                membership.auth_user_id ===
                user.id,
            };
          }
        )
      );

    const pendingInvites: PendingInvite[] =
      (invitationsResult.data ?? []).map(
        (invitation) => ({
          id: invitation.id,
          name: invitation.display_name,
          email: invitation.email,
          status: invitation.status,
          createdAt: invitation.created_at,
          expiresAt: invitation.expires_at,
        })
      );

    return NextResponse.json({
      ok: true,
      operationsUsers,
      pendingInvites,
    });
  } catch (error) {
    console.error(
      "Unexpected Operations users error:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error: "Operations users could not be loaded.",
      },
      { status: 500 }
    );
  }
}