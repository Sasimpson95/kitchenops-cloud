import type {
  IngredientCostLine,
} from "@/lib/recipeCostingStore";

function money(
  value: number,
  digits = 4
): string {
  return new Intl.NumberFormat(
    "en-GB",
    {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits:
        digits,
    }
  ).format(value);
}

export default function RecipeIngredientCosts({
  lines,
}: {
  lines: IngredientCostLine[];
}) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-bold text-gray-950">
          Ingredient Costs
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Live costs calculated from current product purchase prices.
        </p>
      </div>

      {lines.length === 0 ? (
        <div className="mt-5 rounded-2xl bg-slate-50 p-8 text-center text-gray-500">
          No ingredients have been added.
        </div>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b text-sm text-gray-500">
                <th className="px-3 py-3">
                  Ingredient
                </th>
                <th className="px-3 py-3">
                  Recipe Quantity
                </th>
                <th className="px-3 py-3">
                  Purchase
                </th>
                <th className="px-3 py-3">
                  Unit Cost
                </th>
                <th className="px-3 py-3 text-right">
                  Line Cost
                </th>
              </tr>
            </thead>

            <tbody>
              {lines.map((line) => (
                <tr
                  key={`${line.productId}-${line.productName}`}
                  className="border-b border-gray-100"
                >
                  <td className="px-3 py-4">
                    <p className="font-bold text-gray-950">
                      {
                        line.productName
                      }
                    </p>

                    {line.warning && (
                      <p className="mt-1 text-xs font-semibold text-orange-700">
                        {line.warning}
                      </p>
                    )}
                  </td>

                  <td className="px-3 py-4 font-semibold text-gray-700">
                    {line.recipeQuantity}{" "}
                    {line.recipeUnit}
                    {line.recipeUnit !== line.inventoryUnit && (
                      <span className="block text-xs text-gray-400">
                        = {line.convertedQuantity} {line.inventoryUnit}
                      </span>
                    )}
                  </td>

                  <td className="px-3 py-4 text-sm text-gray-600">
                    {money(
                      line.purchasePrice,
                      2
                    )}
                    {" / "}
                    {
                      line.purchaseUnit
                    }
                    <br />
                    <span className="text-xs text-gray-400">
                      {
                        line.purchaseQuantity
                      }{" "}
                      {
                        line.inventoryUnit
                      }{" "}
                      per purchase unit
                    </span>
                  </td>

                  <td className="px-3 py-4 font-semibold text-gray-700">
                    {money(
                      line.unitCost
                    )}
                    {" / "}
                    {
                      line.inventoryUnit
                    }
                  </td>

                  <td className="px-3 py-4 text-right text-lg font-bold text-gray-950">
                    {money(
                      line.lineCost,
                      2
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
