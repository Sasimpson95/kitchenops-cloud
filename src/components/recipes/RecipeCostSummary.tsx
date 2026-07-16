import {
  AlertTriangle,
  CheckCircle2,
  Percent,
  PoundSterling,
  Target,
} from "lucide-react";

import type {
  RecipeCostingResult,
} from "@/lib/recipeCostingStore";

function money(
  value: number,
  digits = 2
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

function Metric({
  label,
  value,
  detail,
  tone = "slate",
}: {
  label: string;
  value: string;
  detail?: string;
  tone?:
    | "slate"
    | "green"
    | "orange"
    | "blue";
}) {
  const tones = {
    slate:
      "bg-slate-50 text-gray-950",
    green:
      "bg-violet-50 text-violet-950",
    orange:
      "bg-orange-50 text-orange-950",
    blue:
      "bg-blue-50 text-blue-950",
  };

  return (
    <div
      className={`rounded-2xl p-5 ${tones[tone]}`}
    >
      <p className="text-sm font-semibold opacity-70">
        {label}
      </p>

      <p className="mt-2 text-3xl font-bold">
        {value}
      </p>

      {detail && (
        <p className="mt-2 text-xs opacity-65">
          {detail}
        </p>
      )}
    </div>
  );
}

export default function RecipeCostSummary({
  costing,
  portions,
}: {
  costing: RecipeCostingResult;
  portions: number;
}) {
  const gpHealthy =
    costing.sellingPrice > 0 &&
    costing.grossProfitPercentage >=
      costing.targetGrossProfitPercentage;

  const isPreparation =
    costing.recipeType ===
    "preparation";

  const yieldLabel =
    `${costing.yieldQuantity} ${
      costing.yieldUnit
    }${
      costing.yieldQuantity === 1
        ? ""
        : "s"
    }`;

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Recipe Cost"
          value={money(
            costing.totalRecipeCost
          )}
          detail="Total ingredient cost"
        />

        <Metric
          label={
            isPreparation
              ? `Cost Per ${costing.yieldUnit}`
              : "Cost Per Portion"
          }
          value={money(
            costing.costPerYieldUnit
          )}
          detail={yieldLabel}
          tone="blue"
        />

        {isPreparation ? (
          <>
            <Metric
              label="Recipe Type"
              value="Preparation"
              detail="Used inside another recipe"
              tone="green"
            />

            <Metric
              label="Yield"
              value={yieldLabel}
              detail="Finished preparation output"
              tone="green"
            />

            <Metric
              label="Selling Price"
              value="Not required"
              detail="Preparation recipes are not sold directly"
            />

            <Metric
              label="Gross Profit"
              value="Not applicable"
              detail="Calculated on the finished menu item"
            />

            <Metric
              label="Food Cost"
              value="Not applicable"
              detail="Calculated on the finished menu item"
            />

            <Metric
              label="Ingredient Lines"
              value={String(
                costing.ingredientLines
                  .length
              )}
              detail="Products included"
            />
          </>
        ) : (
          <>
            <Metric
              label="Selling Price"
              value={
                costing.sellingPrice > 0
                  ? money(
                      costing.sellingPrice
                    )
                  : "Not set"
              }
              detail="Per portion"
              tone="green"
            />

            <Metric
              label="Gross Profit"
              value={
                costing.sellingPrice >
                0
                  ? `${costing.grossProfitPercentage.toFixed(
                      1
                    )}%`
                  : "Not set"
              }
              detail={`Target ${costing.targetGrossProfitPercentage.toFixed(
                1
              )}%`}
              tone={
                gpHealthy
                  ? "green"
                  : "orange"
              }
            />

            <Metric
              label="Food Cost"
              value={
                costing.sellingPrice >
                0
                  ? `${costing.foodCostPercentage.toFixed(
                      1
                    )}%`
                  : "Not set"
              }
              detail="Recipe cost ÷ selling price"
            />

            <Metric
              label="GP Value"
              value={
                costing.sellingPrice > 0
                  ? money(
                      costing.grossProfitValue
                    )
                  : "Not set"
              }
              detail="Per portion"
              tone="green"
            />

            <Metric
              label="Target Price"
              value={money(
                costing.targetSellingPrice
              )}
              detail="Price required to hit target GP"
              tone="blue"
            />

            <Metric
              label="Ingredient Lines"
              value={String(
                costing.ingredientLines
                  .length
              )}
              detail="Products included"
            />
          </>
        )}
      </div>

      <section
        className={`mt-5 rounded-2xl p-5 ${
          costing.warnings.length >
          0
            ? "bg-orange-50"
            : "bg-violet-50"
        }`}
      >
        <div className="flex items-start gap-3">
          {costing.warnings.length >
          0 ? (
            <AlertTriangle
              size={22}
              className="mt-0.5 shrink-0 text-orange-700"
            />
          ) : (
            <CheckCircle2
              size={22}
              className="mt-0.5 shrink-0 text-violet-700"
            />
          )}

          <div>
            <h3
              className={`font-bold ${
                costing.warnings
                  .length > 0
                  ? "text-orange-950"
                  : "text-violet-950"
              }`}
            >
              {costing.warnings.length >
              0
                ? "Costing needs attention"
                : isPreparation
                  ? "Preparation costing is complete"
                  : "Costing is complete"}
            </h3>

            {costing.warnings.length >
            0 ? (
              <ul className="mt-2 space-y-1 text-sm text-orange-800">
                {costing.warnings.map(
                  (warning) => (
                    <li key={warning}>
                      • {warning}
                    </li>
                  )
                )}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-violet-800">
                {isPreparation
                  ? `This preparation costs ${money(
                      costing.costPerYieldUnit
                    )} per ${costing.yieldUnit}. Add it to a finished menu recipe to calculate selling price and GP.`
                  : "Prices, conversion, yield and selling price are configured."}
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
