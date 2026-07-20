import { getActiveBusinessId } from "@/lib/businessWorkspace";
import type { Product } from "@/data/products";

import {
  addInventoryMovements,
  getProductStock,
} from "@/lib/inventoryStore";

import {
  getAssignmentsForSite,
} from "@/lib/productLocationStore";

import {
  getStorageAreasForSite,
} from "@/lib/storageAreaStore";

import type {
  BusinessSettings,
  StocktakeFrequency,
  WeekStartDay,
} from "@/lib/businessSettingsStore";

const STORAGE_KEY = "kitchenops-stocktakes-v2";
const STOCKTAKES_CHANGED_EVENT =
  "kitchenops-stocktakes-changed";



export type StocktakeStatus =
  | "In Progress"
  | "Completed";

export type StocktakeItem = {
  id: string;
  assignmentId?: string;

  productId: number;
  productName: string;
  category: string;
  inventoryUnit: string;
  location: string;

  expectedQuantity: number;
  countedQuantity: number | null;
};

export type Stocktake = {
  id: string;
  stocktakeNumber: string;

  businessId: string;
  siteId: string;
  siteName: string;

  status: StocktakeStatus;

  frequency: StocktakeFrequency;
  periodKey: string;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;

  items: StocktakeItem[];
  currentIndex: number;

  startedBy: string;
  startedAt: string;
  updatedAt: string;

  completedBy?: string;
  completedAt?: string;
};

export type StocktakePeriod = {
  key: string;
  label: string;
  start: string;
  end: string;
};

export type StartStocktakeInput = {
  businessId?: string;

  siteId: string;
  siteName: string;

  products: Product[];
  startedBy: string;

  settings: BusinessSettings;
  referenceDate?: Date;
};

function now(): string {
  return new Date().toISOString();
}

function createId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function toDateKey(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateKey(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function formatPeriodDate(value: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(value);
}

function getDayIndex(day: WeekStartDay): number {
  return {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  }[day];
}

function startOfWeek(
  value: Date,
  weekStartsOn: WeekStartDay
): Date {
  const result = new Date(value);
  result.setHours(0, 0, 0, 0);

  const targetDay = getDayIndex(weekStartsOn);
  const difference =
    (result.getDay() - targetDay + 7) % 7;

  result.setDate(result.getDate() - difference);

  return result;
}

function addDays(value: Date, days: number): Date {
  const result = new Date(value);
  result.setDate(result.getDate() + days);
  return result;
}

function emitStocktakesChanged(): void {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent(STOCKTAKES_CHANGED_EVENT)
  );
}

function saveStocktakes(stocktakes: Stocktake[]): void {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(stocktakes)
  );

  emitStocktakesChanged();
}

function getNextStocktakeNumber(
  stocktakes: Stocktake[]
): string {
  const highest = stocktakes.reduce(
    (currentHighest, stocktake) => {
      const numberPart = Number(
        stocktake.stocktakeNumber
          .split("-")
          .at(-1) ?? "0"
      );

      return Number.isFinite(numberPart)
        ? Math.max(currentHighest, numberPart)
        : currentHighest;
    },
    0
  );

  return `STK-${String(highest + 1).padStart(6, "0")}`;
}

function normaliseItem(
  item: Partial<StocktakeItem>
): StocktakeItem | null {
  if (
    !Number.isFinite(item.productId) ||
    !item.productName
  ) {
    return null;
  }

  return {
    id:
      item.id ||
      `${Number(item.productId)}-${item.location || "not-assigned"}`,

    assignmentId:
      item.assignmentId,

    productId: Number(item.productId),
    productName: item.productName,
    category: item.category || "Uncategorised",
    inventoryUnit: item.inventoryUnit || "Each",
    location: item.location || "Not assigned",

    expectedQuantity: Math.max(
      0,
      Number(item.expectedQuantity) || 0
    ),

    countedQuantity:
      item.countedQuantity === null ||
      item.countedQuantity === undefined
        ? null
        : Math.max(
            0,
            Number(item.countedQuantity) || 0
          ),
  };
}

function normaliseStocktake(
  stocktake: Partial<Stocktake>
): Stocktake | null {
  if (
    !stocktake.id ||
    !stocktake.siteId ||
    !stocktake.siteName ||
    !stocktake.startedAt
  ) {
    return null;
  }

  const items = Array.isArray(stocktake.items)
    ? stocktake.items
        .map((item) => normaliseItem(item))
        .filter(
          (item): item is StocktakeItem =>
            item !== null
        )
    : [];

  return {
    id: stocktake.id,
    stocktakeNumber:
      stocktake.stocktakeNumber || "STK-000000",

    businessId:
      stocktake.businessId || getActiveBusinessId(),

    siteId: stocktake.siteId,
    siteName: stocktake.siteName,

    status:
      stocktake.status === "Completed"
        ? "Completed"
        : "In Progress",

    frequency:
      stocktake.frequency || "manual",

    periodKey:
      stocktake.periodKey ||
      `manual-${stocktake.id}`,

    periodLabel:
      stocktake.periodLabel || "Manual stocktake",

    periodStart:
      stocktake.periodStart ||
      toDateKey(new Date(stocktake.startedAt)),

    periodEnd:
      stocktake.periodEnd ||
      toDateKey(new Date(stocktake.startedAt)),

    items,

    currentIndex: Math.min(
      Math.max(
        0,
        Number(stocktake.currentIndex) || 0
      ),
      Math.max(items.length - 1, 0)
    ),

    startedBy:
      stocktake.startedBy || "Unknown",

    startedAt: stocktake.startedAt,

    updatedAt:
      stocktake.updatedAt || stocktake.startedAt,

    completedBy: stocktake.completedBy,
    completedAt: stocktake.completedAt,
  };
}

export function getStocktakePeriod(
  settings: BusinessSettings,
  referenceDate = new Date()
): StocktakePeriod {
  const date = new Date(referenceDate);
  date.setHours(0, 0, 0, 0);

  switch (settings.stocktakeFrequency) {
    case "daily": {
      const key = toDateKey(date);

      return {
        key: `daily-${key}`,
        label: formatPeriodDate(date),
        start: key,
        end: key,
      };
    }

    case "weekly": {
      const start = startOfWeek(
        date,
        settings.weekStartsOn
      );
      const end = addDays(start, 6);

      return {
        key: `weekly-${toDateKey(start)}`,
        label: `${formatPeriodDate(start)} – ${formatPeriodDate(end)}`,
        start: toDateKey(start),
        end: toDateKey(end),
      };
    }

    case "every-4-weeks": {
      const epoch = startOfWeek(
        new Date(2026, 0, 5),
        settings.weekStartsOn
      );

      const currentWeekStart = startOfWeek(
        date,
        settings.weekStartsOn
      );

      const millisecondsPerWeek =
        7 * 24 * 60 * 60 * 1000;

      const weeksSinceEpoch = Math.floor(
        (currentWeekStart.getTime() -
          epoch.getTime()) /
          millisecondsPerWeek
      );

      const blockIndex = Math.floor(
        weeksSinceEpoch / 4
      );

      const start = addDays(
        epoch,
        blockIndex * 28
      );

      const end = addDays(start, 27);

      return {
        key: `four-week-${toDateKey(start)}`,
        label: `${formatPeriodDate(start)} – ${formatPeriodDate(end)}`,
        start: toDateKey(start),
        end: toDateKey(end),
      };
    }

    case "monthly": {
      const start = new Date(
        date.getFullYear(),
        date.getMonth(),
        1
      );

      const end = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0
      );

      const monthLabel = new Intl.DateTimeFormat(
        "en-GB",
        {
          month: "long",
          year: "numeric",
        }
      ).format(date);

      return {
        key: `monthly-${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`,
        label: monthLabel,
        start: toDateKey(start),
        end: toDateKey(end),
      };
    }

    case "quarterly": {
      const quarterIndex = Math.floor(
        date.getMonth() / 3
      );

      const start = new Date(
        date.getFullYear(),
        quarterIndex * 3,
        1
      );

      const end = new Date(
        date.getFullYear(),
        quarterIndex * 3 + 3,
        0
      );

      return {
        key: `quarterly-${date.getFullYear()}-Q${quarterIndex + 1}`,
        label: `Q${quarterIndex + 1} ${date.getFullYear()}`,
        start: toDateKey(start),
        end: toDateKey(end),
      };
    }

    case "manual":
    default: {
      const key = `${toDateKey(date)}-${Date.now()}`;

      return {
        key: `manual-${key}`,
        label: `Manual • ${formatPeriodDate(date)}`,
        start: toDateKey(date),
        end: toDateKey(date),
      };
    }
  }
}

export function getStocktakes(): Stocktake[] {
  if (typeof window === "undefined") return [];

  const saved =
    window.localStorage.getItem(STORAGE_KEY);

  if (!saved) return [];

  try {
    const parsed: unknown = JSON.parse(saved);

    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((stocktake) =>
        normaliseStocktake(
          stocktake as Partial<Stocktake>
        )
      )
      .filter(
        (
          stocktake
        ): stocktake is Stocktake =>
          stocktake !== null
      )
      .sort(
        (first, second) =>
          new Date(second.startedAt).getTime() -
          new Date(first.startedAt).getTime()
      );
  } catch {
    return [];
  }
}

export function getStocktakeById(
  id: string
): Stocktake | undefined {
  return getStocktakes().find(
    (stocktake) => stocktake.id === id
  );
}

export function getOpenStocktakeForSite(
  siteId: string
): Stocktake | undefined {
  return getStocktakes().find(
    (stocktake) =>
      stocktake.siteId === siteId &&
      stocktake.status === "In Progress"
  );
}

export function getStocktakeForPeriod(
  siteId: string,
  periodKey: string
): Stocktake | undefined {
  return getStocktakes().find(
    (stocktake) =>
      stocktake.siteId === siteId &&
      stocktake.periodKey === periodKey
  );
}

export function startStocktake(
  input: StartStocktakeInput
): Stocktake {
  const businessId =
    input.businessId || getActiveBusinessId();

  if (
    !input.siteId.trim() ||
    !input.siteName.trim()
  ) {
    throw new Error("Choose a site.");
  }

  if (!input.startedBy.trim()) {
    throw new Error(
      "The person starting the stocktake is missing."
    );
  }

  const activeProducts =
    input.products.filter(
      (product) => product.active
    );

  if (activeProducts.length === 0) {
    throw new Error(
      "There are no active products to count."
    );
  }

  const currentStocktakes = getStocktakes();

  const existingOpen =
    currentStocktakes.find(
      (stocktake) =>
        stocktake.siteId === input.siteId &&
        stocktake.status === "In Progress"
    );

  if (existingOpen) {
    throw new Error(
      `${input.siteName} already has an open stocktake.`
    );
  }

  const period = getStocktakePeriod(
    input.settings,
    input.referenceDate
  );

  if (
    input.settings.stocktakeFrequency !== "manual"
  ) {
    const existingForPeriod =
      currentStocktakes.find(
        (stocktake) =>
          stocktake.siteId === input.siteId &&
          stocktake.periodKey === period.key
      );

    if (existingForPeriod) {
      throw new Error(
        `${input.siteName} already has a stocktake for ${period.label}.`
      );
    }
  }

  const timestamp = now();

  const stocktake: Stocktake = {
    id: createId(),
    stocktakeNumber:
      getNextStocktakeNumber(currentStocktakes),

    businessId,
    siteId: input.siteId,
    siteName: input.siteName,

    status: "In Progress",

    frequency:
      input.settings.stocktakeFrequency,

    periodKey: period.key,
    periodLabel: period.label,
    periodStart: period.start,
    periodEnd: period.end,

    items: (() => {
      const assignments =
        getAssignmentsForSite(
          input.siteId
        );

      const areas =
        getStorageAreasForSite(
          input.siteId
        );

      const areaOrder =
        new Map(
          areas.map(
            (area) => [
              area.id,
              area.sortOrder,
            ]
          )
        );

      const productById =
        new Map(
          activeProducts.map(
            (product) => [
              product.id,
              product,
            ]
          )
        );

      const assignedItems =
        assignments
          .filter(
            (assignment) =>
              productById.has(
                assignment.productId
              )
          )
          .map(
            (assignment) => {
              const product =
                productById.get(
                  assignment.productId
                )!;

              return {
                id:
                  assignment.id,

                assignmentId:
                  assignment.id,

                productId:
                  product.id,

                productName:
                  product.name,

                category:
                  product.category,

                inventoryUnit:
                  product.inventoryUnit,

                location:
                  assignment.storageAreaName,

                expectedQuantity:
                  assignment.isPrimary
                    ? getProductStock(
                        businessId,
                        input.siteId,
                        product.id
                      )
                    : 0,

                countedQuantity:
                  null,

                areaOrder:
                  areaOrder.get(
                    assignment.storageAreaId
                  ) ?? 9999,

                productOrder:
                  assignment.sortOrder,
              };
            }
          );

      const assignedProductIds =
        new Set(
          assignments.map(
            (assignment) =>
              assignment.productId
          )
        );

      const unassignedItems =
        activeProducts
          .filter(
            (product) =>
              !assignedProductIds.has(
                product.id
              )
          )
          .map(
            (product) => ({
              id:
                `unassigned-${product.id}`,

              assignmentId:
                undefined,

              productId:
                product.id,

              productName:
                product.name,

              category:
                product.category,

              inventoryUnit:
                product.inventoryUnit,

              location:
                "Not assigned",

              expectedQuantity:
                getProductStock(
                  businessId,
                  input.siteId,
                  product.id
                ),

              countedQuantity:
                null,

              areaOrder:
                99999,

              productOrder:
                product.id,
            })
          );

      return [
        ...assignedItems,
        ...unassignedItems,
      ]
        .sort(
          (first, second) =>
            first.areaOrder -
              second.areaOrder ||
            first.productOrder -
              second.productOrder ||
            first.productName.localeCompare(
              second.productName
            )
        )
        .map(
          ({
            areaOrder: _areaOrder,
            productOrder: _productOrder,
            ...item
          }) => item
        );
    })(),

    currentIndex: 0,

    startedBy: input.startedBy.trim(),
    startedAt: timestamp,
    updatedAt: timestamp,
  };

  saveStocktakes([
    stocktake,
    ...currentStocktakes,
  ]);

  return stocktake;
}

export function saveStocktakeCount(
  stocktakeId: string,
  itemId: string,
  countedQuantity: number,
  nextIndex?: number
): Stocktake {
  const quantity = Number(countedQuantity);

  if (
    !Number.isFinite(quantity) ||
    quantity < 0
  ) {
    throw new Error(
      "Enter a valid count of zero or more."
    );
  }

  const currentStocktakes = getStocktakes();

  const existing =
    currentStocktakes.find(
      (stocktake) =>
        stocktake.id === stocktakeId
    );

  if (!existing) {
    throw new Error("Stocktake not found.");
  }

  if (existing.status !== "In Progress") {
    throw new Error(
      "Completed stocktakes cannot be edited."
    );
  }

  const updatedItems =
    existing.items.map((item) =>
      item.id === itemId
        ? {
            ...item,
            countedQuantity: quantity,
          }
        : item
    );

  const safeNextIndex =
    nextIndex === undefined
      ? existing.currentIndex
      : Math.min(
          Math.max(0, nextIndex),
          Math.max(updatedItems.length - 1, 0)
        );

  const updated: Stocktake = {
    ...existing,
    items: updatedItems,
    currentIndex: safeNextIndex,
    updatedAt: now(),
  };

  saveStocktakes(
    currentStocktakes.map((stocktake) =>
      stocktake.id === stocktakeId
        ? updated
        : stocktake
    )
  );

  return updated;
}

export function setStocktakeCurrentIndex(
  stocktakeId: string,
  currentIndex: number
): Stocktake {
  const currentStocktakes = getStocktakes();

  const existing =
    currentStocktakes.find(
      (stocktake) =>
        stocktake.id === stocktakeId
    );

  if (!existing) {
    throw new Error("Stocktake not found.");
  }

  if (existing.status !== "In Progress") {
    return existing;
  }

  const updated: Stocktake = {
    ...existing,

    currentIndex: Math.min(
      Math.max(0, currentIndex),
      Math.max(existing.items.length - 1, 0)
    ),

    updatedAt: now(),
  };

  saveStocktakes(
    currentStocktakes.map((stocktake) =>
      stocktake.id === stocktakeId
        ? updated
        : stocktake
    )
  );

  return updated;
}

export function completeStocktake(
  stocktakeId: string,
  completedBy: string
): Stocktake {
  if (!completedBy.trim()) {
    throw new Error(
      "The person completing the stocktake is missing."
    );
  }

  const currentStocktakes = getStocktakes();

  const existing =
    currentStocktakes.find(
      (stocktake) =>
        stocktake.id === stocktakeId
    );

  if (!existing) {
    throw new Error("Stocktake not found.");
  }

  if (existing.status === "Completed") {
    throw new Error(
      "This stocktake has already been completed."
    );
  }

  const uncounted =
    existing.items.filter(
      (item) =>
        item.countedQuantity === null
    );

  if (uncounted.length > 0) {
    throw new Error(
      `${uncounted.length} ${
        uncounted.length === 1
          ? "product has"
          : "products have"
      } not been counted.`
    );
  }

  const productTotals =
    new Map<
      number,
      {
        productId: number;
        productName: string;
        inventoryUnit: string;
        expected: number;
        counted: number;
      }
    >();

  existing.items.forEach(
    (item) => {
      const current =
        productTotals.get(
          item.productId
        ) ?? {
          productId:
            item.productId,

          productName:
            item.productName,

          inventoryUnit:
            item.inventoryUnit,

          expected: 0,
          counted: 0,
        };

      current.expected +=
        item.expectedQuantity;

      current.counted +=
        item.countedQuantity ?? 0;

      productTotals.set(
        item.productId,
        current
      );
    }
  );

  const movements =
    Array.from(
      productTotals.values()
    )
      .map((item) => ({
        ...item,
        difference:
          item.counted -
          item.expected,
      }))
      .filter(
        ({ difference }) =>
          difference !== 0
      )
      .map(
        ({
          difference,
          ...item
        }) => ({
          businessId:
            existing.businessId,

          siteId:
            existing.siteId,

          productId:
            item.productId,

          productName:
            item.productName,

          quantity:
            difference,

          movementType:
            "Stocktake" as const,

          referenceId:
            existing.id,

          referenceNumber:
            `${existing.stocktakeNumber} • Total counted ${item.counted} ${item.inventoryUnit}`,
        })
      );

  if (movements.length > 0) {
    addInventoryMovements(movements);
  }

  const timestamp = now();

  const completed: Stocktake = {
    ...existing,

    status: "Completed",

    completedBy:
      completedBy.trim(),

    completedAt: timestamp,
    updatedAt: timestamp,
  };

  saveStocktakes(
    currentStocktakes.map((stocktake) =>
      stocktake.id === stocktakeId
        ? completed
        : stocktake
    )
  );

  return completed;
}

export function subscribeToStocktakeChanges(
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
    STOCKTAKES_CHANGED_EVENT,
    handleLocalChange
  );

  window.addEventListener(
    "storage",
    handleStorageChange
  );

  return () => {
    window.removeEventListener(
      STOCKTAKES_CHANGED_EVENT,
      handleLocalChange
    );

    window.removeEventListener(
      "storage",
      handleStorageChange
    );
  };
}

export function getReadableFrequency(
  frequency: StocktakeFrequency
): string {
  return {
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    "every-4-weeks": "Every 4 Weeks",
    quarterly: "Quarterly",
    manual: "Manual",
  }[frequency];
}

export function isDateWithinPeriod(
  date: Date,
  period: StocktakePeriod
): boolean {
  const value = toDateKey(date);

  return (
    value >= period.start &&
    value <= period.end
  );
}

export function parseStocktakePeriodDate(
  value: string
): Date {
  return parseDateKey(value);
}
