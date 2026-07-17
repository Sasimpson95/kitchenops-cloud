import type { RecipeUnit } from "@/lib/unitConversion";

export type RecipeIngredient = {
  productId: number;
  quantity: number;
  unit?: RecipeUnit;
};

export type RecipeComponent = {
  recipeName: string;
  quantity: number;
};

export type Recipe = {
  name: string;
  emoji: string;
  yield: string;
  prepTime: string;
  shelfLife: string;
  allergens: string[];
  ingredients: RecipeIngredient[];
  components?: RecipeComponent[];
  method: string[];
};

const STORAGE_KEY = "kitchenops-recipes";
const RECIPES_CHANGED_EVENT =
  "kitchenops-recipes-changed";

export const recipes: Recipe[] = [];

function cloneStarterRecipes(): Recipe[] {
  return JSON.parse(
    JSON.stringify(recipes)
  ) as Recipe[];
}

function emitRecipesChanged(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(
      RECIPES_CHANGED_EVENT
    )
  );
}

function initialiseRecipes(): Recipe[] {
  const initialRecipes: Recipe[] = [];

  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(initialRecipes)
    );
  }

  return initialRecipes;
}

export function getRecipes(): Recipe[] {
  if (typeof window === "undefined") {
    return [];
  }

  const savedRecipes =
    window.localStorage.getItem(
      STORAGE_KEY
    );

  if (!savedRecipes) {
    return initialiseRecipes();
  }

  try {
    const parsedRecipes: unknown =
      JSON.parse(savedRecipes);

    if (!Array.isArray(parsedRecipes)) {
      return initialiseRecipes();
    }

    return parsedRecipes as Recipe[];
  } catch {
    return initialiseRecipes();
  }
}

export function saveRecipes(
  updatedRecipes: Recipe[]
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(updatedRecipes)
  );

  emitRecipesChanged();
}

export function addRecipe(
  recipe: Recipe
): Recipe {
  const currentRecipes = getRecipes();

  const normalisedName = recipe.name
    .trim()
    .toLowerCase();

  const alreadyExists =
    currentRecipes.some(
      (existingRecipe) =>
        existingRecipe.name
          .trim()
          .toLowerCase() ===
        normalisedName
    );

  if (alreadyExists) {
    throw new Error(
      "A recipe with this name already exists."
    );
  }

  const cleanedRecipe: Recipe = {
    ...recipe,

    name: recipe.name.trim(),

    emoji:
      recipe.emoji.trim() || "🍽️",

    yield: recipe.yield.trim(),

    prepTime:
      recipe.prepTime.trim(),

    shelfLife:
      recipe.shelfLife.trim(),

    allergens: recipe.allergens
      .map((allergen) =>
        allergen.trim()
      )
      .filter(Boolean),

    ingredients:
      recipe.ingredients.filter(
        (ingredient) =>
          ingredient.productId > 0 &&
          Number.isFinite(
            ingredient.quantity
          ) &&
          ingredient.quantity > 0
      ),

    components:
      (recipe.components ?? [])
        .map((component) => ({
          recipeName:
            component.recipeName.trim(),

          quantity:
            Number(component.quantity),
        }))
        .filter(
          (component) =>
            Boolean(
              component.recipeName
            ) &&
            Number.isFinite(
              component.quantity
            ) &&
            component.quantity > 0
        ),

    method: recipe.method
      .map((step) => step.trim())
      .filter(Boolean),
  };

  saveRecipes([
    ...currentRecipes,
    cleanedRecipe,
  ]);

  return cleanedRecipe;
}

export function updateRecipe(
  originalName: string,
  recipe: Recipe
): Recipe {
  const currentRecipes = getRecipes();

  const existingIndex =
    currentRecipes.findIndex(
      (existingRecipe) =>
        existingRecipe.name
          .trim()
          .toLowerCase() ===
        originalName
          .trim()
          .toLowerCase()
    );

  if (existingIndex < 0) {
    throw new Error(
      "Recipe not found."
    );
  }

  const cleanedRecipe: Recipe = {
    ...recipe,

    name: recipe.name.trim(),

    emoji:
      recipe.emoji.trim() ||
      "🍽️",

    yield:
      recipe.yield.trim(),

    prepTime:
      recipe.prepTime.trim(),

    shelfLife:
      recipe.shelfLife.trim(),

    allergens:
      recipe.allergens
        .map((allergen) =>
          allergen.trim()
        )
        .filter(Boolean),

    ingredients:
      recipe.ingredients.filter(
        (ingredient) =>
          ingredient.productId > 0 &&
          Number.isFinite(
            ingredient.quantity
          ) &&
          ingredient.quantity > 0
      ),

    method:
      recipe.method
        .map((step) =>
          step.trim()
        )
        .filter(Boolean),
  };

  const duplicate =
    currentRecipes.some(
      (existingRecipe, index) =>
        index !== existingIndex &&
        existingRecipe.name
          .trim()
          .toLowerCase() ===
        cleanedRecipe.name
          .trim()
          .toLowerCase()
    );

  if (duplicate) {
    throw new Error(
      "A recipe with this name already exists."
    );
  }

  const updatedRecipes =
    currentRecipes.map(
      (existingRecipe, index) =>
        index === existingIndex
          ? cleanedRecipe
          : existingRecipe
    );

  saveRecipes(updatedRecipes);

  return cleanedRecipe;
}

export function findRecipe(
  name: string
): Recipe | undefined {
  return getRecipes().find(
    (recipe) =>
      recipe.name
        .trim()
        .toLowerCase() ===
      name.trim().toLowerCase()
  );
}

export function subscribeToRecipeChanges(
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
    RECIPES_CHANGED_EVENT,
    handleLocalChange
  );

  window.addEventListener(
    "storage",
    handleStorageChange
  );

  return () => {
    window.removeEventListener(
      RECIPES_CHANGED_EVENT,
      handleLocalChange
    );

    window.removeEventListener(
      "storage",
      handleStorageChange
    );
  };
}
