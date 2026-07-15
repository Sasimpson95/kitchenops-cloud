const STORAGE_KEY = "kitchenops-business-settings";
const SETTINGS_CHANGED_EVENT = "kitchenops-business-settings-changed";

export type StocktakeFrequency =
  | "daily"
  | "weekly"
  | "monthly"
  | "every-4-weeks"
  | "quarterly"
  | "manual";

export type WeekStartDay =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

export type BusinessSettings = {
  businessId: string;
  stocktakeFrequency: StocktakeFrequency;
  weekStartsOn: WeekStartDay;
  updatedAt: string;
};

const DEFAULT_SETTINGS: BusinessSettings = {
  businessId: "pudding-pantry",
  stocktakeFrequency: "weekly",
  weekStartsOn: "Monday",
  updatedAt: "2026-07-01T09:00:00.000Z",
};

function now(): string {
  return new Date().toISOString();
}

function emitSettingsChanged(): void {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent(SETTINGS_CHANGED_EVENT)
  );
}

function normaliseSettings(
  settings: Partial<BusinessSettings>
): BusinessSettings {
  const validFrequencies: StocktakeFrequency[] = [
    "daily",
    "weekly",
    "monthly",
    "every-4-weeks",
    "quarterly",
    "manual",
  ];

  const validWeekDays: WeekStartDay[] = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  return {
    businessId:
      settings.businessId || DEFAULT_SETTINGS.businessId,

    stocktakeFrequency:
      settings.stocktakeFrequency &&
      validFrequencies.includes(settings.stocktakeFrequency)
        ? settings.stocktakeFrequency
        : DEFAULT_SETTINGS.stocktakeFrequency,

    weekStartsOn:
      settings.weekStartsOn &&
      validWeekDays.includes(settings.weekStartsOn)
        ? settings.weekStartsOn
        : DEFAULT_SETTINGS.weekStartsOn,

    updatedAt:
      settings.updatedAt || now(),
  };
}

export function getBusinessSettings(): BusinessSettings {
  if (typeof window === "undefined") {
    return { ...DEFAULT_SETTINGS };
  }

  const saved = window.localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(DEFAULT_SETTINGS)
    );

    return { ...DEFAULT_SETTINGS };
  }

  try {
    const parsed = JSON.parse(saved) as Partial<BusinessSettings>;
    const settings = normaliseSettings(parsed);

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(settings)
    );

    return settings;
  } catch {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(DEFAULT_SETTINGS)
    );

    return { ...DEFAULT_SETTINGS };
  }
}

export function saveBusinessSettings(
  input: Pick<
    BusinessSettings,
    "stocktakeFrequency" | "weekStartsOn"
  >
): BusinessSettings {
  if (typeof window === "undefined") {
    return {
      ...DEFAULT_SETTINGS,
      ...input,
      updatedAt: now(),
    };
  }

  const current = getBusinessSettings();

  const updated = normaliseSettings({
    ...current,
    ...input,
    updatedAt: now(),
  });

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(updated)
  );

  emitSettingsChanged();

  return updated;
}

export function subscribeToBusinessSettingsChanges(
  callback: () => void
): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  function handleLocalChange(): void {
    callback();
  }

  function handleStorageChange(event: StorageEvent): void {
    if (event.key === STORAGE_KEY) {
      callback();
    }
  }

  window.addEventListener(
    SETTINGS_CHANGED_EVENT,
    handleLocalChange
  );

  window.addEventListener(
    "storage",
    handleStorageChange
  );

  return () => {
    window.removeEventListener(
      SETTINGS_CHANGED_EVENT,
      handleLocalChange
    );

    window.removeEventListener(
      "storage",
      handleStorageChange
    );
  };
}
