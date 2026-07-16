import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  getCloudRequestContext,
} from "@/lib/cloud/serverContext";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

const DEFAULT_UNITS = [
  ["Each", "each", "each"],
  ["Gram", "g", "weight"],
  ["Kilogram", "kg", "weight"],
  ["Millilitre", "ml", "volume"],
  ["Litre", "L", "volume"],
  ["Portion", "portion", "portion"],
  ["Bottle", "bottle", "packaging"],
  ["Pack", "pack", "packaging"],
  ["Case", "case", "packaging"],
  ["Tray", "tray", "packaging"],
  ["Bag", "bag", "packaging"],
  ["Tub", "tub", "packaging"],
] as const;

function jsonError(
  message: string,
  status: number
) {
  return NextResponse.json(
    { error: message },
    { status }
  );
}

async function ensureDefaultUnits(
  businessId: string
) {
  const admin = createAdminClient();

  const units = await admin
    .from("product_units")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("business_id", businessId);

  if (units.error) {
    throw units.error;
  }

  if ((units.count ?? 0) !== 0) {
    return;
  }

  const { error } = await admin
    .from("product_units")
    .insert(
      DEFAULT_UNITS.map(
        ([name, symbol, unitKind], index) => ({
          business_id: businessId,
          name,
          symbol,
          unit_kind: unitKind,
          sort_order: index,
        })
      )
    );

  if (error) {
    throw error;
  }
}

export async function GET() {
  try {
    const context =
      await getCloudRequestContext();

    if (!context) {
      return jsonError(
        "Authentication required.",
        401
      );
    }

    await ensureDefaultUnits(
      context.businessId
    );

    const admin = createAdminClient();

    const [categories, units] =
      await Promise.all([
        admin
          .from("product_categories")
          .select(
            "id, name, active, sort_order"
          )
          .eq(
            "business_id",
            context.businessId
          )
          .order("sort_order")
          .order("name"),
        admin
          .from("product_units")
          .select(
            "id, name, symbol, unit_kind, active, sort_order"
          )
          .eq(
            "business_id",
            context.businessId
          )
          .order("sort_order")
          .order("name"),
      ]);

    const firstError =
      categories.error ||
      units.error;

    if (firstError) {
      return jsonError(
        firstError.message,
        500
      );
    }

    return NextResponse.json({
      categories:
        categories.data ?? [],
      units: units.data ?? [],
    });
  } catch (error) {
    return jsonError(
      error instanceof Error
        ? error.message
        : "Product options could not be loaded.",
      500
    );
  }
}

export async function POST(
  request: NextRequest
) {
  try {
    const context =
      await getCloudRequestContext();

    if (!context) {
      return jsonError(
        "Authentication required.",
        401
      );
    }

    if (context.role !== "operations") {
      return jsonError(
        "Operations permission required.",
        403
      );
    }

    const body =
      await request.json() as {
        optionType?:
          | "category"
          | "unit";
        name?: string;
        symbol?: string;
        unitKind?: string;
      };

    const name = body.name?.trim();

    if (!name) {
      return jsonError(
        "Enter a name.",
        400
      );
    }

    const admin = createAdminClient();

    if (
      body.optionType ===
      "category"
    ) {
      const { data, error } =
        await admin
          .from(
            "product_categories"
          )
          .insert({
            business_id:
              context.businessId,
            name,
          })
          .select(
            "id, name, active, sort_order"
          )
          .single();

      if (error) {
        return jsonError(
          error.code === "23505"
            ? "That category already exists."
            : error.message,
          400
        );
      }

      return NextResponse.json({
        category: data,
      });
    }

    if (
      body.optionType === "unit"
    ) {
      const symbol =
        body.symbol?.trim();

      if (!symbol) {
        return jsonError(
          "Enter a unit symbol.",
          400
        );
      }

      const { data, error } =
        await admin
          .from("product_units")
          .insert({
            business_id:
              context.businessId,
            name,
            symbol,
            unit_kind:
              body.unitKind ??
              "each",
          })
          .select(
            "id, name, symbol, unit_kind, active, sort_order"
          )
          .single();

      if (error) {
        return jsonError(
          error.code === "23505"
            ? "That unit already exists."
            : error.message,
          400
        );
      }

      return NextResponse.json({
        unit: data,
      });
    }

    return jsonError(
      "Choose category or unit.",
      400
    );
  } catch (error) {
    return jsonError(
      error instanceof Error
        ? error.message
        : "The option could not be created.",
      500
    );
  }
}

export async function PATCH(
  request: NextRequest
) {
  try {
    const context =
      await getCloudRequestContext();

    if (!context) {
      return jsonError(
        "Authentication required.",
        401
      );
    }

    if (context.role !== "operations") {
      return jsonError(
        "Operations permission required.",
        403
      );
    }

    const body =
      await request.json() as {
        optionType?:
          | "category"
          | "unit";
        id?: string;
        name?: string;
        active?: boolean;
        symbol?: string;
        unitKind?: string;
        sortOrder?: number;
      };

    if (!body.id) {
      return jsonError(
        "Option ID is required.",
        400
      );
    }

    const admin = createAdminClient();

    if (
      body.optionType ===
      "category"
    ) {
      if (
        body.name !== undefined &&
        !body.name.trim()
      ) {
        return jsonError(
          "Category name cannot be empty.",
          400
        );
      }

      const { error } = await admin
        .from("product_categories")
        .update({
          ...(body.name !== undefined
            ? {
                name:
                  body.name.trim(),
              }
            : {}),
          ...(body.active !== undefined
            ? {
                active:
                  body.active,
              }
            : {}),
          ...(body.sortOrder !== undefined
            ? {
                sort_order:
                  body.sortOrder,
              }
            : {}),
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", body.id)
        .eq(
          "business_id",
          context.businessId
        );

      if (error) {
        return jsonError(
          error.code === "23505"
            ? "That category already exists."
            : error.message,
          400
        );
      }

      return NextResponse.json({
        success: true,
      });
    }

    if (
      body.optionType === "unit"
    ) {
      const { error } = await admin
        .from("product_units")
        .update({
          ...(body.name !== undefined
            ? {
                name:
                  body.name.trim(),
              }
            : {}),
          ...(body.symbol !== undefined
            ? {
                symbol:
                  body.symbol.trim(),
              }
            : {}),
          ...(body.active !== undefined
            ? {
                active:
                  body.active,
              }
            : {}),
          ...(body.unitKind !== undefined
            ? {
                unit_kind:
                  body.unitKind,
              }
            : {}),
          ...(body.sortOrder !== undefined
            ? {
                sort_order:
                  body.sortOrder,
              }
            : {}),
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", body.id)
        .eq(
          "business_id",
          context.businessId
        );

      if (error) {
        return jsonError(
          error.code === "23505"
            ? "That unit already exists."
            : error.message,
          400
        );
      }

      return NextResponse.json({
        success: true,
      });
    }

    return jsonError(
      "Choose category or unit.",
      400
    );
  } catch (error) {
    return jsonError(
      error instanceof Error
        ? error.message
        : "The option could not be updated.",
      500
    );
  }
}
