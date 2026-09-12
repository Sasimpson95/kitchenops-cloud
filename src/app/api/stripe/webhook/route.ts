import { NextResponse } from "next/server";
import Stripe from "stripe";

import { createAdminClient } from "@/lib/supabase/admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

function getSubscriptionStatus(
  status: Stripe.Subscription.Status
): "active" | "past_due" | "canceled" | null {
  switch (status) {
    case "active":
    case "trialing":
      return "active";

    case "past_due":
    case "unpaid":
      return "past_due";

    case "canceled":
    case "incomplete_expired":
      return "canceled";

    default:
      return null;
  }
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("Missing STRIPE_WEBHOOK_SECRET");

    return NextResponse.json(
      { error: "Webhook is not configured." },
      { status: 500 }
    );
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature." },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    const body = await request.text();

    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);

    return NextResponse.json(
      { error: "Invalid webhook signature." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        const businessId = session.metadata?.business_id;

        if (!businessId) {
          console.error(
            "Stripe checkout completed without business_id metadata."
          );
          break;
        }

        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id ?? null;

        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id ?? null;

        let priceId: string | null = null;

        if (subscriptionId) {
          const subscription =
            await stripe.subscriptions.retrieve(subscriptionId);

          priceId =
            subscription.items.data[0]?.price?.id ?? null;
        }

        const { error } = await admin
          .from("businesses")
          .update({
            subscription_status: "active",
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            stripe_price_id: priceId,
          })
          .eq("id", businessId);

        if (error) {
          throw error;
        }

        break;
      }

      case "customer.subscription.updated": {
        const subscription =
          event.data.object as Stripe.Subscription;

        const businessId = subscription.metadata?.business_id;

        if (!businessId) {
          console.error(
            "Stripe subscription updated without business_id metadata."
          );
          break;
        }

        const status = getSubscriptionStatus(subscription.status);

        if (!status) {
          break;
        }

        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        const priceId =
          subscription.items.data[0]?.price?.id ?? null;

        const { error } = await admin
          .from("businesses")
          .update({
            subscription_status: status,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscription.id,
            stripe_price_id: priceId,
          })
          .eq("id", businessId);

        if (error) {
          throw error;
        }

        break;
      }

      case "customer.subscription.deleted": {
        const subscription =
          event.data.object as Stripe.Subscription;

        const businessId = subscription.metadata?.business_id;

        if (!businessId) {
          console.error(
            "Stripe subscription deleted without business_id metadata."
          );
          break;
        }

        const { error } = await admin
          .from("businesses")
          .update({
            subscription_status: "canceled",
          })
          .eq("id", businessId);

        if (error) {
          throw error;
        }

        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;

        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id ?? null;

        if (!customerId) {
          break;
        }

        const { error } = await admin
          .from("businesses")
          .update({
            subscription_status: "past_due",
          })
          .eq("stripe_customer_id", customerId);

        if (error) {
          throw error;
        }

        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook processing error:", error);

    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 500 }
    );
  }
}