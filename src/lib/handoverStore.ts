import { syncOperationalCollection } from "@/lib/cloud/operationalSync";
import { getCurrentUser } from "@/lib/currentUser";

const STORAGE_KEY = "kitchenops-site-handovers";
const ROLLOVER_KEY = "kitchenops-handover-rollover-date";
const HANDOVER_CHANGED_EVENT = "kitchenops-handover-changed";

export type HandoverDay = "today" | "tomorrow";
export type HandoverDepartment = "boh" | "foh";

export type SiteHandover = {
  id: string;
  siteName: string;
  day: HandoverDay;
  department: HandoverDepartment;
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
    department: value.department === "foh" ? "foh" : "boh",
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

    // Persist the date-aware and department-aware shape locally before cloud
    // migration. Existing records without a department become BOH handovers.
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
 * The effective date travels with each handover record. BOH and FOH are rolled
 * independently so each department keeps its own today/tomorrow handover.
 */
export function rollOverHandoversIfNeeded(): void {
  if (typeof window === "undefined") return;

  // Chef handover access is read-only. Rollover changes record identities and
  // would otherwise be interpreted as forbidden cloud deletes/creates.
  if (getCurrentUser()?.role === "chef") return;

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
    for (const department of ["boh", "foh"] as const) {
      const departmentRecords = current.filter(
        (record) =>
          record.siteName === siteName &&
          record.department === department
      );

      // Do not create empty FOH records for sites that have never had an FOH
      // handover. BOH retains the legacy behaviour for existing sites.
      if (department === "foh" && departmentRecords.length === 0) {
        continue;
      }

      const currentToday = departmentRecords.find(
        (record) =>
          record.day === "today" &&
          record.effectiveDate === todayKey
      );

      const plannedForToday = departmentRecords.find(
        (record) =>
          record.day === "tomorrow" &&
          record.effectiveDate === todayKey
      );

      const futureTomorrow = departmentRecords.find(
        (record) =>
          record.day === "tomorrow" &&
          record.effectiveDate === tomorrowKey
      );

      const sourceToday = currentToday ?? plannedForToday;

      rolled.push({
        id: sourceToday?.id ?? createId(),
        siteName,
        day: "today",
        department,
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
          department,
          effectiveDate: tomorrowKey,
          notes: [],
          updatedBy: "Unknown",
          updatedAt: new Date().toISOString(),
          visibleToChefs: false,
        }
      );
    }
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

export function getSiteHandover(
  siteName: string,
  day: HandoverDay,
  department: HandoverDepartment = "boh"
): SiteHandover {
  const expectedDate = dateForDay(day);
  const existing = getHandovers().find(
    (record) =>
      record.siteName === siteName &&
      record.day === day &&
      record.department === department &&
      record.effectiveDate === expectedDate
  );

  if (existing) return existing;

  return {
    id: createId(),
    siteName,
    day,
    department,
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
  department?: HandoverDepartment;
  notes: string[];
  updatedBy: string;
  visibleToChefs?: boolean;
}): SiteHandover {
  const cleanedNotes = input.notes.map((note) => note.trim()).filter(Boolean);
  const effectiveDate = dateForDay(input.day);
  const department = input.department ?? "boh";

  if (typeof window === "undefined") {
    return {
      id: createId(),
      siteName: input.siteName,
      day: input.day,
      department,
      effectiveDate,
      notes: cleanedNotes,
      updatedBy: input.updatedBy,
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
      record.department === department &&
      record.effectiveDate === effectiveDate
  );

  const updated: SiteHandover = {
    id: existing?.id ?? createId(),
    siteName: input.siteName,
    day: input.day,
    department,
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
          record.department === department &&
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
