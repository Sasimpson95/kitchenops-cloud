import { NextRequest, NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function sendResendEmail(args: {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  html: string;
  idempotencyKey: string;
}) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": args.idempotencyKey,
    },
    body: JSON.stringify({
      from: args.from,
      to: [args.to],
      subject: args.subject,
      html: args.html,
    }),
  });

  const raw = await response.text();

  if (!response.ok) {
    throw new Error(
      `Resend returned ${response.status}: ${raw.slice(0, 500)}`
    );
  }
}

function getDateWindowForDay3() {
  const now = new Date();

  const start = new Date(now);
  start.setUTCDate(start.getUTCDate() - 3);
  start.setUTCHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

export async function POST(request: NextRequest) {
  try {
    const expectedSecret = process.env.KITCHENOPS_CRON_SECRET?.trim();
    const suppliedSecret = request.headers
      .get("authorization")
      ?.replace(/^Bearer\s+/i, "")
      .trim();

    if (!expectedSecret || suppliedSecret !== expectedSecret) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY?.trim();
    const from =
      process.env.KITCHENOPS_SIGNUP_FROM_EMAIL?.trim() ||
      process.env.KITCHENOPS_ORDER_FROM_EMAIL?.trim();

    if (!apiKey || !from) {
      return NextResponse.json(
        { error: "Trial follow-up email is not configured." },
        { status: 503 }
      );
    }

    const admin = createAdminClient();
    const { start, end } = getDateWindowForDay3();

    const { data: businesses, error: businessError } = await admin
      .from("businesses")
      .select(
        "id, name, trial_started_at, created_at, subscription_status"
      )
      .gte("trial_started_at", start)
      .lt("trial_started_at", end);

    if (businessError) throw businessError;

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const business of businesses ?? []) {
      try {
        const { data: existing, error: existingError } = await admin
          .from("trial_lifecycle_emails")
          .select("id")
          .eq("business_id", business.id)
          .eq("email_type", "day3_feedback")
          .maybeSingle();

        if (existingError) throw existingError;

        if (existing) {
          skipped += 1;
          continue;
        }

        const { data: memberships, error: membershipError } = await admin
  .from("business_memberships")
  .select("auth_user_id, role, active")
  .eq("business_id", business.id)
  .eq("role", "operations")
  .eq("active", true)
  .order("created_at", { ascending: true })
  .limit(1);

        if (membershipError) throw membershipError;

        const membership = memberships?.[0];

        if (!membership?.auth_user_id) {
          skipped += 1;
          continue;
        }

        const {
          data: { user },
          error: userError,
        } = await admin.auth.admin.getUserById(membership.auth_user_id);

        if (userError) throw userError;

        if (!user?.email) {
          skipped += 1;
          continue;
        }

        const safeBusiness = escapeHtml(
          business.name || "your KitchenOps business"
        );

        const html = `
          <div style="font-family:Arial,sans-serif;color:#17111f;line-height:1.6;max-width:640px;margin:auto">
            <div style="font-size:28px;font-weight:800;color:#6d28d9;margin-bottom:18px">
              KitchenOps
            </div>

            <h1>How are you getting on with KitchenOps?</h1>

            <p>
              You’ve had a few days to explore KitchenOps with
              <strong>${safeBusiness}</strong>, and we’d really value your feedback.
            </p>

            <p>
              If you’ve got a minute, just reply to this email and tell us:
            </p>

            <div style="background:#f5f3ff;border-radius:12px;padding:18px;margin:24px 0;font-size:18px;font-weight:700">
              What’s the one thing you expected KitchenOps to do that you couldn’t find?
            </div>

            <p>
              Even a one-line reply is useful.
            </p>

            <p>
              If you need any help getting set up, reply to this email and we’ll help. App Coming Soon to both IOS and Android!
            </p>

            <p style="margin-top:28px;color:#6b6470">
              KitchenOps by Simpson Software
            </p>
          </div>
        `;

        await sendResendEmail({
          apiKey,
          from,
          to: user.email,
          subject: "How are you getting on with KitchenOps?",
          html,
          idempotencyKey: `kitchenops-trial-day3-${business.id}`,
        });

        const { error: insertError } = await admin
          .from("trial_lifecycle_emails")
          .insert({
            business_id: business.id,
            recipient_email: user.email,
            email_type: "day3_feedback",
          });

        if (insertError) throw insertError;

        sent += 1;
      } catch (error) {
        failed += 1;
        console.error("KitchenOps Day 3 feedback email failed", {
          businessId: business.id,
          error,
        });
      }
    }

    return NextResponse.json({
      checked: businesses?.length ?? 0,
      sent,
      skipped,
      failed,
    });
  } catch (error) {
    console.error("KitchenOps trial follow-up route failed", error);

    return NextResponse.json(
      { error: "Could not process trial follow-up emails." },
      { status: 500 }
    );
  }
}