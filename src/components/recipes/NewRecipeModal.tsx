
"use client";

import {
  Plus,
  Trash2,
  X,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import {
  addRecipe,
  type Recipe,
  type RecipeIngredient,
  type RecipeComponent,
} from "@/data/recipes";

import type {
  Product,
} from "@/data/products";

import {
  saveRecipeCostingSetting,
  type RecipeType,
} from "@/lib/recipeCostingStore";

import {
  RECIPE_UNITS,
  defaultRecipeUnit,
  type RecipeUnit,
} from "@/lib/unitConversion";

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

type IngredientDraft = {
  key: string;
  productId: number;
  quantity: number;
  unit: RecipeUnit;
};

type ComponentDraft = {
  key: string;
  recipeName: string;
  quantity: number;
};

function createKey(): string {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

export default function NewRecipeModal({
  products,
  recipes,
  onClose,
  onCreated,
}: {
  products: Product[];
  recipes: Recipe[];
  onClose: () => void;
  onCreated: (
    recipeName: string
  ) => void;
}) {
  const [
    name,
    setName,
  ] = useState("");

  const [
    emoji,
    setEmoji,
  ] = useState("🍽️");

  const [
    category,
    setCategory,
  ] = useState("Uncategorised");

  const [
    recipeType,
    setRecipeType,
  ] = useState<RecipeType>(
    "preparation"
  );

  const [
    yieldQuantity,
    setYieldQuantity,
  ] = useState(1);

  const [
    yieldUnit,
    setYieldUnit,
  ] = useState("batch");

  const [
    yieldDescription,
    setYieldDescription,
  ] = useState("1 batch");

  const [
    prepTime,
    setPrepTime,
  ] = useState("");

  const [
    shelfLife,
    setShelfLife,
  ] = useState("");

  const [
    salesCode,
    setSalesCode,
  ] = useState("");

  const [
    sellingPrice,
    setSellingPrice,
  ] = useState(0);

  const [
    targetGp,
    setTargetGp,
  ] = useState(70);

  const [
    ingredients,
    setIngredients,
  ] = useState<IngredientDraft[]>(
    []
  );

  const [
    components,
    setComponents,
  ] = useState<ComponentDraft[]>(
    []
  );

  const [
    method,
    setMethod,
  ] = useState<string[]>([
    "",
  ]);

  const [
    allergens,
    setAllergens,
  ] = useState<string[]>(
    []
  );

  const [
    error,
    setError,
  ] = useState("");

  const preparationRecipes =
    useMemo(
      () =>
        recipes.filter(
          (recipe) => {
            const saved =
              window.localStorage.getItem(
                "kitchenops-recipe-costing-settings"
              );

            if (!saved) {
              return false;
            }

            try {
              const settings =
                JSON.parse(saved) as Array<{
                  recipeName: string;
                  recipeType?: RecipeType;
                  active?: boolean;
                }>;

              const setting =
                settings.find(
                  (item) =>
                    item.recipeName
                      .trim()
                      .toLowerCase() ===
                    recipe.name
                      .trim()
                      .toLowerCase()
                );

              return (
                setting?.recipeType ===
                  "preparation" &&
                setting.active !==
                  false
              );
            } catch {
              return false;
            }
          }
        ),
      [recipes]
    );

  function addIngredient(): void {
    const product =
      products[0];

    if (!product) {
      setError(
        "Add products before creating recipe ingredients."
      );
      return;
    }

    setIngredients(
      (current) => [
        ...current,
        {
          key: createKey(),
          productId:
            product.id,
          quantity: 1,
          unit:
            defaultRecipeUnit(
              product.inventoryUnit
            ),
        },
      ]
    );
  }

  function addComponent(): void {
    const preparation =
      preparationRecipes[0];

    if (!preparation) {
      setError(
        "Create a Preparation / Component recipe first."
      );
      return;
    }

    setComponents(
      (current) => [
        ...current,
        {
          key: createKey(),
          recipeName:
            preparation.name,
          quantity: 1,
        },
      ]
    );
  }

  function toggleAllergen(
    allergen: string
  ): void {
    setAllergens(
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
    setError("");

    if (!name.trim()) {
      setError(
        "Enter a recipe name."
      );
      return;
    }

    if (
      !Number.isFinite(
        yieldQuantity
      ) ||
      yieldQuantity <= 0
    ) {
      setError(
        "Recipe yield must be greater than zero."
      );
      return;
    }

    if (
      ingredients.length === 0 &&
      components.length === 0
    ) {
      setError(
        "Add at least one ingredient or preparation component."
      );
      return;
    }

    const cleanedIngredients:
      RecipeIngredient[] =
      ingredients.map(
        (ingredient) => ({
          productId:
            ingredient.productId,
          quantity:
            Number(
              ingredient.quantity
            ),
          unit:
            ingredient.unit,
        })
      );

    if (
      cleanedIngredients.some(
        (ingredient) =>
          !Number.isFinite(
            ingredient.quantity
          ) ||
          ingredient.quantity <=
            0
      )
    ) {
      setError(
        "Every ingredient needs an amount greater than zero."
      );
      return;
    }

    const duplicateProducts =
      new Set(
        cleanedIngredients.map(
          (ingredient) =>
            ingredient.productId
        )
      ).size !==
      cleanedIngredients.length;

    if (duplicateProducts) {
      setError(
        "The same product has been added more than once."
      );
      return;
    }

    const cleanedComponents:
      RecipeComponent[] =
      components.map(
        (component) => ({
          recipeName:
            component.recipeName,
          quantity:
            Number(
              component.quantity
            ),
        })
      );

    const duplicateComponents =
      new Set(
        cleanedComponents.map(
          (component) =>
            component.recipeName
        )
      ).size !==
      cleanedComponents.length;

    if (duplicateComponents) {
      setError(
        "The same preparation has been added more than once."
      );
      return;
    }

    try {
      const recipe =
        addRecipe({
          name:
            name.trim(),
          category:
            category.trim() ||
            "Uncategorised",
          emoji:
            emoji.trim() ||
            "🍽️",
          yield: `${yieldQuantity} ${yieldUnit}${
            yieldQuantity === 1
              ? ""
              : "s"
          }`,
          prepTime:
            prepTime.trim(),
          shelfLife:
            shelfLife.trim(),
          allergens,
          ingredients:
            cleanedIngredients,
          components:
            cleanedComponents,
          method:
            method
              .map((step) =>
                step.trim()
              )
              .filter(Boolean),
        });

      saveRecipeCostingSetting({
        recipeName:
          recipe.name,
        recipeType,
        salesCode:
          recipeType ===
          "menu-item"
            ? salesCode.trim()
            : "",
        portions:
          yieldQuantity,
        yieldUnit:
          yieldUnit.trim() ||
          (
            recipeType ===
            "preparation"
              ? "batch"
              : "portion"
          ),
        portionSize:
          yieldDescription.trim() ||
          `1 ${yieldUnit}`,
        sellingPrice:
          recipeType ===
          "menu-item"
            ? Math.max(
                0,
                sellingPrice
              )
            : 0,
        targetGrossProfitPercentage:
          targetGp,
        active: true,
        extraAllergens: [],
        ingredientUnits:
          Object.fromEntries(
            cleanedIngredients.map(
              (ingredient) => [
                String(
                  ingredient.productId
                ),
                ingredient.unit ??
                  "Each",
              ]
            )
          ),
      });

      onCreated(
        recipe.name
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The recipe could not be created."
      );
    }
  }

  return (
    <div className="mobile-native-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm">
      <div data-mobile-sheet="true" role="dialog" aria-modal="true" className="mobile-native-sheet max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-7 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-semibold text-violet-800">
              Recipe Management
            </p>

            <h2 className="mt-1 text-2xl font-bold text-gray-950">
              New Recipe
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

        <section className="mt-6 rounded-2xl bg-slate-50 p-5">
          <div className="grid gap-5 sm:grid-cols-[100px_1fr_1fr]">
            <label>
              <span className="text-sm font-semibold text-gray-700">
                Emoji
              </span>

              <input
                value={emoji}
                onChange={(event) =>
                  setEmoji(
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-violet-800"
              />
            </label>

            <label>
              <span className="text-sm font-semibold text-gray-700">
                Recipe Name
              </span>

              <input
                value={name}
                onChange={(event) =>
                  setName(
                    event.target.value
                  )
                }
                placeholder="Example: Wet Mix"
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-violet-800"
              />
            </label>

            <label>
              <span className="text-sm font-semibold text-gray-700">
                Recipe Type
              </span>

              <select
                value={recipeType}
                onChange={(event) => {
                  const type =
                    event.target
                      .value as RecipeType;

                  setRecipeType(type);

                  if (
                    type ===
                    "preparation"
                  ) {
                    setYieldUnit(
                      "batch"
                    );
                    setYieldDescription(
                      "1 batch"
                    );
                  } else {
                    setYieldUnit(
                      "portion"
                    );
                    setYieldDescription(
                      "1 serving"
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
            </label>
          </div>

          <label className="mt-5 block">
            <span className="text-sm font-semibold text-gray-700">
              Category
            </span>

            <input
              value={category}
              onChange={(event) =>
                setCategory(
                  event.target.value
                )
              }
              placeholder="Example: Brunch, Sauce, Bakery, Dessert"
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-violet-800"
            />

            <p className="mt-2 text-xs text-gray-500">
              Use categories to keep large recipe libraries easy to browse.
            </p>
          </label>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <label>
              <span className="text-sm font-semibold text-gray-700">
                Yield
              </span>

              <input
                type="number"
                min={1}
                step="1"
                value={yieldQuantity}
                onChange={(event) =>
                  setYieldQuantity(
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
                    event.target.value
                  )
                }
                placeholder="Batch"
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-violet-800"
              />
            </label>

            <label>
              <span className="text-sm font-semibold text-gray-700">
                Prep Time
              </span>

              <input
                value={prepTime}
                onChange={(event) =>
                  setPrepTime(
                    event.target.value
                  )
                }
                placeholder="20 minutes"
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-violet-800"
              />
            </label>

            <label>
              <span className="text-sm font-semibold text-gray-700">
                Shelf Life
              </span>

              <input
                value={shelfLife}
                onChange={(event) =>
                  setShelfLife(
                    event.target.value
                  )
                }
                placeholder="3 days chilled"
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-violet-800"
              />
            </label>
          </div>

          <label className="mt-5 block">
            <span className="text-sm font-semibold text-gray-700">
              Yield Description
            </span>

            <input
              value={yieldDescription}
              onChange={(event) =>
                setYieldDescription(
                  event.target.value
                )
              }
              placeholder="Example: 1 tub or 1 serving"
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-violet-800"
            />
          </label>

          {recipeType ===
          "menu-item" && (
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
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
                  Use the code or ID from your POS. Each menu item must have a unique Sales Code.
                </p>
              </label>

              <label>
                <span className="text-sm font-semibold text-gray-700">
                  Selling Price
                </span>

                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={sellingPrice}
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
            </div>
          )}
        </section>

        <section className="mt-6 rounded-2xl bg-slate-50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-gray-950">
                Product Ingredients
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Add products and the exact quantity used.
              </p>
            </div>

            <button
              type="button"
              onClick={addIngredient}
              className="inline-flex items-center gap-2 rounded-xl border border-violet-800 px-4 py-2 font-semibold text-violet-800 hover:bg-violet-50"
            >
              <Plus size={17} />
              Add Ingredient
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {ingredients.length ===
            0 ? (
              <div className="rounded-xl bg-white p-6 text-center text-gray-500">
                No product ingredients added yet.
              </div>
            ) : (
              ingredients.map(
                (ingredient) => {
                  const product =
                    products.find(
                      (item) =>
                        item.id ===
                        ingredient.productId
                    );

                  return (
                    <div
                      key={ingredient.key}
                      className="grid gap-3 rounded-xl bg-white p-4 sm:grid-cols-[1fr_120px_140px_44px] sm:items-end"
                    >
                      <label>
                        <span className="text-xs font-semibold text-gray-600">
                          Product
                        </span>

                        <select
                          value={ingredient.productId}
                          onChange={(event) => {
                            const productId =
                              Number(
                                event.target.value
                              );

                            const nextProduct =
                              products.find(
                                (item) =>
                                  item.id ===
                                  productId
                              );

                            setIngredients(
                              (current) =>
                                current.map(
                                  (item) =>
                                    item.key ===
                                    ingredient.key
                                      ? {
                                          ...item,
                                          productId,
                                          unit:
                                            nextProduct
                                              ? defaultRecipeUnit(
                                                  nextProduct.inventoryUnit
                                                )
                                              : item.unit,
                                        }
                                      : item
                                )
                            );
                          }}
                          className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-violet-800"
                        >
                          {products.map(
                            (item) => (
                              <option
                                key={item.id}
                                value={item.id}
                              >
                                {item.name}
                              </option>
                            )
                          )}
                        </select>

                        {product && (
                          <p className="mt-1 text-xs text-gray-400">
                            Stocked in {product.inventoryUnit}
                          </p>
                        )}
                      </label>

                      <label>
                        <span className="text-xs font-semibold text-gray-600">
                          Amount
                        </span>

                        <input
                          type="number"
                          min={0.0001}
                          step="0.01"
                          value={ingredient.quantity}
                          onChange={(event) =>
                            setIngredients(
                              (current) =>
                                current.map(
                                  (item) =>
                                    item.key ===
                                    ingredient.key
                                      ? {
                                          ...item,
                                          quantity:
                                            Number(
                                              event.target.value
                                            ),
                                        }
                                      : item
                                )
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
                          value={ingredient.unit}
                          onChange={(event) =>
                            setIngredients(
                              (current) =>
                                current.map(
                                  (item) =>
                                    item.key ===
                                    ingredient.key
                                      ? {
                                          ...item,
                                          unit:
                                            event.target.value as RecipeUnit,
                                        }
                                      : item
                                )
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

                      <button
                        type="button"
                        onClick={() =>
                          setIngredients(
                            (current) =>
                              current.filter(
                                (item) =>
                                  item.key !==
                                  ingredient.key
                              )
                          )
                        }
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 text-red-700 hover:bg-red-50"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  );
                }
              )
            )}
          </div>
        </section>

        {recipeType ===
          "menu-item" && (
          <section className="mt-6 rounded-2xl bg-slate-50 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-gray-950">
                  Preparation Components
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Add preparations such as Wet Mix, sauces or batters.
                </p>
              </div>

              <button
                type="button"
                onClick={addComponent}
                className="inline-flex items-center gap-2 rounded-xl border border-violet-800 px-4 py-2 font-semibold text-violet-800 hover:bg-violet-50"
              >
                <Plus size={17} />
                Add Preparation
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {components.length ===
              0 ? (
                <div className="rounded-xl bg-white p-6 text-center text-gray-500">
                  No preparation components added.
                </div>
              ) : (
                components.map(
                  (component) => (
                    <div
                      key={component.key}
                      className="grid gap-3 rounded-xl bg-white p-4 sm:grid-cols-[1fr_140px_44px] sm:items-end"
                    >
                      <label>
                        <span className="text-xs font-semibold text-gray-600">
                          Preparation
                        </span>

                        <select
                          value={component.recipeName}
                          onChange={(event) =>
                            setComponents(
                              (current) =>
                                current.map(
                                  (item) =>
                                    item.key ===
                                    component.key
                                      ? {
                                          ...item,
                                          recipeName:
                                            event.target.value,
                                        }
                                      : item
                                )
                            )
                          }
                          className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-violet-800"
                        >
                          {preparationRecipes.map(
                            (recipe) => (
                              <option
                                key={recipe.name}
                                value={recipe.name}
                              >
                                {recipe.name}
                              </option>
                            )
                          )}
                        </select>
                      </label>

                      <label>
                        <span className="text-xs font-semibold text-gray-600">
                          Amount
                        </span>

                        <input
                          type="number"
                          min={0.0001}
                          step="0.01"
                          value={component.quantity}
                          onChange={(event) =>
                            setComponents(
                              (current) =>
                                current.map(
                                  (item) =>
                                    item.key ===
                                    component.key
                                      ? {
                                          ...item,
                                          quantity:
                                            Number(
                                              event.target.value
                                            ),
                                        }
                                      : item
                                )
                            )
                          }
                          className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-violet-800"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() =>
                          setComponents(
                            (current) =>
                              current.filter(
                                (item) =>
                                  item.key !==
                                  component.key
                              )
                          )
                        }
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 text-red-700 hover:bg-red-50"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  )
                )
              )}
            </div>
          </section>
        )}

        <section className="mt-6 rounded-2xl bg-slate-50 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-gray-950">
                Method
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Add the preparation or cooking steps.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setMethod(
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
            {method.map(
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
                      setMethod(
                        (current) =>
                          current.map(
                            (item, stepIndex) =>
                              stepIndex === index
                                ? event.target.value
                                : item
                          )
                      )
                    }
                    rows={2}
                    className="min-w-0 flex-1 rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-violet-800"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setMethod(
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
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              )
            )}
          </div>
        </section>

        <section className="mt-6 rounded-2xl bg-slate-50 p-5">
          <h3 className="font-bold text-gray-950">
            Allergens
          </h3>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {COMMON_ALLERGENS.map(
              (allergen) => (
                <label
                  key={allergen}
                  className="flex cursor-pointer items-center gap-3 rounded-xl bg-white p-3"
                >
                  <input
                    type="checkbox"
                    checked={allergens.includes(
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
            Save Recipe
          </button>
        </div>
      </div>
    </div>
  );
}
