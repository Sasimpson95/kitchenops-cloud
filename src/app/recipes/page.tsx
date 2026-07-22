"use client";

import {
  Archive,
  Calculator,
  Edit3,
  Plus,
  Search,
  X,
} from "lucide-react";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import ProtectedPage from "@/components/ProtectedPage";

import NewRecipeModal from "@/components/recipes/NewRecipeModal";
import RecipeComponentCosts from "@/components/recipes/RecipeComponentCosts";
import RecipeCostHistory from "@/components/recipes/RecipeCostHistory";
import RecipeCostSummary from "@/components/recipes/RecipeCostSummary";
import RecipeIngredientCosts from "@/components/recipes/RecipeIngredientCosts";

import type {
  User,
} from "@/config/roles";

import type {
  Recipe,
} from "@/data/recipes";

import {
  getRecipes,
  subscribeToRecipeChanges,
  updateRecipe,
} from "@/data/recipes";

import type {
  Product,
} from "@/data/products";

import {
  getCurrentUser,
} from "@/lib/currentUser";

import {
  getProducts,
  subscribeToProductChanges,
} from "@/lib/productStore";

import {
  calculateRecipeCosting,
  getRecipeCostHistory,
  getRecipeCostingSetting,
  recordRecipeCostSnapshot,
  saveRecipeCostingSetting,
  subscribeToRecipeCostingChanges,
  type RecipeCostingSettings,
  type RecipeType,
} from "@/lib/recipeCostingStore";

import { RECIPE_UNITS, defaultRecipeUnit, type RecipeUnit } from "@/lib/unitConversion";

const COMMON_ALLERGENS = [
  "Celery",
  "Cereals containing gluten",
  "Crustaceans",
  "Eggs",
  "Fish",
  "Lupin",
  "Milk",
  "Molluscs",
  "Mustard",
  "Nuts",
  "Peanuts",
  "Sesame",
  "Soya",
  "Sulphites",
];

function money(
  value: number
): string {
  return new Intl.NumberFormat(
    "en-GB",
    {
      style: "currency",
      currency: "GBP",
    }
  ).format(value);
}

function RecipeSettingsModal({
  recipe,
  initial,
  products,
  onClose,
}: {
  recipe: Recipe;
  initial: RecipeCostingSettings;
  products: Product[];
  onClose: () => void;
}) {
  const [
    recipeType,
    setRecipeType,
  ] = useState<RecipeType>(
    initial.recipeType
  );

  const [
    category,
    setCategory,
  ] = useState(
    recipe.category ||
      "Uncategorised"
  );

  const [
    salesCode,
    setSalesCode,
  ] = useState(
    initial.salesCode
  );

  const [
    portions,
    setPortions,
  ] = useState(
    initial.portions
  );

  const [
    yieldUnit,
    setYieldUnit,
  ] = useState(
    initial.yieldUnit
  );

  const [
    portionSize,
    setPortionSize,
  ] = useState(
    initial.portionSize
  );

  const [
    sellingPrice,
    setSellingPrice,
  ] = useState(
    initial.sellingPrice
  );

  const [
    targetGp,
    setTargetGp,
  ] = useState(
    initial.targetGrossProfitPercentage
  );

  const [
    active,
    setActive,
  ] = useState(
    initial.active
  );

  const [
    extraAllergens,
    setExtraAllergens,
  ] = useState<string[]>(
    initial.extraAllergens
  );

  const [ingredientUnits, setIngredientUnits] = useState<Record<string, RecipeUnit>>(
    initial.ingredientUnits
  );

  const [
    ingredientQuantities,
    setIngredientQuantities,
  ] = useState<Record<string, number>>(
    Object.fromEntries(
      recipe.ingredients.map(
        (ingredient) => [
          String(ingredient.productId),
          ingredient.quantity,
        ]
      )
    )
  );

  const [
    methodSteps,
    setMethodSteps,
  ] = useState<string[]>(
    recipe.method.length > 0
      ? [...recipe.method]
      : [""]
  );

  const [error, setError] =
    useState("");

  function toggleAllergen(
    allergen: string
  ): void {
    setExtraAllergens(
      (current) =>
        current.includes(
          allergen
        )
          ? current.filter(
              (item) =>
                item !==
                allergen
            )
          : [
              ...current,
              allergen,
            ]
    );
  }

  function save(): void {
    if (
      !Number.isFinite(
        portions
      ) ||
      portions <= 0
    ) {
      setError(
        "Yield must be greater than zero."
      );
      return;
    }

    if (
      !Number.isFinite(
        sellingPrice
      ) ||
      sellingPrice < 0
    ) {
      setError(
        "Enter a valid selling price."
      );
      return;
    }

    const updatedIngredients =
      recipe.ingredients.map(
        (ingredient) => ({
          ...ingredient,

          quantity: Number(
            ingredientQuantities[
              String(ingredient.productId)
            ]
          ),

          unit:
            ingredientUnits[
              String(ingredient.productId)
            ] ??
            ingredient.unit,
        })
      );

    if (
      updatedIngredients.some(
        (ingredient) =>
          !Number.isFinite(
            ingredient.quantity
          ) ||
          ingredient.quantity <= 0
      )
    ) {
      setError(
        "Every ingredient needs an amount greater than zero."
      );
      return;
    }

    updateRecipe(
      recipe.name,
      {
        ...recipe,
        category:
          category.trim() ||
          "Uncategorised",
        ingredients:
          updatedIngredients,
        method:
          methodSteps
            .map((step) =>
              step.trim()
            )
            .filter(Boolean),
      }
    );

    saveRecipeCostingSetting({
      recipeName:
        recipe.name,

      recipeType,

      salesCode:
        recipeType ===
        "menu-item"
          ? salesCode.trim()
          : "",

      portions,

      yieldUnit:
        yieldUnit.trim() ||
        (
          recipeType ===
          "preparation"
            ? "batch"
            : "portion"
        ),

      portionSize,

      sellingPrice,

      targetGrossProfitPercentage:
        targetGp,

      active,

      extraAllergens,
      ingredientUnits,
    });

    onClose();
  }

  return (
    <div
      className="mobile-native-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm"
    >
      <div
        data-mobile-sheet="true" role="dialog" aria-modal="true" className="mobile-native-sheet max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-7 shadow-2xl"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-semibold text-violet-800">
              Recipe Costing
            </p>

            <h2 className="mt-1 text-2xl font-bold text-gray-950">
              {recipe.name}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            data-dialog-close="true" aria-label="Close" className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="text-sm font-semibold text-gray-700">
              Recipe Type
            </span>

            <select
              value={recipeType}
              onChange={(event) => {
                const nextType =
                  event.target
                    .value as RecipeType;

                setRecipeType(
                  nextType
                );

                if (
                  nextType ===
                  "preparation" &&
                  (
                    !yieldUnit.trim() ||
                    yieldUnit ===
                      "portion"
                  )
                ) {
                  setYieldUnit(
                    "batch"
                  );
                }

                if (
                  nextType ===
                  "menu-item" &&
                  (
                    !yieldUnit.trim() ||
                    yieldUnit ===
                      "batch"
                  )
                ) {
                  setYieldUnit(
                    "portion"
                  );
                }
              }}
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-violet-800"
            >
              <option value="preparation">
                Preparation / Component
              </option>

              <option value="menu-item">
                Finished Menu Item
              </option>
            </select>

            <p className="mt-2 text-xs text-gray-500">
              {recipeType ===
              "preparation"
                ? "Use this for mixes, sauces, batters and other items used inside a finished dish."
                : "Use this for a dish or product sold directly to the customer."}
            </p>
          </label>

          <label>
            <span className="text-sm font-semibold text-gray-700">
              {recipeType ===
              "preparation"
                ? "Recipe Yield"
                : "Yield / Portions"}
            </span>

            <input
              type="number"
              min={1}
              step="1"
              value={portions}
              onChange={(event) =>
                setPortions(
                  Number(
                    event.target
                      .value
                  )
                )
              }
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-violet-800"
            />
          </label>

          <label>
            <span className="text-sm font-semibold text-gray-700">
              Yield Unit
            </span>

            <input
              value={yieldUnit}
              onChange={(event) =>
                setYieldUnit(
                  event.target
                    .value
                )
              }
              placeholder={
                recipeType ===
                "preparation"
                  ? "Batch"
                  : "Portion"
              }
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-violet-800"
            />
          </label>

          <label>
            <span className="text-sm font-semibold text-gray-700">
              Portion / Yield Description
            </span>

            <input
              value={portionSize}
              onChange={(event) =>
                setPortionSize(
                  event.target
                    .value
                )
              }
              placeholder={
                recipeType ===
                "preparation"
                  ? "Example: 1 tub or 2 litres"
                  : "Example: 1 serving"
              }
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-violet-800"
            />
          </label>

          {recipeType ===
          "menu-item" ? (
            <>
              <label className="sm:col-span-2">
                <span className="text-sm font-semibold text-gray-700">
                  Sales Code (Optional)
                </span>

                <input
                  value={salesCode}
                  onChange={(event) =>
                    setSalesCode(
                      event.target.value
                    )
                  }
                  placeholder="Example: PAN001 or POS item ID"
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-violet-800"
                />

                <p className="mt-2 text-xs text-gray-500">
                  This is the code KitchenOps will use to match future POS sales to this menu item.
                </p>
              </label>

              <label>
                <span className="text-sm font-semibold text-gray-700">
                  Selling Price Per Portion
                </span>

                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={
                    sellingPrice
                  }
                  onChange={(event) =>
                    setSellingPrice(
                      Number(
                        event.target
                          .value
                      )
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-violet-800"
                />
              </label>

              <label>
                <span className="text-sm font-semibold text-gray-700">
                  Target GP %
                </span>

                <input
                  type="number"
                  min={0}
                  max={99.9}
                  step="0.1"
                  value={targetGp}
                  onChange={(event) =>
                    setTargetGp(
                      Number(
                        event.target
                          .value
                      )
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-violet-800"
                />
              </label>
            </>
          ) : (
            <div className="rounded-2xl bg-violet-50 p-4 sm:col-span-2">
              <p className="font-semibold text-violet-950">
                No selling price needed
              </p>

              <p className="mt-1 text-sm text-violet-800">
                KitchenOps will calculate the total recipe cost and cost per {yieldUnit || "batch"}. Selling price and GP belong on the finished menu item that uses this preparation.
              </p>
            </div>
          )}
        </div>

        <section className="mt-6 rounded-2xl bg-slate-50 p-5">
          <h3 className="font-bold text-gray-950">
            Ingredients
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Change the amount and unit used in this recipe.
          </p>

          <div className="mt-4 space-y-3">
            {recipe.ingredients.map(
              (ingredient) => {
                const product =
                  products.find(
                    (item) =>
                      item.id ===
                      ingredient.productId
                  );

                if (!product) {
                  return null;
                }

                const key = String(
                  product.id
                );

                const selectedUnit =
                  ingredientUnits[key] ??
                  ingredient.unit ??
                  defaultRecipeUnit(
                    product.inventoryUnit
                  );

                return (
                  <div
                    key={product.id}
                    className="grid gap-3 rounded-xl bg-white p-4 sm:grid-cols-[1fr_130px_150px] sm:items-end"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">
                        {product.name}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        Inventory unit {product.inventoryUnit}
                      </p>
                    </div>

                    <label>
                      <span className="text-xs font-semibold text-gray-600">
                        Amount
                      </span>

                      <input
                        type="number"
                        min={0.0001}
                        step="0.01"
                        value={
                          ingredientQuantities[key] ??
                          ingredient.quantity
                        }
                        onChange={(event) =>
                          setIngredientQuantities(
                            (current) => ({
                              ...current,
                              [key]: Number(
                                event.target.value
                              ),
                            })
                          )
                        }
                        className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-violet-800"
                      />
                    </label>

                    <label>
                      <span className="text-xs font-semibold text-gray-600">
                        Unit
                      </span>

                      <select
                        value={selectedUnit}
                        onChange={(event) =>
                          setIngredientUnits(
                            (current) => ({
                              ...current,
                              [key]: event.target.value as RecipeUnit,
                            })
                          )
                        }
                        className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-violet-800"
                      >
                        {RECIPE_UNITS.map(
                          (unit) => (
                            <option
                              key={unit}
                              value={unit}
                            >
                              {unit}
                            </option>
                          )
                        )}
                      </select>
                    </label>
                  </div>
                );
              }
            )}
          </div>
        </section>

        <section className="mt-6 rounded-2xl bg-slate-50 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-gray-950">
                Method
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Add, edit or remove preparation steps.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setMethodSteps(
                  (current) => [
                    ...current,
                    "",
                  ]
                )
              }
              className="rounded-xl border border-violet-800 px-4 py-2 text-sm font-semibold text-violet-800 hover:bg-violet-50"
            >
              Add Step
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {methodSteps.map(
              (step, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3"
                >
                  <span className="mt-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-900">
                    {index + 1}
                  </span>

                  <textarea
                    value={step}
                    onChange={(event) =>
                      setMethodSteps(
                        (current) =>
                          current.map(
                            (value, stepIndex) =>
                              stepIndex === index
                                ? event.target.value
                                : value
                          )
                      )
                    }
                    rows={2}
                    className="min-w-0 flex-1 rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-violet-800"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setMethodSteps(
                        (current) =>
                          current.length === 1
                            ? [""]
                            : current.filter(
                                (_, stepIndex) =>
                                  stepIndex !== index
                              )
                      )
                    }
                    className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-200 text-red-700 hover:bg-red-50"
                    aria-label="Remove method step"
                  >
                    <X size={17} />
                  </button>
                </div>
              )
            )}
          </div>
        </section>

        <section className="mt-6 rounded-2xl bg-slate-50 p-5">
          <h3 className="font-bold text-gray-950">
            Additional Allergens
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Recipe allergens already listed in the recipe remain included.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {COMMON_ALLERGENS.map(
              (allergen) => (
                <label
                  key={allergen}
                  className="flex cursor-pointer items-center gap-3 rounded-xl bg-white p-3"
                >
                  <input
                    type="checkbox"
                    checked={extraAllergens.includes(
                      allergen
                    )}
                    onChange={() =>
                      toggleAllergen(
                        allergen
                      )
                    }
                    className="h-5 w-5 accent-violet-800"
                  />

                  <span className="text-sm font-semibold text-gray-700">
                    {allergen}
                  </span>
                </label>
              )
            )}
          </div>
        </section>

        <label className="mt-6 flex cursor-pointer items-center justify-between rounded-2xl border border-gray-200 p-5">
          <div>
            <p className="font-bold text-gray-950">
              Active Recipe
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Archived recipes remain available historically but are marked inactive.
            </p>
          </div>

          <input
            type="checkbox"
            checked={active}
            onChange={(event) =>
              setActive(
                event.target
                  .checked
              )
            }
            className="h-6 w-6 accent-violet-800"
          />
        </label>

        {error && (
          <p className="mt-5 rounded-xl bg-red-50 p-4 font-semibold text-red-700">
            {error}
          </p>
        )}

        <div className="mt-7 flex justify-end gap-3 border-t pt-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={save}
            className="rounded-xl bg-violet-800 px-6 py-3 font-semibold text-white hover:bg-violet-900"
          >
            Save Costing
          </button>
        </div>
      </div>
    </div>
  );
}

function RecipesContent() {
  const router =
    useRouter();

  const searchParams =
    useSearchParams();

  const [
    currentUser,
    setCurrentUser,
  ] = useState<User | null>(
    null
  );

  const [
    recipes,
    setRecipes,
  ] = useState<Recipe[]>(
    []
  );

  const [
    products,
    setProducts,
  ] = useState<Product[]>(
    []
  );

  const [
    selectedRecipeName,
    setSelectedRecipeName,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    showArchived,
    setShowArchived,
  ] = useState(false);

  const [
    editingRecipe,
    setEditingRecipe,
  ] = useState<Recipe | null>(
    null
  );

  const [
    showNewRecipe,
    setShowNewRecipe,
  ] = useState(false);

  const [
    version,
    setVersion,
  ] = useState(0);

  const refresh =
    useCallback(() => {
      setRecipes(
        getRecipes()
      );

      setProducts(
        getProducts()
      );

      setVersion(
        (value) =>
          value + 1
      );
    }, []);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const user =
      getCurrentUser();

    if (!user) {
      router.replace(
        "/login"
      );
      return;
    }

    setCurrentUser(user);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [router]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    refresh();
    /* eslint-enable react-hooks/set-state-in-effect */

    const unsubscribeRecipes =
      subscribeToRecipeChanges(
        refresh
      );

    const unsubscribeProducts =
      subscribeToProductChanges(
        refresh
      );

    const unsubscribeCosting =
      subscribeToRecipeCostingChanges(
        refresh
      );

    return () => {
      unsubscribeRecipes();
      unsubscribeProducts();
      unsubscribeCosting();
    };
  }, [refresh]);

  useEffect(() => {
    const requested =
      searchParams.get(
        "recipe"
      );

    if (requested) {
      /* eslint-disable-next-line react-hooks/set-state-in-effect */
      setSelectedRecipeName(
        requested
      );
    }
  }, [searchParams]);

  const filteredRecipes =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return recipes
        .filter((recipe) => {
          const setting =
            getRecipeCostingSetting(
              recipe.name
            );

          return (
            (
              showArchived ||
              setting.active
            ) &&
            (
              !query ||
              `${recipe.name} ${recipe.category || "Uncategorised"} ${recipe.allergens.join(
                " "
              )}`
                .toLowerCase()
                .includes(
                  query
                )
            )
          );
        })
        .sort(
          (first, second) =>
            first.name.localeCompare(
              second.name
            )
        );
    }, [
      recipes,
      search,
      showArchived,
      version,
    ]);

  const selectedRecipe =
    recipes.find(
      (recipe) =>
        recipe.name ===
        selectedRecipeName
    ) ??
    filteredRecipes[0] ??
    null;

  const selectedSettings =
    selectedRecipe
      ? getRecipeCostingSetting(
          selectedRecipe.name
        )
      : null;

  const costing =
    selectedRecipe &&
    selectedSettings
      ? calculateRecipeCosting(
          selectedRecipe,
          products,
          selectedSettings
        )
      : null;

  useEffect(() => {
    if (
      selectedRecipe &&
      costing
    ) {
      recordRecipeCostSnapshot(
        selectedRecipe.name,
        costing
      );
    }
  }, [
    selectedRecipe,
    costing?.totalRecipeCost,
    costing?.costPerPortion,
    costing?.sellingPrice,
  ]);

  const canManage =
    currentUser?.role ===
      "manager" ||
    currentUser?.role ===
      "operations";

  if (!currentUser) {
    return (
      <ProtectedPage>
        <main className="flex min-h-screen items-center justify-center bg-slate-100">
          Loading Recipes...
        </main>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage>
      <main className="min-h-screen bg-slate-100 p-4 sm:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="font-semibold text-violet-800">
                Recipe Costing
              </p>

              <h1 className="mt-1 text-4xl font-bold text-gray-950">
                Recipes
              </h1>

              <p className="mt-2 text-gray-600">
                Create preparations and finished dishes with live costs.
              </p>
            </div>

            {canManage && (
              <button
                type="button"
                onClick={() =>
                  setShowNewRecipe(
                    true
                  )
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-800 px-5 py-3 font-semibold text-white hover:bg-violet-900"
              >
                <Plus size={19} />
                New Recipe
              </button>
            )}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
            <aside className="rounded-3xl bg-white p-5 shadow-sm">
              <div className="relative">
                <Search
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target
                        .value
                    )
                  }
                  placeholder="Search recipes..."
                  className="w-full rounded-xl border border-gray-300 py-3 pl-11 pr-4 outline-none focus:border-violet-800"
                />
              </div>

              {canManage && (
                <label className="mt-4 flex cursor-pointer items-center gap-3 text-sm font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={
                      showArchived
                    }
                    onChange={(event) =>
                      setShowArchived(
                        event.target
                          .checked
                      )
                    }
                    className="h-5 w-5 accent-violet-800"
                  />

                  Show archived
                </label>
              )}

              <div className="mt-5 space-y-2">
                {filteredRecipes.map(
                  (recipe) => {
                    const settings =
                      getRecipeCostingSetting(
                        recipe.name
                      );

                    const result =
                      calculateRecipeCosting(
                        recipe,
                        products,
                        settings
                      );

                    const selected =
                      selectedRecipe?.name ===
                      recipe.name;

                    return (
                      <button
                        type="button"
                        key={
                          recipe.name
                        }
                        onClick={() =>
                          setSelectedRecipeName(
                            recipe.name
                          )
                        }
                        className={`w-full rounded-2xl p-4 text-left transition ${
                          selected
                            ? "bg-violet-100 text-violet-950"
                            : "bg-slate-50 text-gray-900 hover:bg-violet-50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-bold">
                              {
                                recipe.emoji
                              }{" "}
                              {
                                recipe.name
                              }
                            </p>

                            <p className="mt-1 text-xs font-semibold opacity-60">
                              {recipe.category ||
                                "Uncategorised"}
                            </p>

                            <p className="mt-1 text-xs opacity-65">
                              {settings.recipeType ===
                              "preparation"
                                ? `Cost / ${settings.yieldUnit} ${money(
                                    result.costPerYieldUnit
                                  )}`
                                : `Cost / portion ${money(
                                    result.costPerPortion
                                  )}`}
                            </p>

                            {settings.recipeType ===
                              "menu-item" &&
                              settings.salesCode && (
                              <p className="mt-1 text-xs font-semibold opacity-70">
                                Sales Code{" "}
                                {
                                  settings.salesCode
                                }
                              </p>
                            )}
                          </div>

                          {!settings.active && (
                            <Archive
                              size={16}
                              className="shrink-0 opacity-60"
                            />
                          )}
                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            </aside>

            {!selectedRecipe ||
            !selectedSettings ||
            !costing ? (
              <section className="rounded-3xl bg-white p-12 text-center shadow-sm">
                <Calculator
                  size={42}
                  className="mx-auto text-gray-400"
                />

                <h2 className="mt-4 text-2xl font-bold text-gray-950">
                  {recipes.length === 0
                    ? "No recipes yet"
                    : "No recipe selected"}
                </h2>

                <p className="mx-auto mt-2 max-w-md text-gray-500">
                  {recipes.length === 0
                    ? "Create your first recipe from your product catalogue. Costs, yields, GP and allergens will then be kept together in one place."
                    : "Choose a recipe from the list to view its costing and method."}
                </p>

                {recipes.length === 0 &&
                  canManage && (
                  <button
                    type="button"
                    onClick={() =>
                      setShowNewRecipe(true)
                    }
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-800 px-5 py-3 font-semibold text-white hover:bg-violet-900"
                  >
                    <Plus size={18} />
                    Create First Recipe
                  </button>
                )}
              </section>
            ) : (
              <div className="space-y-6">
                <section className="rounded-3xl bg-white p-6 shadow-sm">
                  <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-3xl font-bold text-gray-950">
                          {
                            selectedRecipe.emoji
                          }{" "}
                          {
                            selectedRecipe.name
                          }
                        </h2>

                        <span className="rounded-full bg-violet-100 px-3 py-1 text-sm font-semibold text-violet-800">
                          {selectedRecipe.category ||
                            "Uncategorised"}
                        </span>

                        {!selectedSettings.active && (
                          <span className="rounded-full bg-gray-200 px-3 py-1 text-sm font-semibold text-gray-700">
                            Archived
                          </span>
                        )}
                      </div>

                      <p className="mt-2 text-gray-500">
                        {
                          selectedRecipe.yield
                        }
                        {" • "}
                        {
                          selectedRecipe.prepTime
                        }
                        {" • "}
                        {
                          selectedRecipe.shelfLife
                        }
                      </p>

                      <p className="mt-2 text-sm text-gray-600">
                        {selectedSettings.recipeType ===
                        "preparation"
                          ? "Preparation"
                          : "Finished menu item"}
                        {selectedSettings.recipeType ===
                          "menu-item" &&
                        selectedSettings.salesCode
                          ? ` • Sales Code ${selectedSettings.salesCode}`
                          : ""}
                        {" • "}
                        {selectedSettings.portions} {selectedSettings.yieldUnit}
                        {selectedSettings.portions ===
                        1
                          ? ""
                          : "s"}
                        {" • "}
                        {
                          selectedSettings.portionSize
                        }
                      </p>
                    </div>

                    {canManage && (
                      <button
                        type="button"
                        onClick={() =>
                          setEditingRecipe(
                            selectedRecipe
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-xl border border-violet-800 px-5 py-3 font-semibold text-violet-800 hover:bg-violet-50"
                      >
                        <Edit3
                          size={18}
                        />
                        Edit Recipe
                      </button>
                    )}
                  </div>

                  <div className="mt-7">
                    <RecipeCostSummary
                      costing={
                        costing
                      }
                      portions={
                        selectedSettings.portions
                      }
                    />
                  </div>
                </section>

                <RecipeIngredientCosts
                  lines={
                    costing.ingredientLines
                  }
                />

                <RecipeComponentCosts
                  lines={
                    costing.componentLines
                  }
                />

                <div className="grid gap-6 xl:grid-cols-2">
                  <section className="rounded-3xl bg-white p-6 shadow-sm">
                    <h2 className="text-xl font-bold text-gray-950">
                      Allergens
                    </h2>

                    {costing.allergens
                      .length === 0 ? (
                      <div className="mt-5 rounded-2xl bg-violet-50 p-6 text-violet-800">
                        No allergens are currently listed.
                      </div>
                    ) : (
                      <div className="mt-5 flex flex-wrap gap-2">
                        {costing.allergens.map(
                          (allergen) => (
                            <span
                              key={
                                allergen
                              }
                              className="rounded-full bg-orange-100 px-4 py-2 text-sm font-semibold text-orange-900"
                            >
                              {
                                allergen
                              }
                            </span>
                          )
                        )}
                      </div>
                    )}
                  </section>

                  <section className="rounded-3xl bg-white p-6 shadow-sm">
                    <h2 className="text-xl font-bold text-gray-950">
                      Method
                    </h2>

                    {selectedRecipe.method
                      .length === 0 ? (
                      <div className="mt-5 rounded-2xl bg-slate-50 p-6 text-gray-500">
                        No method has been added.
                      </div>
                    ) : (
                      <ol className="mt-5 space-y-3">
                        {selectedRecipe.method.map(
                          (
                            step,
                            index
                          ) => (
                            <li
                              key={`${selectedRecipe.name}-${index}`}
                              className="flex gap-3 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-gray-700"
                            >
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-900">
                                {index +
                                  1}
                              </span>

                              {step}
                            </li>
                          )
                        )}
                      </ol>
                    )}
                  </section>
                </div>

                <RecipeCostHistory
                  records={getRecipeCostHistory(
                    selectedRecipe.name
                  )}
                />
              </div>
            )}
          </div>
        </div>

        {showNewRecipe && (
          <NewRecipeModal
            products={
              products.filter(
                (product) =>
                  product.active
              )
            }
            recipes={
              recipes
            }
            onClose={() =>
              setShowNewRecipe(
                false
              )
            }
            onCreated={(
              recipeName
            ) => {
              setShowNewRecipe(
                false
              );

              setSelectedRecipeName(
                recipeName
              );

              refresh();
            }}
          />
        )}

        {editingRecipe && (
          <RecipeSettingsModal
            recipe={
              editingRecipe
            }
            initial={getRecipeCostingSetting(
              editingRecipe.name
            )}
            products={products}
            onClose={() =>
              setEditingRecipe(
                null
              )
            }
          />
        )}
      </main>
    </ProtectedPage>
  );
}


function RecipesLoading() {
  return (
    <ProtectedPage>
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        Loading Recipes...
      </main>
    </ProtectedPage>
  );
}

export default function RecipesPage() {
  return (
    <Suspense fallback={<RecipesLoading />}>
      <RecipesContent />
    </Suspense>
  );
}