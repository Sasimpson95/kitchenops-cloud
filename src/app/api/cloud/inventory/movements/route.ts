import { NextRequest, NextResponse } from "next/server";

import { getCloudRequestContext, getContextSiteAccessKeys } from "@/lib/cloud/serverContext";
import { siteNameToKey } from "@/lib/siteKey";
import { createAdminClient } from "@/lib/supabase/admin";

type MovementBody = {
  id?: string;
  siteId?: string;
  productId?: number;
  productName?: string;
  quantity?: number;
  movementType?: string;
  referenceId?: string;
  referenceNumber?: string;
  createdAt?: string;
};

const MOVEMENT_TYPES = new Set([
  "Delivery",
  "Production",
  "Waste",
  "Stocktake",
  "Adjustment",
  "Transfer Out",
  "Transfer In",
]);

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  try {
    const context = await getCloudRequestContext();
    if (!context) return fail("Authentication required.", 401);

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("cloud_inventory_stock")
      .select("site_id, product_legacy_id, quantity, updated_at")
      .eq("business_id", context.businessId);

    if (error) return fail(error.message, 500);

    const accessKeys =
      context.role === "operations" ? [] : getContextSiteAccessKeys(context);
    const stock = (data ?? [])
      .filter(
        (row) =>
          context.role === "operations" ||
          accessKeys.includes(String(row.site_id))
      )
      .map((row) => ({
        businessId: context.businessId,
        siteId: String(row.site_id),
        productId: Number(row.product_legacy_id),
        quantity: Number(row.quantity),
        updatedAt: String(row.updated_at),
      }));

    return NextResponse.json({ stock });
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Inventory could not be loaded.",
      500
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await getCloudRequestContext();
    if (!context) return fail("Authentication required.", 401);

    const body = (await request.json()) as { movements?: MovementBody[] };
    if (!Array.isArray(body.movements) || body.movements.length === 0) {
      return fail("At least one inventory movement is required.", 400);
    }
    if (body.movements.length > 100) {
      return fail("Too many inventory movements in one request.", 400);
    }

    const admin = createAdminClient();
    const { data: siteRows, error: siteError } = await admin
      .from("sites")
      .select("id, name")
      .eq("business_id", context.businessId);

    if (siteError) throw siteError;

    const siteByAccessKey = new Map<string, string>();
    for (const site of siteRows ?? []) {
      siteByAccessKey.set(String(site.id), String(site.id));
      siteByAccessKey.set(siteNameToKey(String(site.name)), String(site.id));
    }

    const requestedProductIds = Array.from(
      new Set(body.movements.map((movement) => Number(movement.productId)).filter(Number.isInteger))
    );
    const { data: productRows, error: productError } = requestedProductIds.length
      ? await admin
          .from("cloud_products")
          .select("legacy_id")
          .eq("business_id", context.businessId)
          .in("legacy_id", requestedProductIds)
      : { data: [], error: null };
    if (productError) throw productError;
    const validProductIds = new Set((productRows ?? []).map((row) => Number(row.legacy_id)));

    const movements = body.movements.map((movement) => {
      const id = movement.id?.trim();
      const requestedSiteId = movement.siteId?.trim();
      const siteId = requestedSiteId
        ? siteByAccessKey.get(requestedSiteId)
        : undefined;
      const productId = Number(movement.productId);
      const quantity = Number(movement.quantity);
      const movementType = movement.movementType?.trim() || "Adjustment";

      if (
        !id ||
        !requestedSiteId ||
        !siteId ||
        !Number.isInteger(productId) ||
        productId <= 0 ||
        !validProductIds.has(productId) ||
        !Number.isFinite(quantity) ||
        quantity === 0 ||
        !MOVEMENT_TYPES.has(movementType)
      ) {
        throw new Error("An inventory movement is invalid.");
      }

      if (context.role !== "operations") {
        const assignedSiteId = context.siteId;
        const suppliedMatchesSession = getContextSiteAccessKeys(context).includes(
          requestedSiteId
        );
        if (!assignedSiteId || !suppliedMatchesSession || siteId !== assignedSiteId) {
          throw new Error("Inventory can only be changed for your assigned site.");
        }
      }

      if (context.role === "chef" && movementType !== "Waste") {
        throw new Error("Chef permission only allows waste inventory movements.");
      }

      return {
        id,
        businessId: context.businessId,
        siteId,
        productId,
        productName: movement.productName?.trim() || `Product ${productId}`,
        quantity,
        movementType,
        referenceId: movement.referenceId?.trim() || "",
        referenceNumber: movement.referenceNumber?.trim() || "",
        createdAt: movement.createdAt || new Date().toISOString(),
      };
    });
    const { data, error } = await admin.rpc("apply_cloud_inventory_movements", {
      requested_business_id: context.businessId,
      requested_movements: movements,
    });

    if (error) {
      return fail(error.message, 409);
    }

    return NextResponse.json({ success: true, stock: data ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Inventory could not be updated.";
    const status = message.includes("assigned site") || message.includes("permission") ? 403 : 400;
    return fail(message, status);
  }
}
