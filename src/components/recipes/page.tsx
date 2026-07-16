"use client";

import { useState } from "react";
import ProtectedPage from "@/components/ProtectedPage";
import RecipeModal from "@/components/recipes/RecipeModal";
import { Recipe, recipes } from "@/data/recipes";

export default function RecipesPage() {
  const [search, setSearch] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const filteredRecipes = recipes.filter((recipe) =>
    recipe.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ProtectedPage>
      <main className="min-h-screen bg-slate-100 p-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-950">
                Recipe Library
              </h1>

              <p className="mt-2 text-gray-600">
                View production recipes used in prep lists and kitchen planning.
              </p>
            </div>

            <button className="rounded-xl bg-violet-800 px-6 py-3 font-semibold text-white hover:bg-violet-900">
              + New Recipe
            </button>
          </div>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="🔍 Search recipes..."
            className="mt-8 w-full rounded-2xl border border-gray-300 bg-white px-5 py-4 font-semibold shadow-sm outline-none focus:border-violet-800"
          />

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {filteredRecipes.map((recipe) => (
              <button
                key={recipe.name}
                onClick={() => setSelectedRecipe(recipe)}
                className="rounded-3xl bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <h2 className="text-2xl font-bold text-gray-950">
                  {recipe.emoji} {recipe.name}
                </h2>

                <div className="mt-5 space-y-3 text-sm text-gray-600">
                  <p>
                    <strong>Yield:</strong> {recipe.yield}
                  </p>

                  <p>
                    <strong>Prep Time:</strong> {recipe.prepTime}
                  </p>

                  <p>
                    <strong>Shelf Life:</strong> {recipe.shelfLife}
                  </p>

                  <p>
                    <strong>Allergens:</strong> {recipe.allergens.join(", ")}
                  </p>
                </div>

                <p className="mt-5 font-semibold text-violet-800">
                  Open recipe →
                </p>
              </button>
            ))}
          </div>

          {filteredRecipes.length === 0 && (
            <div className="mt-8 rounded-3xl bg-white p-12 text-center shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900">
                No recipes found
              </h2>

              <p className="mt-3 text-gray-600">
                Try searching for another recipe.
              </p>
            </div>
          )}
        </div>

        {selectedRecipe && (
          <RecipeModal
            recipe={selectedRecipe}
            onClose={() => setSelectedRecipe(null)}
          />
        )}
      </main>
    </ProtectedPage>
  );
}