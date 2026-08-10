import { NextRequest, NextResponse } from "next/server";

import {
  getCloudRequestContext,
  getContextSiteAccessKeys,
} from "@/lib/cloud/serverContext";
import { siteNameToKey } from "@/lib/siteKey";
import { createAdminClient } from "@/lib/supabase/admin";

type CatalogPayload = {
  suppliers?: unknown[];
  products?: unknown[];
  storageAreas?: unknown[];
  recipes?: unknown[];
  productLocations?: unknown[];
};

type CatalogDeleteType =
  | "product"
  | "supplier"
  | "storageArea"
  | "recipe"
  | "productLocation";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function asObjectArray(values: unknown[] | undefined): Record<string, unknown>[] {
  return (values ?? []).filter(
    (item): item is Record<string, unknown> => typeof item === "object" && item !== null
  );
}

function recipeKey(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

export async function GET() {
  try {
    const context = await getCloudRequestContext();
    if (!context) return jsonError("Authentication required.", 401);

    const admin = createAdminClient();
    const businessId = context.businessId;

    const [suppliers, products, storage, recipes, locations, stock, movements] =
      await Promise.all([
        admin
          .from("cloud_suppliers")
          .select("data")
          .eq("business_id", businessId)
          .order("legacy_id"),
        admin
          .from("cloud_products")
          .select("data")
          .eq("business_id", businessId)
          .order("legacy_id"),
        admin
          .from("cloud_storage_areas")
          .select("data, site_id")
          .eq("business_id", businessId),
        admin
          .from("cloud_recipes")
          .select("data")
          .eq("business_id", businessId)
          .order("recipe_key"),
        admin
          .from("cloud_product_locations")
          .select("data, site_id")
          .eq("business_id", businessId),
        admin
          .from("cloud_inventory_stock")
          .select("site_id, product_legacy_id, quantity, updated_at")
          .eq("business_id", businessId),
        admin
          .from("cloud_inventory_movements")
          .select("data")
          .eq("business_id", businessId)
          .order("created_at", { ascending: false })
          .limit(2000),
      ]);

    const firstError =
      suppliers.error ||
      products.error ||
      storage.error ||
      recipes.error ||
      locations.error ||
      stock.error ||
      movements.error;

    if (firstError) return jsonError(firstError.message, 500);

    const accessKeys =
      context.role === "operations" ? [] : getContextSiteAccessKeys(context);
    const siteAllowed = (siteId: string): boolean =>
      context.role === "operations" || accessKeys.includes(siteId);

    return NextResponse.json({
      suppliers: (suppliers.data ?? []).map((row) => row.data),
      products: (products.data ?? []).map((row) => row.data),
      storageAreas: (storage.data ?? [])
        .filter((row) => siteAllowed(String(row.site_id)))
        .map((row) => row.data),
      recipes: (recipes.data ?? []).map((row) => row.data),
      productLocations: (locations.data ?? [])
        .filter((row) => siteAllowed(String(row.site_id)))
        .map((row) => row.data),
      inventoryStock: (stock.data ?? [])
        .filter((row) => siteAllowed(String(row.site_id)))
        .map((row) => ({
          businessId,
          siteId: row.site_id,
          productId: row.product_legacy_id,
          quantity: Number(row.quantity),
          updatedAt: row.updated_at,
        })),
      inventoryMovements: (movements.data ?? [])
        .map((row) => row.data)
        .filter((row) => {
          if (context.role === "operations") return true;
          if (typeof row !== "object" || row === null) return false;
          return accessKeys.includes(String((row as { siteId?: unknown }).siteId ?? ""));
        }),
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Cloud catalogue could not be loaded.",
      500
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const context = await getCloudRequestContext();
    if (!context) return jsonError("Authentication required.", 401);

    const payload = (await request.json()) as CatalogPayload;
    const admin = createAdminClient();
    const businessId = context.businessId;
    const accessKeys = getContextSiteAccessKeys(context);
    const { data: siteRows, error: siteError } = await admin
      .from("sites")
      .select("id, name")
      .eq("business_id", businessId);
    if (siteError) throw siteError;

    const siteByAccessKey = new Map<string, string>();
    for (const site of siteRows ?? []) {
      siteByAccessKey.set(String(site.id), String(site.id));
      siteByAccessKey.set(siteNameToKey(String(site.name)), String(site.id));
    }

    const canonicalSiteId = (value: unknown): string =>
      siteByAccessKey.get(String(value ?? "").trim()) ?? "";

    if (
      (payload.suppliers || payload.products || payload.recipes) &&
      context.role !== "operations"
    ) {
      return jsonError("Operations permission required for catalogue changes.", 403);
    }

    if (payload.suppliers) {
      const rows = asObjectArray(payload.suppliers)
        .map((item) => ({
          business_id: businessId,
          legacy_id: Number(item.id),
          data: item,
          updated_at: new Date().toISOString(),
        }))
        .filter((row) => Number.isFinite(row.legacy_id));

      if (rows.length > 0) {
        const { error } = await admin
          .from("cloud_suppliers")
          .upsert(rows, { onConflict: "business_id,legacy_id" });
        if (error) throw error;
      }
    }

    if (payload.products) {
      const rows = asObjectArray(payload.products)
        .map((item) => ({
          business_id: businessId,
          legacy_id: Number(item.id),
          data: item,
          updated_at: new Date().toISOString(),
        }))
        .filter((row) => Number.isFinite(row.legacy_id));

      if (rows.length > 0) {
        const { error } = await admin
          .from("cloud_products")
          .upsert(rows, { onConflict: "business_id,legacy_id" });
        if (error) throw error;
      }
    }

    if (payload.storageAreas) {
      if (context.role === "chef") {
        return jsonError("Chef permission does not include storage area changes.", 403);
      }

      const areas = asObjectArray(payload.storageAreas);
      const rows = areas
        .map((area) => {
          const requestedSiteId = String(area.siteId ?? "").trim();
          const siteId = canonicalSiteId(requestedSiteId);
          if (!siteId) return null;
          if (
            context.role !== "operations" &&
            (!accessKeys.includes(requestedSiteId) || siteId !== context.siteId)
          ) {
            return null;
          }

          return {
            business_id: businessId,
            site_id: siteId,
            external_id: String(area.id ?? "").trim(),
            data: { ...area, siteId },
            updated_at: new Date().toISOString(),
          };
        })
        .filter(
          (row): row is NonNullable<typeof row> =>
            row !== null && Boolean(row.external_id)
        );

      if (rows.length > 0) {
        const { error } = await admin
          .from("cloud_storage_areas")
          .upsert(rows, { onConflict: "business_id,site_id,external_id" });
        if (error) throw error;
      }
    }

    if (payload.recipes) {
      const rows = asObjectArray(payload.recipes)
        .map((recipe) => ({
          business_id: businessId,
          recipe_key: recipeKey(recipe.name),
          data: recipe,
          updated_at: new Date().toISOString(),
        }))
        .filter((row) => row.recipe_key);

      if (rows.length > 0) {
        const { error } = await admin
          .from("cloud_recipes")
          .upsert(rows, { onConflict: "business_id,recipe_key" });
        if (error) throw error;
      }
    }

    if (payload.productLocations) {
      if (context.role === "chef") {
        return jsonError("Chef permission does not include storage assignments.", 403);
      }

      const locations = asObjectArray(payload.productLocations);
      const rows = locations
        .map((location) => {
          const requestedSiteId = String(location.siteId ?? "").trim();
          const siteId = canonicalSiteId(requestedSiteId);
          if (!siteId) return null;
          if (
            context.role !== "operations" &&
            (!accessKeys.includes(requestedSiteId) || siteId !== context.siteId)
          ) {
            return null;
          }

          return {
            business_id: businessId,
            site_id: siteId,
            external_id: String(location.id ?? "").trim(),
            data: { ...location, siteId },
            updated_at: new Date().toISOString(),
          };
        })
        .filter(
          (row): row is NonNullable<typeof row> =>
            row !== null && Boolean(row.external_id)
        );

      if (rows.length > 0) {
        const { error } = await admin
          .from("cloud_product_locations")
          .upsert(rows, { onConflict: "business_id,site_id,external_id" });
        if (error) throw error;
      }
    }

    // Inventory is intentionally read-only on this catalogue endpoint.
    // All stock changes go through /api/cloud/inventory/movements so concurrent
    // devices apply atomic deltas rather than replacing stock snapshots.

    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Cloud catalogue could not be saved.",
      500
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const context = await getCloudRequestContext();
    if (!context) return jsonError("Authentication required.", 401);

    const body = (await request.json()) as {
      type?: CatalogDeleteType;
      ids?: string[];
    };
    const ids = Array.isArray(body.ids)
      ? body.ids.map(String).map((id) => id.trim()).filter(Boolean)
      : [];
    if (!body.type || ids.length === 0) {
      return jsonError("Catalogue deletion is incomplete.", 400);
    }

    const globalMasterData = new Set<CatalogDeleteType>([
      "product",
      "supplier",
      "recipe",
    ]);
    if (globalMasterData.has(body.type) && context.role !== "operations") {
      return jsonError("Operations permission required for catalogue deletion.", 403);
    }
    if (context.role === "chef") {
      return jsonError("Chef permission does not include catalogue deletion.", 403);
    }

    const admin = createAdminClient();
    const accessKeys = getContextSiteAccessKeys(context);

    if (body.type === "product") {
      const numericIds = ids.map(Number).filter(Number.isFinite);
      const { error } = await admin
        .from("cloud_products")
        .delete()
        .eq("business_id", context.businessId)
        .in("legacy_id", numericIds);
      if (error) throw error;
    } else if (body.type === "supplier") {
      const numericIds = ids.map(Number).filter(Number.isFinite);
      const { error } = await admin
        .from("cloud_suppliers")
        .delete()
        .eq("business_id", context.businessId)
        .in("legacy_id", numericIds);
      if (error) throw error;
    } else if (body.type === "storageArea") {
      if (context.role !== "operations") {
        const { data: rows, error: readError } = await admin
          .from("cloud_storage_areas")
          .select("site_id")
          .eq("business_id", context.businessId)
          .in("external_id", ids);
        if (readError) throw readError;
        if ((rows ?? []).some((row) => !accessKeys.includes(String(row.site_id)))) {
          return jsonError("That storage area belongs to another site.", 403);
        }
      }
      const deleteQuery = admin
        .from("cloud_storage_areas")
        .delete()
        .eq("business_id", context.businessId)
        .in("external_id", ids);
      const { error } =
        context.role === "operations"
          ? await deleteQuery
          : await deleteQuery.in("site_id", accessKeys);
      if (error) throw error;
    } else if (body.type === "recipe") {
      const { error } = await admin
        .from("cloud_recipes")
        .delete()
        .eq("business_id", context.businessId)
        .in("recipe_key", ids.map(recipeKey));
      if (error) throw error;
    } else {
      if (context.role !== "operations") {
        const { data: rows, error: readError } = await admin
          .from("cloud_product_locations")
          .select("site_id")
          .eq("business_id", context.businessId)
          .in("external_id", ids);
        if (readError) throw readError;
        if ((rows ?? []).some((row) => !accessKeys.includes(String(row.site_id)))) {
          return jsonError("That storage assignment belongs to another site.", 403);
        }
      }
      const deleteQuery = admin
        .from("cloud_product_locations")
        .delete()
        .eq("business_id", context.businessId)
        .in("external_id", ids);
      const { error } =
        context.role === "operations"
          ? await deleteQuery
          : await deleteQuery.in("site_id", accessKeys);
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Catalogue record could not be deleted.",
      500
    );
  }
}
