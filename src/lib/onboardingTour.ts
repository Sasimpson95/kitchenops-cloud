export const ONBOARDING_TOUR_EVENT = "kitchenops:replay-introduction";

const TOUR_VERSION = "v1";

export function getOnboardingTourStorageKey(businessId: string): string {
  return `kitchenops-introduction-${TOUR_VERSION}-${businessId}`;
}

export function hasCompletedOnboardingTour(businessId: string): boolean {
  if (typeof window === "undefined" || !businessId) return true;

  try {
    return window.localStorage.getItem(getOnboardingTourStorageKey(businessId)) === "yes";
  } catch {
    return true;
  }
}

export function completeOnboardingTour(businessId: string): void {
  if (typeof window === "undefined" || !businessId) return;

  try {
    window.localStorage.setItem(getOnboardingTourStorageKey(businessId), "yes");
  } catch {
    // The introduction can still close when local storage is unavailable.
  }
}

export function replayOnboardingTour(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(ONBOARDING_TOUR_EVENT));
}
