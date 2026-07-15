const STORAGE_KEY = "kitchenops-reserva-settings";
const SETTINGS_CHANGED_EVENT = "kitchenops-reserva-settings-changed";

export type ReservaSettings = {
  enabled: boolean;
  apiBaseUrl: string;
  apiKey: string;
  venueId: string;
  syncDaysAhead: number;
  lastSyncAt?: string;
  updatedAt: string;
};

const DEFAULT_SETTINGS: ReservaSettings = {
  enabled: false,
  apiBaseUrl: "",
  apiKey: "",
  venueId: "",
  syncDaysAhead: 14,
  updatedAt: new Date().toISOString(),
};

export function getReservaSettings(): ReservaSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) return DEFAULT_SETTINGS;

  try {
    const parsed = JSON.parse(saved) as Partial<ReservaSettings>;

    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      syncDaysAhead: Math.max(1, Number(parsed.syncDaysAhead) || 14),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveReservaSettings(
  input: Omit<ReservaSettings, "updatedAt">
): ReservaSettings {
  const settings: ReservaSettings = {
    ...input,
    syncDaysAhead: Math.max(1, Number(input.syncDaysAhead) || 14),
    updatedAt: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent(SETTINGS_CHANGED_EVENT));
  }

  return settings;
}

export function markReservaSynced(): ReservaSettings {
  const current = getReservaSettings();

  return saveReservaSettings({
    ...current,
    lastSyncAt: new Date().toISOString(),
  });
}
