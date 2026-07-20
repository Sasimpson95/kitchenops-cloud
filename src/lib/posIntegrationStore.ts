
const STORAGE_KEY =
  "kitchenops-pos-integration-settings";

const CHANGED_EVENT =
  "kitchenops-pos-integration-changed";

export type PosProvider =
  | "none"
  | "toast"
  | "square"
  | "lightspeed"
  | "revel"
  | "clover"
  | "generic-api"
  | "csv";

export type PosImportMode =
  | "reporting-only"
  | "theoretical-usage"
  | "automatic-stock";

export type PosSiteMapping = {
  kitchenOpsSiteId: string;
  kitchenOpsSiteName: string;

  externalLocationId: string;
  externalLocationName: string;
};

export type PosImportHistoryRecord = {
  id: string;

  startedAt: string;
  completedAt?: string;

  provider: PosProvider;

  importedOrders: number;
  matchedLines: number;
  unmatchedLines: number;
  duplicateLinesBlocked: number;

  status:
    | "completed"
    | "failed"
    | "in-progress";

  message?: string;
};

export type PosUnmatchedItem = {
  id: string;

  salesCode: string;
  externalName: string;

  quantity: number;
  firstSeenAt: string;
  lastSeenAt: string;
};

export type PosIntegrationSettings = {
  provider: PosProvider;

  connectionStatus:
    | "not-connected"
    | "configured"
    | "connected"
    | "error";

  importMode: PosImportMode;

  siteMappings: PosSiteMapping[];

  apiBaseUrl: string;
  accountId: string;

  lastImportAt?: string;

  importHistory:
    PosImportHistoryRecord[];

  unmatchedItems:
    PosUnmatchedItem[];

  updatedAt: string;
};

function now(): string {
  return new Date().toISOString();
}

function createDefaultSettings():
  PosIntegrationSettings {
  return {
    provider: "none",

    connectionStatus:
      "not-connected",

    importMode:
      "reporting-only",

    siteMappings: [],

    apiBaseUrl: "",
    accountId: "",

    importHistory: [],
    unmatchedItems: [],

    updatedAt: now(),
  };
}

function emitChanged(): void {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(
      CHANGED_EVENT
    )
  );
}

function normalise(
  value: Partial<PosIntegrationSettings>
): PosIntegrationSettings {
  const defaults =
    createDefaultSettings();

  const savedMappings =
    Array.isArray(
      value.siteMappings
    )
      ? value.siteMappings
      : [];

  return {
    provider:
      value.provider ??
      defaults.provider,

    connectionStatus:
      value.connectionStatus ??
      defaults.connectionStatus,

    importMode:
      value.importMode ??
      "reporting-only",

    siteMappings: savedMappings.map((mapping) => ({
      kitchenOpsSiteId: mapping.kitchenOpsSiteId,
      kitchenOpsSiteName: mapping.kitchenOpsSiteName,
      externalLocationId: mapping.externalLocationId?.trim() ?? "",
      externalLocationName: mapping.externalLocationName?.trim() ?? "",
    })),

    apiBaseUrl:
      value.apiBaseUrl?.trim() ??
      "",

    accountId:
      value.accountId?.trim() ??
      "",

    lastImportAt:
      value.lastImportAt,

    importHistory:
      Array.isArray(
        value.importHistory
      )
        ? value.importHistory
        : [],

    unmatchedItems:
      Array.isArray(
        value.unmatchedItems
      )
        ? value.unmatchedItems
        : [],

    updatedAt:
      value.updatedAt ??
      now(),
  };
}

export function getPosIntegrationSettings():
  PosIntegrationSettings {
  if (
    typeof window ===
    "undefined"
  ) {
    return createDefaultSettings();
  }

  const saved =
    window.localStorage.getItem(
      STORAGE_KEY
    );

  if (!saved) {
    const defaults =
      createDefaultSettings();

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(defaults)
    );

    return defaults;
  }

  try {
    return normalise(
      JSON.parse(saved) as
        Partial<PosIntegrationSettings>
    );
  } catch {
    return createDefaultSettings();
  }
}

export function savePosIntegrationSettings(
  input: PosIntegrationSettings
): PosIntegrationSettings {
  const updated =
    normalise({
      ...input,
      updatedAt: now(),
    });

  if (
    typeof window !==
    "undefined"
  ) {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updated)
    );

    emitChanged();
  }

  return updated;
}

export function subscribeToPosIntegrationChanges(
  callback: () => void
): () => void {
  if (
    typeof window ===
    "undefined"
  ) {
    return () => undefined;
  }

  function handleLocal(): void {
    callback();
  }

  function handleStorage(
    event: StorageEvent
  ): void {
    if (
      event.key ===
      STORAGE_KEY
    ) {
      callback();
    }
  }

  window.addEventListener(
    CHANGED_EVENT,
    handleLocal
  );

  window.addEventListener(
    "storage",
    handleStorage
  );

  return () => {
    window.removeEventListener(
      CHANGED_EVENT,
      handleLocal
    );

    window.removeEventListener(
      "storage",
      handleStorage
    );
  };
}
