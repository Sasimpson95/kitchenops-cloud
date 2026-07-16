export const SHARED_DEVICE_STORAGE_KEY =
  "kitchenops-shared-device";

export const SWITCH_USER_STORAGE_KEY =
  "kitchenops-switch-user";

export type RememberedStaffDevice = {
  businessCode: string;
  businessName: string;
  siteId: string;
  siteName: string;
  staffId: string;
  staffName: string;
  staffRole: "manager" | "chef";
};

export function getRememberedStaffDevice():
  RememberedStaffDevice | null {
  if (typeof window === "undefined") {
    return null;
  }

  const saved =
    window.localStorage.getItem(
      SHARED_DEVICE_STORAGE_KEY
    );

  if (!saved) {
    return null;
  }

  try {
    return JSON.parse(
      saved
    ) as RememberedStaffDevice;
  } catch {
    return null;
  }
}

export function rememberStaffDevice(
  value: RememberedStaffDevice
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    SHARED_DEVICE_STORAGE_KEY,
    JSON.stringify(value)
  );
}

export function clearRememberedStaffDevice(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(
    SHARED_DEVICE_STORAGE_KEY
  );
}

export function requestStaffSwitch(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    SWITCH_USER_STORAGE_KEY,
    "true"
  );
}

export function consumeStaffSwitchRequest(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const requested =
    window.localStorage.getItem(
      SWITCH_USER_STORAGE_KEY
    ) === "true";

  window.localStorage.removeItem(
    SWITCH_USER_STORAGE_KEY
  );

  return requested;
}
