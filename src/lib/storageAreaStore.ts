import { scheduleCloudCatalogSave } from "@/lib/cloud/catalogSync";

const STORAGE_KEY = "kitchenops-storage-areas";
const STORAGE_AREAS_CHANGED_EVENT =
  "kitchenops-storage-areas-changed";

export type StorageArea = {
  id: string;
  siteId: string;
  siteName: string;
  name: string;
  description: string;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

const STARTER_AREAS: Array<{
  name: string;
  description: string;
}> = [
  {
    name: "Walk-in Fridge",
    description: "Main chilled storage area.",
  },
  {
    name: "Dry Store",
    description: "Ambient dry goods storage.",
  },
  {
    name: "Freezer",
    description: "Frozen product storage.",
  },
];

const SITES = [
  { id: "beeston", name: "Beeston" },
  { id: "city", name: "City" },
  { id: "sherwood", name: "Sherwood" },
  { id: "bakery", name: "Bakery" },
];

function createId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function now(): string {
  return new Date().toISOString();
}

function createStarterAreas(): StorageArea[] {
  const timestamp = now();

  return SITES.flatMap((site) =>
    STARTER_AREAS.map((area, index) => ({
      id: createId(),
      siteId: site.id,
      siteName: site.name,
      name: area.name,
      description: area.description,
      sortOrder: index + 1,
      active: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    }))
  );
}

function emitChanged(): void {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent(STORAGE_AREAS_CHANGED_EVENT)
  );
}

function save(records: StorageArea[]): void {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(records)
  );

  emitChanged();
  scheduleCloudCatalogSave();
}

function normalise(
  value: Partial<StorageArea>
): StorageArea | null {
  if (
    !value.id ||
    !value.siteId ||
    !value.siteName ||
    !value.name
  ) {
    return null;
  }

  return {
    id: value.id,
    siteId: value.siteId,
    siteName: value.siteName,
    name: value.name.trim(),
    description: value.description?.trim() || "",
    sortOrder: Math.max(1, Number(value.sortOrder) || 1),
    active:
      typeof value.active === "boolean"
        ? value.active
        : true,
    createdAt: value.createdAt || now(),
    updatedAt: value.updatedAt || now(),
  };
}

export function getStorageAreas(): StorageArea[] {
  if (typeof window === "undefined") return [];

  const saved = window.localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    const starter = createStarterAreas();
    save(starter);
    return starter;
  }

  try {
    const parsed: unknown = JSON.parse(saved);

    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((value) =>
        normalise(value as Partial<StorageArea>)
      )
      .filter(
        (area): area is StorageArea =>
          area !== null
      )
      .sort(
        (first, second) =>
          first.siteName.localeCompare(second.siteName) ||
          first.sortOrder - second.sortOrder ||
          first.name.localeCompare(second.name)
      );
  } catch {
    return [];
  }
}

export function getStorageAreasForSite(
  siteId: string,
  includeArchived = false
): StorageArea[] {
  return getStorageAreas().filter(
    (area) =>
      area.siteId === siteId &&
      (includeArchived || area.active)
  );
}

export function createStorageArea(input: {
  siteId: string;
  siteName: string;
  name: string;
  description?: string;
}): StorageArea {
  const name = input.name.trim();

  if (!name) {
    throw new Error("Enter a storage area name.");
  }

  const current = getStorageAreas();

  const duplicate = current.some(
    (area) =>
      area.siteId === input.siteId &&
      area.name.toLowerCase() === name.toLowerCase() &&
      area.active
  );

  if (duplicate) {
    throw new Error(
      "A storage area with this name already exists at this site."
    );
  }

  const siteAreas = current.filter(
    (area) => area.siteId === input.siteId
  );

  const area: StorageArea = {
    id: createId(),
    siteId: input.siteId,
    siteName: input.siteName,
    name,
    description: input.description?.trim() || "",
    sortOrder:
      siteAreas.reduce(
        (highest, item) =>
          Math.max(highest, item.sortOrder),
        0
      ) + 1,
    active: true,
    createdAt: now(),
    updatedAt: now(),
  };

  save([...current, area]);

  return area;
}

export function updateStorageArea(
  id: string,
  input: {
    name: string;
    description?: string;
  }
): StorageArea {
  const current = getStorageAreas();
  const existing = current.find((area) => area.id === id);

  if (!existing) {
    throw new Error("Storage area not found.");
  }

  const name = input.name.trim();

  if (!name) {
    throw new Error("Enter a storage area name.");
  }

  const duplicate = current.some(
    (area) =>
      area.id !== id &&
      area.siteId === existing.siteId &&
      area.name.toLowerCase() === name.toLowerCase() &&
      area.active
  );

  if (duplicate) {
    throw new Error(
      "Another active storage area already uses this name."
    );
  }

  const updated: StorageArea = {
    ...existing,
    name,
    description: input.description?.trim() || "",
    updatedAt: now(),
  };

  save(
    current.map((area) =>
      area.id === id ? updated : area
    )
  );

  return updated;
}

export function archiveStorageArea(
  id: string
): StorageArea {
  const current = getStorageAreas();
  const existing = current.find((area) => area.id === id);

  if (!existing) {
    throw new Error("Storage area not found.");
  }

  const updated: StorageArea = {
    ...existing,
    active: false,
    updatedAt: now(),
  };

  save(
    current.map((area) =>
      area.id === id ? updated : area
    )
  );

  return updated;
}

export function restoreStorageArea(
  id: string
): StorageArea {
  const current = getStorageAreas();
  const existing = current.find((area) => area.id === id);

  if (!existing) {
    throw new Error("Storage area not found.");
  }

  const updated: StorageArea = {
    ...existing,
    active: true,
    updatedAt: now(),
  };

  save(
    current.map((area) =>
      area.id === id ? updated : area
    )
  );

  return updated;
}

export function deleteStorageArea(
  id: string
): void {
  const current = getStorageAreas();
  const existing = current.find((area) => area.id === id);

  if (!existing) {
    throw new Error("Storage area not found.");
  }

  save(current.filter((area) => area.id !== id));
}

export function moveStorageArea(
  id: string,
  direction: "up" | "down"
): void {
  const current = getStorageAreas();
  const existing = current.find((area) => area.id === id);

  if (!existing) return;

  const siteAreas = current
    .filter(
      (area) =>
        area.siteId === existing.siteId &&
        area.active
    )
    .sort(
      (first, second) =>
        first.sortOrder - second.sortOrder
    );

  const index = siteAreas.findIndex(
    (area) => area.id === id
  );

  const swapIndex =
    direction === "up"
      ? index - 1
      : index + 1;

  if (
    index < 0 ||
    swapIndex < 0 ||
    swapIndex >= siteAreas.length
  ) {
    return;
  }

  const other = siteAreas[swapIndex];

  const updated = current.map((area) => {
    if (area.id === existing.id) {
      return {
        ...area,
        sortOrder: other.sortOrder,
        updatedAt: now(),
      };
    }

    if (area.id === other.id) {
      return {
        ...area,
        sortOrder: existing.sortOrder,
        updatedAt: now(),
      };
    }

    return area;
  });

  save(updated);
}

export function subscribeToStorageAreaChanges(
  callback: () => void
): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  function handleLocal(): void {
    callback();
  }

  function handleStorage(event: StorageEvent): void {
    if (event.key === STORAGE_KEY) {
      callback();
    }
  }

  window.addEventListener(
    STORAGE_AREAS_CHANGED_EVENT,
    handleLocal
  );

  window.addEventListener(
    "storage",
    handleStorage
  );

  return () => {
    window.removeEventListener(
      STORAGE_AREAS_CHANGED_EVENT,
      handleLocal
    );

    window.removeEventListener(
      "storage",
      handleStorage
    );
  };
}
