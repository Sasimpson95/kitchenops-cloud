export type StocktakeUnitSetup = {
  countUnit: string;
  inventoryUnit: string;
  inventoryUnitsPerCountUnit: number;
};

export function formatStocktakeNumber(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: 2,
  }).format(value);
}

export function displayUnit(unit: string, quantity?: number): string {
  const clean = unit.trim() || "Each";
  const normalised = clean.toLowerCase();

  if (normalised === "each") return "Each";
  if (quantity === undefined || Math.abs(quantity - 1) < 0.000001) {
    return clean;
  }

  const knownPlurals: Record<string, string> = {
    bottle: "Bottles",
    case: "Cases",
    pack: "Packs",
    bag: "Bags",
    box: "Boxes",
    tub: "Tubs",
    tray: "Trays",
    tin: "Tins",
    can: "Cans",
    litre: "Litres",
    liter: "Liters",
    kilogram: "Kilograms",
    gram: "Grams",
  };

  return knownPlurals[normalised] ?? `${clean}s`;
}

export function hasUnitConversion(setup: StocktakeUnitSetup): boolean {
  return (
    setup.countUnit.trim().toLowerCase() !==
      setup.inventoryUnit.trim().toLowerCase() ||
    Math.abs(setup.inventoryUnitsPerCountUnit - 1) > 0.000001
  );
}

export function usesLooseEachCounting(setup: StocktakeUnitSetup): boolean {
  return (
    hasUnitConversion(setup) &&
    setup.inventoryUnit.trim().toLowerCase() === "each" &&
    setup.inventoryUnitsPerCountUnit > 1
  );
}

export function toInventoryQuantity(
  countQuantity: number,
  inventoryUnitsPerCountUnit: number
): number {
  return countQuantity * inventoryUnitsPerCountUnit;
}

export function splitLooseEachCount(
  countQuantity: number,
  inventoryUnitsPerCountUnit: number
): { fullCountUnits: number; looseEach: number } {
  const safeFactor = Math.max(inventoryUnitsPerCountUnit, 1);
  const totalEach = Math.max(0, Math.round(countQuantity * safeFactor));
  const fullCountUnits = Math.floor(totalEach / safeFactor);
  const looseEach = totalEach - fullCountUnits * safeFactor;

  return { fullCountUnits, looseEach };
}

export function combineLooseEachCount(
  fullCountUnits: number,
  looseEach: number,
  inventoryUnitsPerCountUnit: number
): number {
  const safeFactor = Math.max(inventoryUnitsPerCountUnit, 1);
  return Math.max(0, fullCountUnits) + Math.max(0, looseEach) / safeFactor;
}

export function formatCountQuantity(
  countQuantity: number,
  setup: StocktakeUnitSetup
): string {
  if (usesLooseEachCounting(setup)) {
    const { fullCountUnits, looseEach } = splitLooseEachCount(
      countQuantity,
      setup.inventoryUnitsPerCountUnit
    );

    const parts = [
      `${formatStocktakeNumber(fullCountUnits)} ${displayUnit(
        setup.countUnit,
        fullCountUnits
      )}`,
    ];

    if (looseEach > 0) {
      parts.push(`${formatStocktakeNumber(looseEach)} Each`);
    }

    return parts.join(" + ");
  }

  return `${formatStocktakeNumber(countQuantity)} ${displayUnit(
    setup.countUnit,
    countQuantity
  )}`;
}

export function formatInventoryEquivalent(
  countQuantity: number,
  setup: StocktakeUnitSetup
): string {
  const inventoryQuantity = toInventoryQuantity(
    countQuantity,
    setup.inventoryUnitsPerCountUnit
  );

  return `${formatStocktakeNumber(inventoryQuantity)} ${displayUnit(
    setup.inventoryUnit,
    inventoryQuantity
  )}`;
}
