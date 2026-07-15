
import type {
  RecipeComponentCostLine,
} from "@/lib/recipeCostingStore";

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

export default function RecipeComponentCosts({
  lines,
}: {
  lines: RecipeComponentCostLine[];
}) {
  if (lines.length === 0) {
    return null;
  }

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-bold text-gray-950">
          Preparation Components
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Costed preparations used inside this recipe.
        </p>
      </div>

      <div className="mt-5 space-y-3">
        {lines.map((line) => (
          <div
            key={line.recipeName}
            className="grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center"
          >
            <div>
              <p className="font-bold text-gray-950">
                {line.recipeName}
              </p>

              {line.warning && (
                <p className="mt-1 text-xs font-semibold text-orange-700">
                  {line.warning}
                </p>
              )}
            </div>

            <p className="text-sm font-semibold text-gray-700">
              {line.quantity}{" "}
              {line.yieldUnit}
              {line.quantity === 1
                ? ""
                : "s"}
              {" × "}
              {money(line.unitCost)}
            </p>

            <p className="text-lg font-bold text-gray-950">
              {money(line.lineCost)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
