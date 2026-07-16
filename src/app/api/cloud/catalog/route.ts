import { NextRequest, NextResponse } from "next/server";

import { getCloudRequestContext } from "@/lib/cloud/serverContext";
import { createAdminClient } from "@/lib/supabase/admin";

type CatalogPayload = {
  suppliers?: unknown[];
  products?: unknown[];
  storageAreas?: unknown[];
  inventoryStock?: unknown[];
  inventoryMovements?: unknown[];
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  try {
    const context = await getCloudRequestContext();
    if (!context) return jsonError("Authentication required.", 401);

    const admin = createAdminClient();
    const businessId = context.businessId;

    const [suppliers, products, storage, stock, movements] = await Promise.all([
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
      stock.error ||
      movements.error;

    if (firstError) {
      return jsonError(firstError.message, 500);
    }

    const siteFilter = context.role === "operations" ? null : context.siteId;

    return NextResponse.json({
      suppliers: (suppliers.data ?? []).map((row) => row.data),
      products: (products.data ?? []).map((row) => row.data),
      storageAreas: (storage.data ?? [])
        .filter((row) => !siteFilter || row.site_id === siteFilter)
        .map((row) => row.data),
      inventoryStock: (stock.data ?? [])
        .filter((row) => !siteFilter || row.site_id === siteFilter)
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
          if (!siteFilter || typeof row !== "object" || row === null) return true;
          return (row as { siteId?: string }).siteId === siteFilter;
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

    if ((payload.suppliers || payload.products) && context.role !== "operations") {
      return jsonError("Operations permission required for catalogue changes.", 403);
    }

    if (payload.suppliers) {
      const rows = payload.suppliers
        .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
        .map((item) => ({
          business_id: businessId,
          legacy_id: Number(item.id),
          data: item,
          updated_at: new Date().toISOString(),
        }))
        .filter((row) => Number.isFinite(row.legacy_id));

      await admin.from("cloud_suppliers").delete().eq("business_id", businessId);
      if (rows.length) {
        const { error } = await admin.from("cloud_suppliers").insert(rows);
        if (error) throw error;
      }
    }

    if (payload.products) {
      const rows = payload.products
        .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
        .map((item) => ({
          business_id: businessId,
          legacy_id: Number(item.id),
          data: item,
          updated_at: new Date().toISOString(),
        }))
        .filter((row) => Number.isFinite(row.legacy_id));

      await admin.from("cloud_products").delete().eq("business_id", businessId);
      if (rows.length) {
        const { error } = await admin.from("cloud_products").insert(rows);
        if (error) throw error;
      }
    }

    if (payload.storageAreas) {
      const areas = payload.storageAreas.filter(
        (item): item is Record<string, unknown> => typeof item === "object" && item !== null
      );

      const allowedAreas = context.role === "operations"
        ? areas
        : areas.filter((area) => area.siteId === context.siteId);

      if (context.role === "operations") {
        await admin.from("cloud_storage_areas").delete().eq("business_id", businessId);
      } else if (context.siteId) {
        await admin
          .from("cloud_storage_areas")
          .delete()
          .eq("business_id", businessId)
          .eq("site_id", context.siteId);
      }

      const rows = allowedAreas.map((area) => ({
        business_id: businessId,
        site_id: String(area.siteId),
        external_id: String(area.id),
        data: area,
        updated_at: new Date().toISOString(),
      }));

      if (rows.length) {
        const { error } = await admin.from("cloud_storage_areas").insert(rows);
        if (error) throw error;
      }
    }

    if (payload.inventoryStock) {
      const stock = payload.inventoryStock.filter(
        (item): item is Record<string, unknown> => typeof item === "object" && item !== null
      );
      const allowedStock = context.role === "operations"
        ? stock
        : stock.filter((item) => item.siteId === context.siteId);

      if (context.role === "operations") {
        await admin.from("cloud_inventory_stock").delete().eq("business_id", businessId);
      } else if (context.siteId) {
        await admin
          .from("cloud_inventory_stock")
          .delete()
          .eq("business_id", businessId)
          .eq("site_id", context.siteId);
      }

      const rows = allowedStock.map((item) => ({
        business_id: businessId,
        site_id: String(item.siteId),
        product_legacy_id: Number(item.productId),
        quantity: Number(item.quantity) || 0,
        updated_at: String(item.updatedAt || new Date().toISOString()),
      }));

      if (rows.length) {
        const { error } = await admin.from("cloud_inventory_stock").insert(rows);
        if (error) throw error;
      }
    }

    if (payload.inventoryMovements) {
      const movements = payload.inventoryMovements.filter(
        (item): item is Record<string, unknown> => typeof item === "object" && item !== null
      );
      const allowed = context.role === "operations"
        ? movements
        : movements.filter((item) => item.siteId === context.siteId);

      if (context.role === "operations") {
        await admin.from("cloud_inventory_movements").delete().eq("business_id", businessId);
      } else if (context.siteId) {
        await admin
          .from("cloud_inventory_movements")
          .delete()
          .eq("business_id", businessId)
          .eq("site_id", context.siteId);
      }

      const rows = allowed.map((item) => ({
        id: String(item.id),
        business_id: businessId,
        site_id: String(item.siteId),
        product_legacy_id: Number(item.productId),
        movement_type: String(item.movementType || "Adjustment"),
        quantity: Number(item.quantity) || 0,
        data: item,
        created_at: String(item.createdAt || new Date().toISOString()),
      }));

      if (rows.length) {
        const { error } = await admin.from("cloud_inventory_movements").insert(rows);
        if (error) throw error;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Cloud catalogue could not be saved.",
      500
    );
  }
}
