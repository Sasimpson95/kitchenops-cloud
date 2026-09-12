"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

type Plan = "1-site" | "3-sites" | "6-sites";

const plans: Array<{
  id: Plan;
  name: string;
  price: string;
  sites: string;
  description: string;
}> = [
  {
    id: "1-site",
    name: "1 Site",
    price: "£149",
    sites: "1 hospitality site",
    description:
      "Full KitchenOps access for a single restaurant, café or kitchen.",
  },
  {
    id: "3-sites",
    name: "Up to 3 Sites",
    price: "£249",
    sites: "Up to 3 hospitality sites",
    description:
      "For growing operators managing multiple kitchens from one workspace.",
  },
  {
    id: "6-sites",
    name: "Up to 6 Sites",
    price: "£399",
    sites: "Up to 6 hospitality sites",
    description:
      "For larger hospitality groups that need multi-site operational control.",
  },
];

export default function SubscriptionRequiredPage() {
  const searchParams = useSearchParams();

  const [loadingPlan, setLoadingPlan] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkoutState = searchParams.get("checkout");

  async function startCheckout(plan: Plan) {
    try {
      setError(null);
      setLoadingPlan(plan);

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to start checkout.");
      }

      if (!data?.url) {
        throw new Error("Stripe checkout URL was not returned.");
      }

      window.location.href = data.url;
    } catch (checkoutError) {
      console.error("Checkout error:", checkoutError);

      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "Unable to start checkout."
      );

      setLoadingPlan(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-10">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-violet-700">
              KitchenOps subscription
            </p>

            <h1 className="mt-3 text-3xl font-bold text-slate-950 sm:text-4xl">
              Your trial has ended.
            </h1>

            <p className="mt-4 leading-7 text-slate-600">
              Your KitchenOps business and everything you entered are still
              safe. Choose the plan that matches the number of sites you
              operate to continue using KitchenOps.
            </p>
          </div>

          {checkoutState === "cancelled" && (
            <div className="mx-auto mt-7 max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Checkout was cancelled. No payment has been taken.
            </div>
          )}

          {checkoutState === "success" && (
            <div className="mx-auto mt-7 max-w-3xl rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              Payment received. We&apos;re confirming your KitchenOps
              subscription.
            </div>
          )}

          {error && (
            <div className="mx-auto mt-7 max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {plans.map((plan) => {
              const loading = loadingPlan === plan.id;

              return (
                <article
                  key={plan.id}
                  className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div>
                    <p className="text-sm font-semibold text-violet-700">
                      KitchenOps
                    </p>

                    <h2 className="mt-2 text-2xl font-bold text-slate-950">
                      {plan.name}
                    </h2>

                    <div className="mt-5 flex items-end gap-1">
                      <span className="text-4xl font-bold tracking-tight text-slate-950">
                        {plan.price}
                      </span>

                      <span className="pb-1 text-sm text-slate-500">
                        / month
                      </span>
                    </div>

                    <p className="mt-4 font-medium text-slate-800">
                      {plan.sites}
                    </p>

                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {plan.description}
                    </p>
                  </div>

                  <div className="mt-6 flex-1">
                    <ul className="space-y-3 text-sm text-slate-700">
                      <li>✓ Prep Planner</li>
                      <li>✓ Inventory</li>
                      <li>✓ Purchasing & Receiving</li>
                      <li>✓ Waste Tracking</li>
                      <li>✓ Recipes</li>
                      <li>✓ Handovers</li>
                      <li>✓ Unlimited users</li>
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => startCheckout(plan.id)}
                    disabled={loadingPlan !== null}
                    className="mt-7 rounded-xl bg-violet-700 px-5 py-3 font-semibold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Opening checkout..." : "Choose plan"}
                  </button>
                </article>
              );
            })}
          </div>

          <div className="mt-8 rounded-2xl bg-violet-50 p-5 text-center text-sm leading-6 text-violet-950">
            Need more than 6 sites?{" "}
            <a
              href="mailto:hello@kitchenops.co.uk?subject=KitchenOps%20Enterprise"
              className="font-semibold underline underline-offset-2"
            >
              Contact KitchenOps about Enterprise.
            </a>
          </div>

          <p className="mt-6 text-center text-xs leading-5 text-slate-500">
            You&apos;ll be securely redirected to Stripe to complete your
            subscription.
          </p>
        </section>
      </div>
    </main>
  );
}