"use client";

import { useEffect, useState } from "react";
import { Recipe } from "@/data/recipes";
import { products } from "@/data/products";

type RecipeModalProps = {
  recipe: Recipe;
  onClose: () => void;
  initialBatches?: number;
};

export default function RecipeModal({
  recipe,
  onClose,
  initialBatches = 1,
}: RecipeModalProps) {
  const [batches, setBatches] = useState(initialBatches);

  useEffect(() => {
    setBatches(initialBatches);
  }, [recipe, initialBatches]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  function getProduct(productId: number) {
    return products.find((product) => product.id === productId);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-950">
              {recipe.emoji} {recipe.name}
            </h2>
            <p className="mt-2 text-gray-500">Recipe Card</p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border px-4 py-2 font-semibold hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-gray-500">Base Recipe</p>
            <p className="font-bold">{recipe.yield}</p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-gray-500">Prep Time</p>
            <p className="font-bold">{recipe.prepTime}</p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-gray-500">Shelf Life</p>
            <p className="font-bold">{recipe.shelfLife}</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-green-900">Preparing</h3>
              <p className="mt-1 text-sm text-green-700">
                Ingredient quantities update automatically.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setBatches(Math.max(1, batches - 1))}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-2xl font-bold text-green-900 shadow-sm"
              >
                -
              </button>

              <div className="w-20 text-center">
                <p className="text-3xl font-bold text-green-900">{batches}</p>
                <p className="text-xs font-semibold text-green-700">
                  {batches === 1 ? "batch" : "batches"}
                </p>
              </div>

              <button
                onClick={() => setBatches(batches + 1)}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-2xl font-bold text-green-900 shadow-sm"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-red-50 p-5">
          <h3 className="font-bold text-red-800">Allergens</h3>
          <p className="mt-2 text-red-700">{recipe.allergens.join(", ")}</p>
        </div>

        <div className="mt-6 rounded-2xl bg-slate-50 p-5">
          <h3 className="text-xl font-bold">Ingredients</h3>

          <ul className="mt-4 space-y-2">
            {recipe.ingredients.map((ingredient) => {
              const product = getProduct(ingredient.productId);
              const totalQuantity = ingredient.quantity * batches;

              return (
                <li
                  key={ingredient.productId}
                  className="flex justify-between gap-4 rounded-xl bg-white px-4 py-3"
                >
                  <span className="font-semibold">
                    {product?.name ?? "Unknown Product"}
                  </span>

                  <span className="font-bold text-gray-900">
                    {totalQuantity} {product?.inventoryUnit ?? "units"}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-6 rounded-2xl bg-slate-50 p-5">
          <h3 className="text-xl font-bold">Method</h3>

          <ol className="mt-4 space-y-3">
            {recipe.method.map((step, index) => (
              <li key={step}>
                <span className="font-bold">{index + 1}.</span> {step}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}