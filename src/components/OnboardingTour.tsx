"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Boxes,
  Building2,
  ChefHat,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  PackageSearch,
  ShoppingCart,
  Sparkles,
  UsersRound,
  X,
} from "lucide-react";
import Button from "@/components/ui/Button";
import type { User } from "@/config/roles";
import {
  completeOnboardingTour,
  hasCompletedOnboardingTour,
  ONBOARDING_TOUR_EVENT,
} from "@/lib/onboardingTour";

type OnboardingTourProps = {
  businessId?: string;
  businessName?: string;
  currentUser: User;
};

type TourStep = {
  eyebrow: string;
  title: string;
  description: string;
  icon: typeof Sparkles;
  bullets: string[];
};

const steps: TourStep[] = [
  {
    eyebrow: "Welcome to KitchenOps",
    title: "Your kitchen operations, in one place.",
    description:
      "KitchenOps connects the day-to-day work behind a well-run kitchen so your team has one clear way of working.",
    icon: Sparkles,
    bullets: [
      "Prep, recipes and handovers for the kitchen team",
      "Products, purchasing, inventory and stocktakes for managers",
      "Waste, reporting and multi-site visibility for operations",
    ],
  },
  {
    eyebrow: "Step 1 · Set up your business",
    title: "Start with your sites and team.",
    description:
      "Your sites define where KitchenOps activity belongs. Then add the Managers and Chefs who will use each location.",
    icon: Building2,
    bullets: [
      "Create each trading location in Settings → Sites",
      "Add Managers and Chefs in Settings → Users",
      "Assign each team member to the correct site",
    ],
  },
  {
    eyebrow: "Step 2 · Build your catalogue",
    title: "Add the products you actually buy.",
    description:
      "Products are the foundation for stock, ordering, recipes, waste and costing. Add suppliers and storage details as you go.",
    icon: PackageSearch,
    bullets: [
      "Create purchased products and their units",
      "Connect products to the correct supplier",
      "Set storage areas and useful stock information",
    ],
  },
  {
    eyebrow: "Step 3 · Recipes & prep",
    title: "Turn your catalogue into kitchen workflows.",
    description:
      "Build preparations and finished menu items from products, then use Prep to plan what the kitchen needs to produce.",
    icon: ChefHat,
    bullets: [
      "Create preparations/components with sensible yields",
      "Build finished dishes for costing and recipe reference",
      "Plan tomorrow’s prep and record today’s production",
    ],
  },
  {
    eyebrow: "Step 4 · Purchasing & stock",
    title: "Keep orders and inventory connected.",
    description:
      "Create supplier orders, email them directly from KitchenOps, receive deliveries and keep your stock position current.",
    icon: ShoppingCart,
    bullets: [
      "Create and send supplier purchase orders",
      "Receive deliveries against the original order",
      "Use stocktakes to correct counted stock when needed",
    ],
  },
  {
    eyebrow: "Step 5 · Run the daily operation",
    title: "Build the habits that keep the kitchen controlled.",
    description:
      "Once setup is complete, KitchenOps becomes the daily operating rhythm for prep, waste, handovers and management review.",
    icon: ClipboardCheck,
    bullets: [
      "Chefs use Prep, Recipes, Waste and Handover during the day",
      "Managers review stock, purchasing and completion",
      "Operations can compare sites and use Reports for oversight",
    ],
  },
];

const overview = [
  { label: "Sites & users", icon: UsersRound },
  { label: "Products", icon: PackageSearch },
  { label: "Recipes & prep", icon: ChefHat },
  { label: "Purchasing", icon: ShoppingCart },
  { label: "Inventory", icon: Boxes },
];

export default function OnboardingTour({
  businessId,
  businessName,
  currentUser,
}: OnboardingTourProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const eligible = currentUser.role === "operations" && Boolean(businessId);
  const currentStep = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;

  const displayBusinessName = useMemo(
    () => businessName?.trim() || "your business",
    [businessName]
  );

  useEffect(() => {
    if (!eligible || !businessId) return;

    if (!hasCompletedOnboardingTour(businessId)) {
      setStepIndex(0);
      setOpen(true);
    }
  }, [businessId, eligible]);

  useEffect(() => {
    if (!eligible) return;

    function handleReplay() {
      setStepIndex(0);
      setOpen(true);
    }

    window.addEventListener(ONBOARDING_TOUR_EVENT, handleReplay);
    return () => window.removeEventListener(ONBOARDING_TOUR_EVENT, handleReplay);
  }, [eligible]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeTour();
      if (event.key === "ArrowRight" && stepIndex < steps.length - 1) {
        setStepIndex((value) => value + 1);
      }
      if (event.key === "ArrowLeft" && stepIndex > 0) {
        setStepIndex((value) => value - 1);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, stepIndex]);

  function markComplete() {
    if (businessId) completeOnboardingTour(businessId);
  }

  function closeTour() {
    markComplete();
    setOpen(false);
  }

  function finishAndSetUp() {
    markComplete();
    setOpen(false);
    router.push("/settings/sites");
  }

  if (!open || !eligible) return null;

  const Icon = currentStep.icon;

  return (
    <div className="fixed inset-0 z-[160] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="kitchenops-introduction-title"
        className="max-h-[100dvh] w-full overflow-y-auto rounded-t-[2rem] bg-white shadow-2xl sm:max-w-4xl sm:rounded-[2rem]"
      >
        <div className="grid min-h-[570px] md:grid-cols-[0.78fr_1.22fr]">
          <aside className="bg-violet-950 p-6 text-white sm:p-8 md:rounded-l-[2rem]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white font-black text-violet-900">
                K
              </div>
              <div>
                <p className="font-bold">KitchenOps</p>
                <p className="text-xs text-violet-200">Getting started</p>
              </div>
            </div>

            <div className="mt-9">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-300">
                {displayBusinessName}
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight">
                A quick tour before you start.
              </h2>
              <p className="mt-3 text-sm leading-6 text-violet-200">
                We’ll show you the best order to set KitchenOps up. You can replay this introduction any time from the Help Centre.
              </p>
            </div>

            <div className="mt-8 space-y-2">
              {steps.map((step, index) => (
                <button
                  type="button"
                  key={step.eyebrow}
                  onClick={() => setStepIndex(index)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                    index === stepIndex
                      ? "bg-white text-violet-950"
                      : "text-violet-100 hover:bg-white/10"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      index < stepIndex
                        ? "bg-emerald-400 text-emerald-950"
                        : index === stepIndex
                          ? "bg-violet-100 text-violet-900"
                          : "bg-white/10 text-white"
                    }`}
                  >
                    {index < stepIndex ? <Check className="h-4 w-4" /> : index + 1}
                  </span>
                  <span className="line-clamp-1">{index === 0 ? "Introduction" : step.title}</span>
                </button>
              ))}
            </div>
          </aside>

          <div className="flex min-h-0 flex-col p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-800">
                <Icon className="h-6 w-6" />
              </span>
              <button
                type="button"
                onClick={closeTour}
                aria-label="Close introduction"
                className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 flex-1">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-violet-700">
                {currentStep.eyebrow}
              </p>
              <h1
                id="kitchenops-introduction-title"
                className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl"
              >
                {currentStep.title}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                {currentStep.description}
              </p>

              <div className="mt-6 space-y-3">
                {currentStep.bullets.map((bullet) => (
                  <div
                    key={bullet}
                    className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-800">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    <p className="text-sm leading-6 text-slate-700">{bullet}</p>
                  </div>
                ))}
              </div>

              {stepIndex === 0 && (
                <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {overview.map(({ label, icon: OverviewIcon }) => (
                    <div
                      key={label}
                      className="rounded-xl border border-violet-100 bg-violet-50 p-3 text-center"
                    >
                      <OverviewIcon className="mx-auto h-5 w-5 text-violet-800" />
                      <p className="mt-2 text-xs font-semibold text-violet-950">{label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-7 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>{stepIndex + 1} of {steps.length}</span>
                <div className="flex gap-1">
                  {steps.map((_, index) => (
                    <span
                      key={index}
                      className={`h-1.5 rounded-full transition-all ${
                        index === stepIndex ? "w-6 bg-violet-700" : "w-1.5 bg-slate-300"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                {stepIndex > 0 && (
                  <Button variant="secondary" onClick={() => setStepIndex((value) => value - 1)}>
                    <ChevronLeft className="mr-1 h-4 w-4" /> Back
                  </Button>
                )}

                {isLastStep ? (
                  <Button onClick={finishAndSetUp}>
                    Set up my business <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={() => setStepIndex((value) => value + 1)}>
                    Next <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
