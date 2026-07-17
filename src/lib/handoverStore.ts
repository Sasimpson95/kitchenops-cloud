const STORAGE_KEY =
  "kitchenops-site-handovers";

const HANDOVER_CHANGED_EVENT =
  "kitchenops-handover-changed";

export type HandoverDay =
  | "today"
  | "tomorrow";

export type SiteHandover = {
  id: string;
  siteName: string;
  day: HandoverDay;
  notes: string[];
  updatedBy: string;
  updatedAt: string;
};

const SITE_NAMES: string[] = [];

function createId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID ===
      "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function emitChanged(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(
      HANDOVER_CHANGED_EVENT
    )
  );
}

function createStarterRecords(): SiteHandover[] {
  return [];
}

function normaliseRecord(
  value: Partial<SiteHandover>
): SiteHandover | null {
  if (
    !value.id ||
    !value.siteName ||
    (
      value.day !== "today" &&
      value.day !== "tomorrow"
    )
  ) {
    return null;
  }

  return {
    id: value.id,
    siteName: value.siteName,
    day: value.day,

    notes: Array.isArray(value.notes)
      ? value.notes
          .map(String)
          .map((note) => note.trim())
          .filter(Boolean)
      : [],

    updatedBy:
      value.updatedBy ||
      "Unknown",

    updatedAt:
      value.updatedAt ||
      new Date().toISOString(),
  };
}

export function getHandovers(): SiteHandover[] {
  if (typeof window === "undefined") {
    return [];
  }

  const saved =
    window.localStorage.getItem(
      STORAGE_KEY
    );

  if (!saved) {
    const starter =
      createStarterRecords();

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(starter)
    );

    return starter;
  }

  try {
    const parsed: unknown =
      JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((record) =>
        normaliseRecord(
          record as Partial<SiteHandover>
        )
      )
      .filter(
        (
          record
        ): record is SiteHandover =>
          record !== null
      );
  } catch {
    return [];
  }
}

export function getSiteHandover(
  siteName: string,
  day: HandoverDay
): SiteHandover {
  const existing =
    getHandovers().find(
      (record) =>
        record.siteName ===
          siteName &&
        record.day === day
    );

  if (existing) {
    return existing;
  }

  return {
    id: createId(),
    siteName,
    day,
    notes: [],
    updatedBy: "Unknown",
    updatedAt:
      new Date().toISOString(),
  };
}

export function saveSiteHandover(
  input: {
    siteName: string;
    day: HandoverDay;
    notes: string[];
    updatedBy: string;
  }
): SiteHandover {
  if (typeof window === "undefined") {
    return {
      id: createId(),
      ...input,
      notes: input.notes
        .map((note) => note.trim())
        .filter(Boolean),
      updatedAt:
        new Date().toISOString(),
    };
  }

  const current =
    getHandovers();

  const existing =
    current.find(
      (record) =>
        record.siteName ===
          input.siteName &&
        record.day ===
          input.day
    );

  const updated: SiteHandover = {
    id:
      existing?.id ??
      createId(),

    siteName:
      input.siteName,

    day: input.day,

    notes: input.notes
      .map((note) => note.trim())
      .filter(Boolean),

    updatedBy:
      input.updatedBy.trim() ||
      "Unknown",

    updatedAt:
      new Date().toISOString(),
  };

  const records = [
    ...current.filter(
      (record) =>
        !(
          record.siteName ===
            input.siteName &&
          record.day ===
            input.day
        )
    ),

    updated,
  ];

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(records)
  );

  emitChanged();

  return updated;
}

export function subscribeToHandoverChanges(
  callback: () => void
): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  function handleLocal(): void {
    callback();
  }

  function handleStorage(
    event: StorageEvent
  ): void {
    if (
      event.key === STORAGE_KEY
    ) {
      callback();
    }
  }

  window.addEventListener(
    HANDOVER_CHANGED_EVENT,
    handleLocal
  );

  window.addEventListener(
    "storage",
    handleStorage
  );

  return () => {
    window.removeEventListener(
      HANDOVER_CHANGED_EVENT,
      handleLocal
    );

    window.removeEventListener(
      "storage",
      handleStorage
    );
  };
}
