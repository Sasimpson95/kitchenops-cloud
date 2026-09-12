import { NextResponse } from "next/server";
import Stripe from "stripe";

import { createClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const PRICE_MAP = {
  "1-site": process.env.STRIPE_PRICE_1_SITE,
  "3-sites": process.env.STRIPE_PRICE_3_SITES,
  "6-sites": process.env.STRIPE_PRICE_6_SITES,
} as const;

type Plan = keyof typeof PRICE_MAP;

export async function POST(request: Request) {
  try {
    const { plan } = (await request.json()) as {
      plan?: Plan;
    };

    if (!plan || !PRICE_MAP[plan]) {
      return NextResponse.json(
        { error: "Invalid subscription plan." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "You must be signed in to subscribe." },
        { status: 401 }
      );
    }

    const { data: membership, error: membershipError } = await supabase
      .from("business_memberships")
      .select("business_id, role, active")
      .eq("auth_user_id", user.id)
      .eq("active", true)
      .maybeSingle();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: "No active KitchenOps business was found." },
        { status: 403 }
      );
    }

    const businessId = membership.business_id;

    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://app.kitchenops.co.uk";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",

      line_items: [
        {
          price: PRICE_MAP[plan]!,
          quantity: 1,
        },
      ],

      customer_email: user.email || undefined,

      metadata: {
        business_id: businessId,
        plan,
      },

      subscription_data: {
        metadata: {
          business_id: businessId,
          plan,
        },
      },

      success_url: `${origin}/subscription-required?checkout=success`,
      cancel_url: `${origin}/subscription-required?checkout=cancelled`,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    console.error("Stripe checkout error:", error);

    return NextResponse.json(
      { error: "Unable to create checkout session." },
      { status: 500 }
    );
  }
}