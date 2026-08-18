import { NextResponse } from "next/server";

import { getCloudRequestContext } from "@/lib/cloud/serverContext";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
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
    throw new Error(`Resend returned ${response.status}: ${raw.slice(0, 500)}`);
  }
}

export async function POST() {
  try {
    const context = await getCloudRequestContext();
    if (!context || context.role !== "operations") {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const apiKey = process.env.RESEND_API_KEY?.trim();
    const from =
      process.env.KITCHENOPS_SIGNUP_FROM_EMAIL?.trim() ||
      process.env.KITCHENOPS_ORDER_FROM_EMAIL?.trim();
    const notifyEmail =
      process.env.KITCHENOPS_SIGNUP_NOTIFY_EMAIL?.trim() ||
      "hello@kitchenops.co.uk";

    if (!apiKey || !from) {
      return NextResponse.json(
        { error: "Signup email is not configured on the server." },
        { status: 503 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Signup email address is unavailable." }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: business, error } = await admin
      .from("businesses")
      .select("id, name, subscription_status, trial_started_at, trial_ends_at, created_at")
      .eq("id", context.businessId)
      .maybeSingle();

    if (error) throw error;
    if (!business) {
      return NextResponse.json({ error: "Business not found." }, { status: 404 });
    }

    const businessName = business.name || "New KitchenOps business";
    const trialStarted = formatDate(business.trial_started_at || business.created_at);
    const trialEnds = formatDate(business.trial_ends_at);
    const safeBusiness = escapeHtml(businessName);
    const safeEmail = escapeHtml(user.email);
    const safeBusinessId = escapeHtml(business.id);

    const internalHtml = `
      <div style="font-family:Arial,sans-serif;color:#17111f;line-height:1.6;max-width:640px;margin:auto">
        <h1 style="color:#6d28d9">New KitchenOps trial signup</h1>
        <p>A new business has successfully started a KitchenOps trial.</p>
        <table style="border-collapse:collapse;width:100%">
          <tr><td style="padding:8px 0;font-weight:700">Business</td><td>${safeBusiness}</td></tr>
          <tr><td style="padding:8px 0;font-weight:700">Email</td><td>${safeEmail}</td></tr>
          <tr><td style="padding:8px 0;font-weight:700">Trial started</td><td>${escapeHtml(trialStarted)}</td></tr>
          <tr><td style="padding:8px 0;font-weight:700">Trial ends</td><td>${escapeHtml(trialEnds)}</td></tr>
          <tr><td style="padding:8px 0;font-weight:700">Status</td><td>${escapeHtml(business.subscription_status || "trialing")}</td></tr>
          <tr><td style="padding:8px 0;font-weight:700">Business ID</td><td style="font-family:monospace">${safeBusinessId}</td></tr>
        </table>
      </div>`;

    const welcomeHtml = `
      <div style="font-family:Arial,sans-serif;color:#17111f;line-height:1.6;max-width:640px;margin:auto">
        <div style="font-size:28px;font-weight:800;color:#6d28d9;margin-bottom:18px">KitchenOps</div>
        <h1>Welcome to KitchenOps</h1>
        <p>Your 30-day free trial for <strong>${safeBusiness}</strong> is now active.</p>
        <p>You have access to every KitchenOps feature with unlimited users during your trial.</p>
        <div style="background:#f5f3ff;border-radius:12px;padding:18px;margin:24px 0">
          <strong>Trial ends:</strong> ${escapeHtml(trialEnds)}
        </div>
        <p>Start by adding your sites and team, then build out your products, recipes, prep and purchasing workflows.</p>
        <p>If you need help, email <a href="mailto:hello@kitchenops.co.uk">hello@kitchenops.co.uk</a>.</p>
        <p style="color:#6b6470">KitchenOps by Simpson Software</p>
      </div>`;

    const results = await Promise.allSettled([
      sendResendEmail({
        apiKey,
        from,
        to: notifyEmail,
        subject: `New KitchenOps trial signup — ${businessName}`,
        html: internalHtml,
        idempotencyKey: `kitchenops-trial-internal-${business.id}`,
      }),
      sendResendEmail({
        apiKey,
        from,
        to: user.email,
        subject: "Welcome to KitchenOps — your 30-day trial has started",
        html: welcomeHtml,
        idempotencyKey: `kitchenops-trial-welcome-${business.id}`,
      }),
    ]);

    const internalSent = results[0].status === "fulfilled";
    const welcomeSent = results[1].status === "fulfilled";

    if (!internalSent || !welcomeSent) {
      console.error("KitchenOps trial signup email failure", {
        businessId: business.id,
        internal: results[0].status === "rejected" ? String(results[0].reason) : "sent",
        welcome: results[1].status === "rejected" ? String(results[1].reason) : "sent",
      });
    }

    return NextResponse.json({ internalSent, welcomeSent });
  } catch (error) {
    console.error("KitchenOps trial signup email route failed", error);
    return NextResponse.json({ error: "Could not send signup emails." }, { status: 500 });
  }
}
