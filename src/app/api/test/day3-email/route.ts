import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  const to = request.nextUrl.searchParams.get("to");

  if (key !== "kitchenops-day3-reply-test-2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!to) {
    return NextResponse.json(
      { error: "Missing ?to=email@example.com" },
      { status: 400 }
    );
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.KITCHENOPS_SIGNUP_FROM_EMAIL?.trim() ||
    process.env.KITCHENOPS_ORDER_FROM_EMAIL?.trim();

  if (!apiKey || !from) {
    return NextResponse.json(
      { error: "Resend email configuration missing." },
      { status: 503 }
    );
  }

  const html = `
    <div style="font-family:Arial,sans-serif;color:#17111f;line-height:1.6;max-width:640px;margin:auto">
      <div style="font-size:28px;font-weight:800;color:#6d28d9;margin-bottom:18px">
        KitchenOps
      </div>

      <h1>How are you getting on with KitchenOps?</h1>

      <p>
        You’ve had a few days to explore KitchenOps, and we’d really value your feedback.
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
        If you need any help getting set up, reply to this email and we’ll help.
      </p>

      <p style="margin-top:28px;color:#6b6470">
        KitchenOps by Simpson Software
      </p>
    </div>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: ["hello@kitchenops.co.uk"],
      subject: "How are you getting on with KitchenOps? — Reply Test",
      html,
    }),
  });

  const result = await response.text();

  if (!response.ok) {
    return NextResponse.json(
      {
        error: "Resend failed",
        details: result,
      },
      { status: response.status }
    );
  }

  return NextResponse.json({
    success: true,
    sentTo: to,
    replyTo: "hello@kitchenops.co.uk",
  });
}