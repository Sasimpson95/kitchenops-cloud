import {
  type ProductionDay,
  type ProductionItem,
  startingProduction,
} from "@/data/production";

import { findRecipe } from "@/data/recipes";

import {
  addInventoryMovements,
} from "@/lib/inventoryStore";

import {
  addAuditRecord,
} from "@/lib/auditStore";

const STORAGE_KEY =
  "kitchenops-prep-plan";

const PREP_CHANGED_EVENT =
  "kitchenops-prep-changed";

export type AddPrepInput = {
  site: string;
  name: string;
  emoji: string;
  planned: number;
  day: ProductionDay;
};

export type UpdatePrepQuantityInput = {
  id: number;
  planned: number;
};

export type SubmitPrepInput = {
  id: number;
  produced: number;
  chef: string;
};

export type ApprovePrepInput = {
  id: number;
  approvedQuantity: number;
  addRemainingToTomorrow: boolean;
  approvedBy?: string;
};

export type CompletePrepAsManagerInput = {
  id: number;
  produced: number;
  addRemainingToTomorrow: boolean;
  completedBy: string;
};

function now(): string {
  return new Date().toISOString();
}

function formatCurrentTime(): string {
  return new Intl.DateTimeFormat(
    "en-GB",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(new Date());
}

function getSiteId(
  siteName: string
): string {
  return siteName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function cloneStartingProduction(): ProductionItem[] {
  return JSON.parse(
    JSON.stringify(startingProduction)
  ) as ProductionItem[];
}

function emitPrepChanged(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(
      PREP_CHANGED_EVENT
    )
  );
}

function normalisePrepItem(
  item: Partial<ProductionItem> & {
    id: number;
    name: string;
  }
): ProductionItem {
  const timestamp = now();

  return {
    id: item.id,

    site:
      item.site?.trim() ||
      "Beeston",

    name: item.name.trim(),

    emoji:
      item.emoji?.trim() ||
      "🍽️",

    planned: Math.max(
      0,
      Number.isFinite(item.planned)
        ? Number(item.planned)
        : 0
    ),

    produced: Math.max(
      0,
      Number.isFinite(item.produced)
        ? Number(item.produced)
        : 0
    ),

    status:
      item.status ===
        "awaitingApproval" ||
      item.status === "approved"
        ? item.status
        : "planned",

    day:
      item.day === "tomorrow"
        ? "tomorrow"
        : "today",

    chef: item.chef,
    readyTime: item.readyTime,

    createdAt:
      item.createdAt || timestamp,

    updatedAt:
      item.updatedAt || timestamp,
  };
}

function initialisePrepPlan(): ProductionItem[] {
  const initialItems =
    cloneStartingProduction().map(
      normalisePrepItem
    );

  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(initialItems)
    );
  }

  return initialItems;
}

function getNextPrepId(
  items: ProductionItem[]
): number {
  return (
    items.reduce(
      (highestId, item) =>
        Math.max(
          highestId,
          item.id
        ),
      0
    ) + 1
  );
}

export function getPrepItems(): ProductionItem[] {
  if (typeof window === "undefined") {
    return cloneStartingProduction().map(
      normalisePrepItem
    );
  }

  const saved =
    window.localStorage.getItem(
      STORAGE_KEY
    );

  if (!saved) {
    return initialisePrepPlan();
  }

  try {
    const parsed: unknown =
      JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return initialisePrepPlan();
    }

    const normalisedItems = (
      parsed as ProductionItem[]
    ).map(normalisePrepItem);

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(normalisedItems)
    );

    return normalisedItems;
  } catch {
    return initialisePrepPlan();
  }
}

export function getPrepItemById(
  id: number
): ProductionItem | undefined {
  return getPrepItems().find(
    (item) => item.id === id
  );
}

export function savePrepItems(
  items: ProductionItem[]
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(items)
  );

  emitPrepChanged();
}

export function addPrepItem(
  input: AddPrepInput
): ProductionItem {
  if (!input.site.trim()) {
    throw new Error(
      "Choose a site."
    );
  }

  if (!input.name.trim()) {
    throw new Error(
      "Choose a recipe."
    );
  }

  if (
    !Number.isFinite(input.planned) ||
    input.planned <= 0
  ) {
    throw new Error(
      "Enter at least one batch."
    );
  }

  const currentItems =
    getPrepItems();

  const existingItem =
    currentItems.find(
      (item) =>
        item.site === input.site &&
        item.day === input.day &&
        item.name
          .trim()
          .toLowerCase() ===
          input.name
            .trim()
            .toLowerCase() &&
        item.status === "planned"
    );

  if (existingItem) {
    const updatedItem: ProductionItem = {
      ...existingItem,

      planned:
        existingItem.planned +
        input.planned,

      updatedAt: now(),
    };

    savePrepItems(
      currentItems.map((item) =>
        item.id === existingItem.id
          ? updatedItem
          : item
      )
    );

    return updatedItem;
  }

  const timestamp = now();

  const newItem: ProductionItem = {
    id: getNextPrepId(
      currentItems
    ),

    site: input.site.trim(),

    name: input.name.trim(),

    emoji:
      input.emoji.trim() ||
      "🍽️",

    planned: input.planned,
    produced: 0,

    status: "planned",
    day: input.day,

    createdAt: timestamp,
    updatedAt: timestamp,
  };

  savePrepItems([
    ...currentItems,
    newItem,
  ]);

  return newItem;
}

export function updatePrepQuantity(
  input: UpdatePrepQuantityInput
): ProductionItem {
  const currentItems =
    getPrepItems();

  const existingItem =
    currentItems.find(
      (item) =>
        item.id === input.id
    );

  if (!existingItem) {
    throw new Error(
      "Prep item not found."
    );
  }

  if (
    existingItem.status !== "planned"
  ) {
    throw new Error(
      "Only planned prep can be changed."
    );
  }

  if (
    !Number.isFinite(input.planned) ||
    input.planned <= 0
  ) {
    throw new Error(
      "Planned quantity must be at least one."
    );
  }

  const updatedItem: ProductionItem = {
    ...existingItem,

    planned: input.planned,
    updatedAt: now(),
  };

  savePrepItems(
    currentItems.map((item) =>
      item.id === input.id
        ? updatedItem
        : item
    )
  );

  return updatedItem;
}

export function removePrepItem(
  id: number
): void {
  const currentItems =
    getPrepItems();

  const existingItem =
    currentItems.find(
      (item) => item.id === id
    );

  if (!existingItem) {
    throw new Error(
      "Prep item not found."
    );
  }

  if (
    existingItem.status !== "planned"
  ) {
    throw new Error(
      "Submitted or approved prep cannot be removed."
    );
  }

  savePrepItems(
    currentItems.filter(
      (item) => item.id !== id
    )
  );
}

export function submitPrepForApproval(
  input: SubmitPrepInput
): ProductionItem {
  const currentItems =
    getPrepItems();

  const existingItem =
    currentItems.find(
      (item) => item.id === input.id
    );

  if (!existingItem) {
    throw new Error(
      "Prep item not found."
    );
  }

  if (
    existingItem.status !== "planned"
  ) {
    throw new Error(
      "This prep has already been submitted."
    );
  }

  if (
    !Number.isFinite(input.produced) ||
    input.produced <= 0
  ) {
    throw new Error(
      "Enter how many batches were prepared."
    );
  }

  if (!input.chef.trim()) {
    throw new Error(
      "Chef name is missing."
    );
  }

  const updatedItem: ProductionItem = {
    ...existingItem,

    produced: input.produced,

    status: "awaitingApproval",

    chef: input.chef.trim(),

    readyTime: formatCurrentTime(),

    updatedAt: now(),
  };

  savePrepItems(
    currentItems.map((item) =>
      item.id === input.id
        ? updatedItem
        : item
    )
  );

  return updatedItem;
}


function applyApprovedProduction(
  existingItem: ProductionItem,
  approvedQuantity: number,
  addRemainingToTomorrow: boolean,
  approvedBy: string
): ProductionItem {
  const currentItems =
    getPrepItems();

  if (
    !Number.isFinite(
      approvedQuantity
    ) ||
    approvedQuantity <= 0
  ) {
    throw new Error(
      "Enter how many batches were made."
    );
  }

  const recipe = findRecipe(
    existingItem.name
  );

  if (!recipe) {
    throw new Error(
      "The matching recipe could not be found. Inventory has not been changed."
    );
  }

  const timestamp = now();

  addInventoryMovements(
    recipe.ingredients.map(
      (ingredient) => ({
        businessId:
          "pudding-pantry",

        siteId: getSiteId(
          existingItem.site
        ),

        productId:
          ingredient.productId,

        quantity:
          -(
            ingredient.quantity *
            approvedQuantity
          ),

        movementType:
          "Production" as const,

        referenceId:
          `prep-${existingItem.id}`,

        referenceNumber:
          `${existingItem.name} x${approvedQuantity} approved`,
      })
    )
  );

  const approvedItem: ProductionItem = {
    ...existingItem,

    produced:
      approvedQuantity,

    status: "approved",

    chef:
      existingItem.chef ||
      approvedBy,

    readyTime:
      existingItem.readyTime ||
      formatCurrentTime(),

    updatedAt:
      timestamp,
  };

  let updatedItems =
    currentItems.map((item) =>
      item.id ===
      existingItem.id
        ? approvedItem
        : item
    );

  const remaining =
    Math.max(
      existingItem.planned -
        approvedQuantity,
      0
    );

  if (
    remaining > 0 &&
    addRemainingToTomorrow
  ) {
    const existingTomorrowItem =
      updatedItems.find(
        (item) =>
          item.site ===
            existingItem.site &&
          item.day ===
            "tomorrow" &&
          item.name
            .trim()
            .toLowerCase() ===
            existingItem.name
              .trim()
              .toLowerCase() &&
          item.status ===
            "planned"
      );

    if (existingTomorrowItem) {
      updatedItems =
        updatedItems.map(
          (item) =>
            item.id ===
            existingTomorrowItem.id
              ? {
                  ...item,
                  planned:
                    item.planned +
                    remaining,
                  updatedAt:
                    timestamp,
                }
              : item
        );
    } else {
      updatedItems = [
        ...updatedItems,

        {
          id: getNextPrepId(
            updatedItems
          ),

          site:
            existingItem.site,

          name:
            existingItem.name,

          emoji:
            existingItem.emoji,

          planned:
            remaining,

          produced: 0,

          status:
            "planned",

          day:
            "tomorrow",

          createdAt:
            timestamp,

          updatedAt:
            timestamp,
        },
      ];
    }
  }

  savePrepItems(
    updatedItems
  );

  addAuditRecord({
    action: "completed",
    area: "Production",
    title: `${existingItem.name} production approved`,
    description: `${approvedQuantity} batch(es) completed and ingredients deducted from inventory.`,
    siteId: getSiteId(
      existingItem.site
    ),
    siteName:
      existingItem.site,
    performedBy:
      approvedBy ||
      "Manager",
  });

  return approvedItem;
}

export function completePrepAsManager(
  input: CompletePrepAsManagerInput
): ProductionItem {
  const existingItem =
    getPrepItems().find(
      (item) =>
        item.id === input.id
    );

  if (!existingItem) {
    throw new Error(
      "Prep item not found."
    );
  }

  if (
    existingItem.status ===
    "approved"
  ) {
    throw new Error(
      "This prep has already been completed."
    );
  }

  return applyApprovedProduction(
    existingItem,
    input.produced,
    input.addRemainingToTomorrow,
    input.completedBy.trim() ||
      "Manager"
  );
}

export function approvePrepItem(
  input: ApprovePrepInput
): ProductionItem {
  const existingItem =
    getPrepItems().find(
      (item) =>
        item.id === input.id
    );

  if (!existingItem) {
    throw new Error(
      "Prep item not found."
    );
  }

  if (
    existingItem.status ===
    "approved"
  ) {
    throw new Error(
      "This prep has already been approved."
    );
  }

  if (
    existingItem.status !==
    "awaitingApproval"
  ) {
    throw new Error(
      "Only chef prep awaiting approval can be approved."
    );
  }

  return applyApprovedProduction(
    existingItem,
    input.approvedQuantity,
    input.addRemainingToTomorrow,
    input.approvedBy?.trim() ||
      "Manager"
  );
}

export function subscribeToPrepChanges(
  callback: () => void
): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  function handleLocalChange(): void {
    callback();
  }

  function handleStorageChange(
    event: StorageEvent
  ): void {
    if (event.key === STORAGE_KEY) {
      callback();
    }
  }

  window.addEventListener(
    PREP_CHANGED_EVENT,
    handleLocalChange
  );

  window.addEventListener(
    "storage",
    handleStorageChange
  );

  return () => {
    window.removeEventListener(
      PREP_CHANGED_EVENT,
      handleLocalChange
    );

    window.removeEventListener(
      "storage",
      handleStorageChange
    );
  };
}