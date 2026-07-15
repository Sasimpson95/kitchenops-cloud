export type RecipeUnit =
  | "Each"
  | "Portion"
  | "g"
  | "Kg"
  | "ml"
  | "Litre";

export const RECIPE_UNITS: RecipeUnit[] = [
  "Each",
  "Portion",
  "g",
  "Kg",
  "ml",
  "Litre",
];

type UnitFamily = "count" | "weight" | "volume";

function normaliseUnit(value: string): RecipeUnit | null {
  const unit = value.trim().toLowerCase();

  if (["each", "ea", "unit", "units"].includes(unit)) return "Each";
  if (["portion", "portions"].includes(unit)) return "Portion";
  if (["g", "gram", "grams"].includes(unit)) return "g";
  if (["kg", "kilogram", "kilograms"].includes(unit)) return "Kg";
  if (["ml", "millilitre", "millilitres", "milliliter", "milliliters"].includes(unit)) return "ml";
  if (["l", "litre", "litres", "liter", "liters"].includes(unit)) return "Litre";

  return null;
}

function family(unit: RecipeUnit): UnitFamily {
  if (unit === "g" || unit === "Kg") return "weight";
  if (unit === "ml" || unit === "Litre") return "volume";
  return "count";
}

function toBase(quantity: number, unit: RecipeUnit): number {
  if (unit === "Kg" || unit === "Litre") return quantity * 1000;
  return quantity;
}

function fromBase(quantity: number, unit: RecipeUnit): number {
  if (unit === "Kg" || unit === "Litre") return quantity / 1000;
  return quantity;
}

export type UnitConversionResult = {
  convertedQuantity: number;
  fromUnit: RecipeUnit;
  toUnit: RecipeUnit;
  compatible: boolean;
  warning?: string;
};

export function convertRecipeQuantity(
  quantity: number,
  fromUnitValue: string,
  inventoryUnitValue: string
): UnitConversionResult {
  const fromUnit = normaliseUnit(fromUnitValue);
  const toUnit = normaliseUnit(inventoryUnitValue);

  if (!fromUnit || !toUnit) {
    return {
      convertedQuantity: quantity,
      fromUnit: fromUnit ?? "Each",
      toUnit: toUnit ?? "Each",
      compatible: false,
      warning: `Unit conversion is not configured for ${fromUnitValue} → ${inventoryUnitValue}.`,
    };
  }

  if (family(fromUnit) !== family(toUnit)) {
    return {
      convertedQuantity: quantity,
      fromUnit,
      toUnit,
      compatible: false,
      warning: `${fromUnit} cannot be converted to ${toUnit}.`,
    };
  }

  return {
    convertedQuantity: fromBase(toBase(quantity, fromUnit), toUnit),
    fromUnit,
    toUnit,
    compatible: true,
  };
}

export function defaultRecipeUnit(inventoryUnit: string): RecipeUnit {
  return normaliseUnit(inventoryUnit) ?? "Each";
}
