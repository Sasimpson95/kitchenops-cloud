import { syncOperationalCollection } from "@/lib/cloud/operationalSync";

const STORAGE_KEY = "kitchenops-site-handovers";
const ROLLOVER_KEY = "kitchenops-handover-rollover-date";
const HANDOVER_CHANGED_EVENT = "kitchenops-handover-changed";

export type HandoverDay = "today" | "tomorrow";

export type SiteHandover = {
  id: string;
  siteName: string;
  day: HandoverDay;
  effectiveDate: string;
  notes: string[];
  updatedBy: string;
  updatedAt: string;
  visibleToChefs: boolean;
};

function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function localDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const value = new Date(year, month - 1, day);
  value.setDate(value.getDate() + days);
  return localDateKey(value);
}

function dateForDay(day: HandoverDay, baseDate = localDateKey()): string {
  return day === "today" ? baseDate : addDays(baseDate, 1);
}

function emitChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(HANDOVER_CHANGED_EVENT));
}

function normaliseRecord(value: Partial<SiteHandover>): SiteHandover | null {
  if (
    !value.id ||
    !value.siteName ||
    (value.day !== "today" && value.day !== "tomorrow")
  ) {
    return null;
  }

  const marker =
    typeof window !== "undefined"
      ? window.localStorage.getItem(ROLLOVER_KEY) || localDateKey()
      : localDateKey();

  return {
    id: value.id,
    siteName: value.siteName,
    day: value.day,
    effectiveDate: value.effectiveDate || dateForDay(value.day, marker),
    notes: Array.isArray(value.notes)
      ? value.notes.map(String).map((note) => note.trim()).filter(Boolean)
      : [],
    updatedBy: value.updatedBy || "Unknown",
    updatedAt: value.updatedAt || new Date().toISOString(),
    visibleToChefs: value.visibleToChefs === true,
  };
}

function readRawHandovers(): SiteHandover[] {
  if (typeof window === "undefined") return [];

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) return [];

  try {
    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];

    const normalised = parsed
      .map((record) => normaliseRecord(record as Partial<SiteHandover>))
      .filter((record): record is SiteHandover => record !== null);

    // Persist the date-aware shape locally before first cloud migration. This
    // is intentionally a direct write: syncOperationalCollection will migrate
    // the normalised records once the authenticated cloud layer starts.
    if (JSON.stringify(parsed) !== JSON.stringify(normalised)) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalised));
    }

    return normalised;
  } catch {
    return [];
  }
}

function writeRawHandovers(records: SiteHandover[]): void {
  if (typeof window === "undefined") return;

  const previous = readRawHandovers();
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  syncOperationalCollection("handovers", previous, records);
}

/**
 * The effective date travels with each handover record. That makes rollover
 * idempotent across multiple devices: if another device already rolled the
 * records for today, this device detects the dates and does not roll them again.
 */
export function rollOverHandoversIfNeeded(): void {
  if (typeof window === "undefined") return;

  const todayKey = localDateKey();
  const tomorrowKey = addDays(todayKey, 1);
  const previousKey = window.localStorage.getItem(ROLLOVER_KEY);

  if (!previousKey) {
    window.localStorage.setItem(ROLLOVER_KEY, todayKey);
    return;
  }

  if (previousKey === todayKey) return;

  const current = readRawHandovers();
  const sites = Array.from(new Set(current.map((record) => record.siteName)));
  const rolled: SiteHandover[] = [];

  for (const siteName of sites) {
    const currentToday = current.find(
      (record) =>
        record.siteName === siteName &&
        record.day === "today" &&
        record.effectiveDate === todayKey
    );

    const plannedForToday = current.find(
      (record) =>
        record.siteName === siteName &&
        record.day === "tomorrow" &&
        record.effectiveDate === todayKey
    );

    const futureTomorrow = current.find(
      (record) =>
        record.siteName === siteName &&
        record.day === "tomorrow" &&
        record.effectiveDate === tomorrowKey
    );

    const sourceToday = currentToday ?? plannedForToday;

    rolled.push({
      id: sourceToday?.id ?? createId(),
      siteName,
      day: "today",
      effectiveDate: todayKey,
      notes: sourceToday?.notes ?? [],
      updatedBy: sourceToday?.updatedBy ?? "Unknown",
      updatedAt: sourceToday?.updatedAt ?? new Date().toISOString(),
      visibleToChefs: sourceToday?.visibleToChefs === true,
    });

    rolled.push(
      futureTomorrow ?? {
        id: createId(),
        siteName,
        day: "tomorrow",
        effectiveDate: tomorrowKey,
        notes: [],
        updatedBy: "Unknown",
        updatedAt: new Date().toISOString(),
        visibleToChefs: false,
      }
    );
  }

  writeRawHandovers(rolled);
  window.localStorage.setItem(ROLLOVER_KEY, todayKey);
  emitChanged();
}

export function getHandovers(): SiteHandover[] {
  if (typeof window === "undefined") return [];
  rollOverHandoversIfNeeded();
  return readRawHandovers();
}

export function getSiteHandover(siteName: string, day: HandoverDay): SiteHandover {
  const expectedDate = dateForDay(day);
  const existing = getHandovers().find(
    (record) =>
      record.siteName === siteName &&
      record.day === day &&
      record.effectiveDate === expectedDate
  );

  if (existing) return existing;

  return {
    id: createId(),
    siteName,
    day,
    effectiveDate: expectedDate,
    notes: [],
    updatedBy: "Unknown",
    updatedAt: new Date().toISOString(),
    visibleToChefs: false,
  };
}

export function saveSiteHandover(input: {
  siteName: string;
  day: HandoverDay;
  notes: string[];
  updatedBy: string;
  visibleToChefs?: boolean;
}): SiteHandover {
  const cleanedNotes = input.notes.map((note) => note.trim()).filter(Boolean);
  const effectiveDate = dateForDay(input.day);

  if (typeof window === "undefined") {
    return {
      id: createId(),
      ...input,
      effectiveDate,
      notes: cleanedNotes,
      visibleToChefs: input.visibleToChefs === true,
      updatedAt: new Date().toISOString(),
    };
  }

  rollOverHandoversIfNeeded();
  const current = readRawHandovers();
  const existing = current.find(
    (record) =>
      record.siteName === input.siteName &&
      record.day === input.day &&
      record.effectiveDate === effectiveDate
  );

  const updated: SiteHandover = {
    id: existing?.id ?? createId(),
    siteName: input.siteName,
    day: input.day,
    effectiveDate,
    notes: cleanedNotes,
    updatedBy: input.updatedBy.trim() || "Unknown",
    updatedAt: new Date().toISOString(),
    visibleToChefs: input.visibleToChefs === true,
  };

  writeRawHandovers([
    ...current.filter(
      (record) =>
        !(
          record.siteName === input.siteName &&
          record.day === input.day &&
          record.effectiveDate === effectiveDate
        )
    ),
    updated,
  ]);

  emitChanged();
  return updated;
}

export function subscribeToHandoverChanges(callback: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;

  const handleLocal = (): void => callback();
  const handleStorage = (event: StorageEvent): void => {
    if (event.key === STORAGE_KEY || event.key === ROLLOVER_KEY) callback();
  };

  window.addEventListener(HANDOVER_CHANGED_EVENT, handleLocal);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(HANDOVER_CHANGED_EVENT, handleLocal);
    window.removeEventListener("storage", handleStorage);
  };
}
