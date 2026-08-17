export type KitchenOpsSubscriptionStatus =
  | "legacy"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "expired";

export type KitchenOpsAccessState = {
  allowed: boolean;
  status: KitchenOpsSubscriptionStatus;
  trialEndsAt?: string;
  trialDaysRemaining?: number;
};

type BusinessEntitlement = {
  subscription_status?: string | null;
  trial_ends_at?: string | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function normaliseStatus(value?: string | null): KitchenOpsSubscriptionStatus {
  switch (value) {
    case "trialing":
    case "active":
    case "past_due":
    case "canceled":
    case "expired":
      return value;
    default:
      return "legacy";
  }
}

export function getKitchenOpsAccessState(
  business: BusinessEntitlement,
  now = new Date()
): KitchenOpsAccessState {
  const status = normaliseStatus(business.subscription_status);

  // Existing businesses created before subscription enforcement remain usable
  // until they are deliberately migrated to a paid/trial entitlement.
  if (status === "legacy" || status === "active") {
    return { allowed: true, status };
  }

  if (status === "trialing") {
    const trialEndsAt = business.trial_ends_at ?? undefined;
    const trialEndMs = trialEndsAt ? Date.parse(trialEndsAt) : Number.NaN;

    if (Number.isFinite(trialEndMs) && trialEndMs > now.getTime()) {
      return {
        allowed: true,
        status,
        trialEndsAt,
        trialDaysRemaining: Math.max(1, Math.ceil((trialEndMs - now.getTime()) / DAY_MS)),
      };
    }

    return {
      allowed: false,
      status: "expired",
      trialEndsAt,
      trialDaysRemaining: 0,
    };
  }

  return { allowed: false, status };
}
