import { NextRequest, NextResponse } from "next/server";

import { getCloudRequestContext, getContextSiteAccessKeys } from "@/lib/cloud/serverContext";
import { siteNameToKey } from "@/lib/siteKey";
import { createAdminClient } from "@/lib/supabase/admin";

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function resolveOperationsSite(
  businessId: string,
  requestedSiteKey: string
): Promise<{ id: string; name: string; key: string } | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("sites")
    .select("id, name")
    .eq("business_id", businessId)
    .eq("active", true);
  if (error) throw error;

  const site = (data ?? []).find(
    (item: { id: string; name: string }) =>
      item.id === requestedSiteKey || siteNameToKey(item.name) === requestedSiteKey
  );
  return site ? { ...site, key: site.id } : null;
}

export async function GET(request: NextRequest) {
  try {
    const context = await getCloudRequestContext();
    if (!context) return fail("Authentication required.", 401);
    if (context.role === "chef") {
      return fail("Chef permission does not include purchasing invoices.", 403);
    }

    const requestedSiteId = request.nextUrl.searchParams.get("siteId");
    const admin = createAdminClient();
    let query = admin
      .from("received_invoices")
      .select(
        "id, site_id, site_name, supplier_id, supplier_name, invoice_number, invoice_date, total, received_by, created_at, received_invoice_lines(*)"
      )
      .eq("business_id", context.businessId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (context.role !== "operations") {
      const accessKeys = getContextSiteAccessKeys(context);
      if (accessKeys.length === 0) return fail("A valid site is required.", 403);
      query = query.in("site_id", accessKeys);
    } else if (requestedSiteId && requestedSiteId !== "all-sites") {
      query = query.eq("site_id", requestedSiteId);
    }

    const { data, error } = await query;
    if (error) return fail(error.message, 500);
    return NextResponse.json({ invoices: data ?? [] });
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Invoices could not be loaded.",
      500
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await getCloudRequestContext();
    if (!context) return fail("Authentication required.", 401);
    if (context.role === "chef") {
      return fail("Chef permission does not include receiving invoices.", 403);
    }

    const body = (await request.json()) as {
      siteId?: string;
      siteName?: string;
      supplierId?: number;
      supplierName?: string;
      invoiceNumber?: string;
      invoiceDate?: string;
      total?: number;
      receivedBy?: string;
      lines?: Array<{
        productId: number;
        productName: string;
        purchaseUnits: number;
        unitPrice: number;
        lineTotal: number;
      }>;
    };

    const requestedKey = body.siteId?.trim() || "";
    let siteKey = context.siteId || context.siteKey || "";
    let siteName = context.siteName || "";

    if (context.role === "operations") {
      if (!requestedKey || requestedKey === "all-sites") {
        return fail("Select a site before receiving an invoice.", 400);
      }
      const site = await resolveOperationsSite(context.businessId, requestedKey);
      if (!site) return fail("Select a valid KitchenOps site.", 400);
      siteKey = site.key;
      siteName = site.name;
    }

    if (!siteKey) return fail("Select a site before receiving an invoice.", 400);
    if (!body.supplierName || !body.invoiceNumber || !body.invoiceDate || !body.lines?.length) {
      return fail("Complete the supplier, invoice details and product lines.", 400);
    }

    const admin = createAdminClient();
    const { data: invoice, error: invoiceError } = await admin
      .from("received_invoices")
      .insert({
        business_id: context.businessId,
        site_id: siteKey,
        site_name: siteName || body.siteName || siteKey,
        supplier_id: body.supplierId ?? null,
        supplier_name: body.supplierName.trim(),
        invoice_number: body.invoiceNumber.trim(),
        invoice_date: body.invoiceDate,
        total: Number(body.total) || 0,
        received_by: context.staffName ?? body.receivedBy?.trim() ?? "KitchenOps",
      })
      .select("id")
      .single();

    if (invoiceError || !invoice) {
      return fail(invoiceError?.message ?? "Invoice could not be created.", 400);
    }

    const rows = body.lines.map((line) => ({
      invoice_id: invoice.id,
      product_legacy_id: Number(line.productId),
      product_name: String(line.productName),
      purchase_units: Number(line.purchaseUnits),
      unit_price: Number(line.unitPrice),
      line_total: Number(line.lineTotal),
    }));

    const { error: lineError } = await admin.from("received_invoice_lines").insert(rows);
    if (lineError) return fail(lineError.message, 400);

    return NextResponse.json({ success: true, id: invoice.id });
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Invoice could not be received.",
      500
    );
  }
}
