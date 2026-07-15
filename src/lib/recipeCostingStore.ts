import {
  getRecipes,
  type Recipe,
} from "@/data/recipes";
import type { Product } from "@/data/products";
import {
  convertRecipeQuantity,
  defaultRecipeUnit,
  type RecipeUnit,
} from "@/lib/unitConversion";

const SETTINGS_KEY = "kitchenops-recipe-costing-settings";
const HISTORY_KEY = "kitchenops-recipe-cost-history";
const COSTING_CHANGED_EVENT = "kitchenops-recipe-costing-changed";

export type RecipeType =
  | "preparation"
  | "menu-item";

export type RecipeCostingSettings = {
  recipeName: string;

  recipeType: RecipeType;

  salesCode: string;

  portions: number;
  yieldUnit: string;
  portionSize: string;
  sellingPrice: number;
  targetGrossProfitPercentage: number;
  active: boolean;
  extraAllergens: string[];
  ingredientUnits: Record<string, RecipeUnit>;
  updatedAt: string;
};

export type IngredientCostLine = {
  productId: number;
  productName: string;
  recipeQuantity: number;
  recipeUnit: RecipeUnit;
  convertedQuantity: number;
  inventoryUnit: string;
  unitCost: number;
  lineCost: number;
  purchasePrice: number;
  purchaseQuantity: number;
  purchaseUnit: string;
  warning?: string;
};

export type RecipeComponentCostLine = {
  recipeName: string;
  quantity: number;
  yieldUnit: string;
  unitCost: number;
  lineCost: number;
  warning?: string;
};

export type RecipeCostingResult = {
  ingredientLines: IngredientCostLine[];
  componentLines: RecipeComponentCostLine[];
  totalRecipeCost: number;
  costPerPortion: number;
  sellingPrice: number;
  foodCostPercentage: number;
  grossProfitValue: number;
  grossProfitPercentage: number;
  targetGrossProfitPercentage: number;
  targetSellingPrice: number;
  warnings: string[];
  allergens: string[];
  completeIngredientLines: number;

  recipeType: RecipeType;
  yieldQuantity: number;
  yieldUnit: string;
  costPerYieldUnit: number;
};

export type RecipeCostHistoryRecord = {
  id: string;
  recipeName: string;
  totalRecipeCost: number;
  costPerPortion: number;
  sellingPrice: number;
  grossProfitPercentage: number;
  createdAt: string;
};

function now(): string { return new Date().toISOString(); }
function createId(): string {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
function emitChanged(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(COSTING_CHANGED_EVENT));
}

function normaliseSettings(value: Partial<RecipeCostingSettings> & { recipeName: string }): RecipeCostingSettings {
  return {
    recipeName: value.recipeName.trim(),

    recipeType:
      value.recipeType === "preparation"
        ? "preparation"
        : "menu-item",

    salesCode:
      value.recipeType === "preparation"
        ? ""
        : value.salesCode?.trim() || "",

    portions: Math.max(
      1,
      Number(value.portions) || 1
    ),

    yieldUnit:
      value.yieldUnit?.trim() ||
      (
        value.recipeType === "preparation"
          ? "batch"
          : "portion"
      ),

    portionSize:
      value.portionSize?.trim() ||
      "1 portion",
    sellingPrice: Math.max(0, Number(value.sellingPrice) || 0),
    targetGrossProfitPercentage: Math.min(99.9, Math.max(0, Number(value.targetGrossProfitPercentage) || 70)),
    active: typeof value.active === "boolean" ? value.active : true,
    extraAllergens: Array.isArray(value.extraAllergens)
      ? Array.from(new Set(value.extraAllergens.map(String).map((item) => item.trim()).filter(Boolean)))
      : [],
    ingredientUnits: value.ingredientUnits && typeof value.ingredientUnits === "object"
      ? value.ingredientUnits
      : {},
    updatedAt: value.updatedAt || now(),
  };
}

export function getRecipeCostingSettings(): RecipeCostingSettings[] {
  if (typeof window === "undefined") return [];
  const saved = window.localStorage.getItem(SETTINGS_KEY);
  if (!saved) return [];
  try {
    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((value): value is Partial<RecipeCostingSettings> & { recipeName: string } =>
        Boolean(value && typeof value === "object" && "recipeName" in value && typeof value.recipeName === "string"))
      .map(normaliseSettings);
  } catch { return []; }
}

export function getRecipeCostingSetting(recipeName: string): RecipeCostingSettings {
  return getRecipeCostingSettings().find((setting) =>
    setting.recipeName.trim().toLowerCase() === recipeName.trim().toLowerCase()) ?? {
      recipeName,
      recipeType: "menu-item",
      salesCode: "",
      portions: 1,
      yieldUnit: "portion",
      portionSize: "1 portion",
      sellingPrice: 0,
      targetGrossProfitPercentage: 70,
      active: true,
      extraAllergens: [],
      ingredientUnits: {},
      updatedAt: now(),
    };
}

export function saveRecipeCostingSetting(input: Omit<RecipeCostingSettings, "updatedAt">): RecipeCostingSettings {
  const setting = normaliseSettings({ ...input, updatedAt: now() });
  if (typeof window === "undefined") return setting;
  const current = getRecipeCostingSettings();

  if (
    setting.recipeType === "menu-item" &&
    setting.salesCode
  ) {
    const duplicateSalesCode =
      current.find(
        (item) =>
          item.recipeName
            .trim()
            .toLowerCase() !==
            setting.recipeName
              .trim()
              .toLowerCase() &&
          item.recipeType ===
            "menu-item" &&
          item.salesCode
            .trim()
            .toLowerCase() ===
            setting.salesCode
              .trim()
              .toLowerCase()
      );

    if (duplicateSalesCode) {
      throw new Error(
        `Sales Code ${setting.salesCode} is already assigned to ${duplicateSalesCode.recipeName}.`
      );
    }
  }
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify([
    ...current.filter((item) => item.recipeName.trim().toLowerCase() !== setting.recipeName.trim().toLowerCase()),
    setting,
  ]));
  emitChanged();
  return setting;
}

function calculateRecipeCostingInternal(
  recipe: Recipe,
  products: Product[],
  settings: RecipeCostingSettings,
  recipeStack: string[]
): RecipeCostingResult {
  const warnings: string[] = [];

  const normalisedName =
    recipe.name
      .trim()
      .toLowerCase();

  if (
    recipeStack.includes(
      normalisedName
    )
  ) {
    return {
      ingredientLines: [],
      componentLines: [],
      totalRecipeCost: 0,
      costPerPortion: 0,
      sellingPrice:
        settings.sellingPrice,
      foodCostPercentage: 0,
      grossProfitValue: 0,
      grossProfitPercentage: 0,
      targetGrossProfitPercentage:
        settings.targetGrossProfitPercentage,
      targetSellingPrice: 0,
      warnings: [
        `Recipe loop detected involving ${recipe.name}.`,
      ],
      allergens: [],
      completeIngredientLines: 0,
      recipeType:
        settings.recipeType,
      yieldQuantity:
        settings.portions,
      yieldUnit:
        settings.yieldUnit,
      costPerYieldUnit: 0,
    };
  }

  const nextStack = [
    ...recipeStack,
    normalisedName,
  ];

  const ingredientLines:
    IngredientCostLine[] =
    recipe.ingredients.map(
      (ingredient) => {
        const product =
          products.find(
            (item) =>
              item.id ===
              ingredient.productId
          );

        if (!product) {
          const warning =
            `Ingredient ${ingredient.productId} is not linked to a product.`;

          warnings.push(
            warning
          );

          return {
            productId:
              ingredient.productId,
            productName:
              "Missing product",
            recipeQuantity:
              ingredient.quantity,
            recipeUnit:
              ingredient.unit ??
              "Each",
            convertedQuantity:
              ingredient.quantity,
            inventoryUnit:
              "Unknown",
            unitCost: 0,
            lineCost: 0,
            purchasePrice: 0,
            purchaseQuantity: 0,
            purchaseUnit:
              "Unknown",
            warning,
          };
        }

        const recipeUnit =
          settings.ingredientUnits[
            String(product.id)
          ] ??
          ingredient.unit ??
          defaultRecipeUnit(
            product.inventoryUnit
          );

        const conversion =
          convertRecipeQuantity(
            ingredient.quantity,
            recipeUnit,
            product.inventoryUnit
          );

        let warning =
          conversion.warning;

        if (
          product.purchaseQuantity <=
          0
        ) {
          warning =
            `${product.name} has no valid purchase conversion.`;
        } else if (
          product.price <= 0
        ) {
          warning =
            `${product.name} has no purchase price.`;
        }

        if (warning) {
          warnings.push(
            warning
          );
        }

        const unitCost =
          product.purchaseQuantity >
          0
            ? product.price /
              product.purchaseQuantity
            : 0;

        const lineCost =
          warning &&
          !conversion.compatible
            ? 0
            : conversion.convertedQuantity *
              unitCost;

        return {
          productId:
            product.id,
          productName:
            product.name,
          recipeQuantity:
            ingredient.quantity,
          recipeUnit,
          convertedQuantity:
            conversion.convertedQuantity,
          inventoryUnit:
            product.inventoryUnit,
          unitCost,
          lineCost,
          purchasePrice:
            product.price,
          purchaseQuantity:
            product.purchaseQuantity,
          purchaseUnit:
            product.orderUnit,
          warning,
        };
      }
    );

  const allRecipes =
    getRecipes();

  const componentLines:
    RecipeComponentCostLine[] =
    (recipe.components ?? []).map(
      (component) => {
        const componentRecipe =
          allRecipes.find(
            (candidate) =>
              candidate.name
                .trim()
                .toLowerCase() ===
              component.recipeName
                .trim()
                .toLowerCase()
          );

        if (!componentRecipe) {
          const warning =
            `${component.recipeName} preparation could not be found.`;

          warnings.push(
            warning
          );

          return {
            recipeName:
              component.recipeName,
            quantity:
              component.quantity,
            yieldUnit:
              "unit",
            unitCost: 0,
            lineCost: 0,
            warning,
          };
        }

        const componentSettings =
          getRecipeCostingSetting(
            componentRecipe.name
          );

        const componentCosting =
          calculateRecipeCostingInternal(
            componentRecipe,
            products,
            componentSettings,
            nextStack
          );

        componentCosting.warnings.forEach(
          (warning) =>
            warnings.push(
              `${componentRecipe.name}: ${warning}`
            )
        );

        const unitCost =
          componentCosting.costPerYieldUnit;

        return {
          recipeName:
            componentRecipe.name,
          quantity:
            component.quantity,
          yieldUnit:
            componentSettings.yieldUnit,
          unitCost,
          lineCost:
            unitCost *
            component.quantity,
          warning:
            componentCosting.warnings
              .length > 0
              ? "Preparation costing needs attention"
              : undefined,
        };
      }
    );

  const totalRecipeCost =
    ingredientLines.reduce(
      (total, line) =>
        total +
        line.lineCost,
      0
    ) +
    componentLines.reduce(
      (total, line) =>
        total +
        line.lineCost,
      0
    );

  const costPerPortion =
    totalRecipeCost /
    Math.max(
      settings.portions,
      1
    );

  const sellingPrice =
    settings.sellingPrice;

  const foodCostPercentage =
    sellingPrice > 0
      ? (
          costPerPortion /
          sellingPrice
        ) * 100
      : 0;

  const grossProfitValue =
    sellingPrice -
    costPerPortion;

  const grossProfitPercentage =
    sellingPrice > 0
      ? (
          grossProfitValue /
          sellingPrice
        ) * 100
      : 0;

  const targetFoodCost =
    100 -
    settings.targetGrossProfitPercentage;

  const targetSellingPrice =
    targetFoodCost > 0
      ? costPerPortion /
        (
          targetFoodCost /
          100
        )
      : 0;

  if (
    settings.recipeType ===
      "menu-item" &&
    sellingPrice <= 0
  ) {
    warnings.push(
      "Selling price has not been set."
    );
  }

  if (
    settings.recipeType ===
      "menu-item" &&
    sellingPrice > 0 &&
    grossProfitPercentage <
      settings.targetGrossProfitPercentage
  ) {
    warnings.push(
      `GP is below the ${settings.targetGrossProfitPercentage.toFixed(
        1
      )}% target.`
    );
  }

  const componentAllergens =
    componentLines.flatMap(
      (line) => {
        const componentRecipe =
          allRecipes.find(
            (candidate) =>
              candidate.name ===
              line.recipeName
          );

        if (!componentRecipe) {
          return [];
        }

        const componentSettings =
          getRecipeCostingSetting(
            componentRecipe.name
          );

        return [
          ...componentRecipe.allergens,
          ...componentSettings.extraAllergens,
        ];
      }
    );

  return {
    ingredientLines,
    componentLines,
    totalRecipeCost,
    costPerPortion,
    sellingPrice,
    foodCostPercentage,
    grossProfitValue,
    grossProfitPercentage,
    targetGrossProfitPercentage:
      settings.targetGrossProfitPercentage,
    targetSellingPrice,
    warnings:
      Array.from(
        new Set(warnings)
      ),
    allergens:
      Array.from(
        new Set([
          ...recipe.allergens,
          ...settings.extraAllergens,
          ...componentAllergens,
        ])
      ).sort(),
    completeIngredientLines:
      ingredientLines.filter(
        (line) =>
          !line.warning
      ).length,
    recipeType:
      settings.recipeType,
    yieldQuantity:
      settings.portions,
    yieldUnit:
      settings.yieldUnit,
    costPerYieldUnit:
      totalRecipeCost /
      Math.max(
        settings.portions,
        1
      ),
  };
}

export function calculateRecipeCosting(
  recipe: Recipe,
  products: Product[],
  settings: RecipeCostingSettings
): RecipeCostingResult {
  return calculateRecipeCostingInternal(
    recipe,
    products,
    settings,
    []
  );
}

export function getRecipeCostHistory(recipeName?: string): RecipeCostHistoryRecord[] {
  if (typeof window === "undefined") return [];
  const saved = window.localStorage.getItem(HISTORY_KEY);
  if (!saved) return [];
  try {
    const records = JSON.parse(saved) as RecipeCostHistoryRecord[];
    return records
      .filter((record) => !recipeName || record.recipeName.toLowerCase() === recipeName.toLowerCase())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch { return []; }
}

export function recordRecipeCostSnapshot(recipeName: string, costing: RecipeCostingResult): RecipeCostHistoryRecord | null {
  if (typeof window === "undefined") return null;
  const current = getRecipeCostHistory();
  const latest = current.find((record) => record.recipeName.toLowerCase() === recipeName.toLowerCase());
  if (latest && Math.abs(latest.totalRecipeCost - costing.totalRecipeCost) < 0.0001 &&
      Math.abs(latest.costPerPortion - costing.costPerPortion) < 0.0001 &&
      Math.abs(latest.sellingPrice - costing.sellingPrice) < 0.0001) return null;

  const record: RecipeCostHistoryRecord = {
    id: createId(), recipeName,
    totalRecipeCost: costing.totalRecipeCost,
    costPerPortion: costing.costPerPortion,
    sellingPrice: costing.sellingPrice,
    grossProfitPercentage: costing.grossProfitPercentage,
    createdAt: now(),
  };
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify([record, ...current].slice(0, 1000)));
  emitChanged();
  return record;
}

export function subscribeToRecipeCostingChanges(callback: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const handle = () => callback();
  const handleStorage = (event: StorageEvent) => {
    if (event.key === SETTINGS_KEY || event.key === HISTORY_KEY) callback();
  };
  window.addEventListener(COSTING_CHANGED_EVENT, handle);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener(COSTING_CHANGED_EVENT, handle);
    window.removeEventListener("storage", handleStorage);
  };
}
