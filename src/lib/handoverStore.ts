const STORAGE_KEY = "kitchenops-site-handovers";
const ROLLOVER_KEY = "kitchenops-handover-rollover-date";
const HANDOVER_CHANGED_EVENT = "kitchenops-handover-changed";

export type HandoverDay = "today" | "tomorrow";

export type SiteHandover = {
  id: string;
  siteName: string;
  day: HandoverDay;
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

  return {
    id: value.id,
    siteName: value.siteName,
    day: value.day,
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

    return parsed
      .map((record) => normaliseRecord(record as Partial<SiteHandover>))
      .filter((record): record is SiteHandover => record !== null);
  } catch {
    return [];
  }
}

function writeRawHandovers(records: SiteHandover[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

/**
 * Handover is intentionally simple: managers write tomorrow's notes today.
 * On the first read after the local calendar date changes, yesterday's
 * "tomorrow" notes become today's handover and a fresh tomorrow is created.
 */
export function rollOverHandoversIfNeeded(): void {
  if (typeof window === "undefined") return;

  const todayKey = localDateKey();
  const previousKey = window.localStorage.getItem(ROLLOVER_KEY);

  // First run: keep any existing records as-is and establish today's marker.
  if (!previousKey) {
    window.localStorage.setItem(ROLLOVER_KEY, todayKey);
    return;
  }

  if (previousKey === todayKey) return;

  const current = readRawHandovers();
  const sites = Array.from(new Set(current.map((record) => record.siteName)));
  const rolled: SiteHandover[] = [];

  for (const siteName of sites) {
    const tomorrow = current.find(
      (record) => record.siteName === siteName && record.day === "tomorrow"
    );

    rolled.push({
      id: tomorrow?.id ?? createId(),
      siteName,
      day: "today",
      notes: tomorrow?.notes ?? [],
      updatedBy: tomorrow?.updatedBy ?? "Unknown",
      updatedAt: tomorrow?.updatedAt ?? new Date().toISOString(),
      visibleToChefs: tomorrow?.visibleToChefs === true,
    });

    rolled.push({
      id: createId(),
      siteName,
      day: "tomorrow",
      notes: [],
      updatedBy: "Unknown",
      updatedAt: new Date().toISOString(),
      visibleToChefs: false,
    });
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
  const existing = getHandovers().find(
    (record) => record.siteName === siteName && record.day === day
  );

  if (existing) return existing;

  return {
    id: createId(),
    siteName,
    day,
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

  if (typeof window === "undefined") {
    return {
      id: createId(),
      ...input,
      notes: cleanedNotes,
      visibleToChefs: input.visibleToChefs === true,
      updatedAt: new Date().toISOString(),
    };
  }

  rollOverHandoversIfNeeded();
  const current = readRawHandovers();
  const existing = current.find(
    (record) => record.siteName === input.siteName && record.day === input.day
  );

  const updated: SiteHandover = {
    id: existing?.id ?? createId(),
    siteName: input.siteName,
    day: input.day,
    notes: cleanedNotes,
    updatedBy: input.updatedBy.trim() || "Unknown",
    updatedAt: new Date().toISOString(),
    visibleToChefs: input.visibleToChefs === true,
  };

  writeRawHandovers([
    ...current.filter(
      (record) =>
        !(record.siteName === input.siteName && record.day === input.day)
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
