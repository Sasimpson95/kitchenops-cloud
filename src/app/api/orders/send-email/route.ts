import { NextRequest, NextResponse } from "next/server";

import { getCloudRequestContext } from "@/lib/cloud/serverContext";
import { createAdminClient } from "@/lib/supabase/admin";

type OrderEmailItem = {
  productName?: unknown;
  orderUnit?: unknown;
  quantity?: unknown;
  unitPrice?: unknown;
};

type OrderEmailPayload = {
  id?: unknown;
  orderNumber?: unknown;
  siteId?: unknown;
  siteName?: unknown;
  supplierId?: unknown;
  supplierName?: unknown;
  requestedDeliveryDate?: unknown;
  notes?: unknown;
  subtotal?: unknown;
  total?: unknown;
  items?: unknown;
};

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function money(value: unknown): string {
  const number = Number(value);
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(Number.isFinite(number) ? number : 0);
}

function positiveNumber(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function normaliseItems(value: unknown): OrderEmailItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is OrderEmailItem =>
      typeof item === "object" && item !== null
  );
}

export async function POST(request: NextRequest) {
  try {
    const context = await getCloudRequestContext();

    if (!context) {
      return fail("Authentication required.", 401);
    }

    if (context.role === "chef") {
      return fail("Chef permission does not include sending purchase orders.", 403);
    }

    const apiKey = process.env.RESEND_API_KEY?.trim();
    const from = process.env.KITCHENOPS_ORDER_FROM_EMAIL?.trim();

    if (!apiKey || !from) {
      return fail(
        "Supplier email is not configured. Add RESEND_API_KEY and KITCHENOPS_ORDER_FROM_EMAIL to the server environment.",
        503
      );
    }

    const payload = (await request.json()) as OrderEmailPayload;

    const orderId = String(payload.id ?? "").trim();
    const orderNumber = String(payload.orderNumber ?? "").trim();
    const siteId = String(payload.siteId ?? "").trim();
    const siteName = String(payload.siteName ?? "").trim();
    const supplierId = Number(payload.supplierId);
    const supplierName = String(payload.supplierName ?? "").trim();
    const requestedDeliveryDate = String(
      payload.requestedDeliveryDate ?? "Not set"
    ).trim();
    const notes = String(payload.notes ?? "").trim();
    const items = normaliseItems(payload.items);

    if (!orderId || !orderNumber || !siteId || !Number.isFinite(supplierId)) {
      return fail("Purchase order details are incomplete.", 400);
    }

    if (items.length === 0) {
      return fail("The purchase order has no items.", 400);
    }

    const admin = createAdminClient();

    const [{ data: site, error: siteError }, { data: supplierRow, error: supplierError }, { data: business, error: businessError }] =
      await Promise.all([
        admin
          .from("sites")
          .select("id, name, active")
          .eq("id", siteId)
          .eq("business_id", context.businessId)
          .maybeSingle(),
        admin
          .from("cloud_suppliers")
          .select("data")
          .eq("business_id", context.businessId)
          .eq("legacy_id", supplierId)
          .maybeSingle(),
        admin
          .from("businesses")
          .select("name")
          .eq("id", context.businessId)
          .maybeSingle(),
      ]);

    if (siteError) throw siteError;
    if (supplierError) throw supplierError;
    if (businessError) throw businessError;

    if (!site || !site.active) {
      return fail("The order references an invalid site.", 400);
    }

    if (context.role === "manager" && context.siteId !== site.id) {
      return fail("Manager permission is limited to the assigned site.", 403);
    }

    const supplier =
      supplierRow?.data &&
      typeof supplierRow.data === "object"
        ? (supplierRow.data as Record<string, unknown>)
        : null;

    if (!supplier) {
      return fail("Supplier could not be found in the current business.", 400);
    }

    const supplierEmail = String(supplier.email ?? "").trim();
    const authoritativeSupplierName =
      String(supplier.name ?? "").trim() || supplierName || "Supplier";

    if (!supplierEmail || !supplierEmail.includes("@")) {
      return fail(
        `${authoritativeSupplierName} does not have a valid ordering email address.`,
        400
      );
    }

    const businessName =
      String(business?.name ?? "").trim() || "KitchenOps customer";

    const itemRows = items
      .map((item) => {
        const quantity = positiveNumber(item.quantity);
        const unitPrice = Number(item.unitPrice);
        const lineTotal =
          Number.isFinite(unitPrice) && unitPrice >= 0
            ? quantity * unitPrice
            : 0;

        return `
          <tr>
            <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;">${escapeHtml(item.productName)}</td>
            <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:right;">${escapeHtml(quantity)} ${escapeHtml(item.orderUnit)}</td>
            <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:right;">${money(item.unitPrice)}</td>
            <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:right;">${money(lineTotal)}</td>
          </tr>`;
      })
      .join("");

    const safeNotes = notes
      ? `<p style="margin:20px 0 0;"><strong>Notes:</strong><br>${escapeHtml(notes).replaceAll("\n", "<br>")}</p>`
      : "";

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;color:#18181b;max-width:720px;margin:0 auto;">
        <div style="background:#5b21b6;color:#fff;padding:24px;border-radius:14px 14px 0 0;">
          <div style="font-size:13px;opacity:.85;">PURCHASE ORDER</div>
          <h1 style="margin:6px 0 0;font-size:26px;">${escapeHtml(orderNumber)}</h1>
        </div>
        <div style="border:1px solid #e5e7eb;border-top:0;padding:24px;border-radius:0 0 14px 14px;">
          <p style="margin-top:0;">Hello ${escapeHtml(authoritativeSupplierName)},</p>
          <p>Please find the purchase order from <strong>${escapeHtml(businessName)}</strong> for <strong>${escapeHtml(site.name || siteName)}</strong>.</p>

          <p><strong>Requested delivery:</strong> ${escapeHtml(requestedDeliveryDate || "Not set")}</p>

          <table style="width:100%;border-collapse:collapse;margin-top:20px;font-size:14px;">
            <thead>
              <tr style="background:#f5f3ff;">
                <th style="padding:10px 8px;text-align:left;">Item</th>
                <th style="padding:10px 8px;text-align:right;">Quantity</th>
                <th style="padding:10px 8px;text-align:right;">Unit price</th>
                <th style="padding:10px 8px;text-align:right;">Total</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>

          <div style="margin-top:20px;text-align:right;">
            <div><strong>Order total: ${money(payload.total ?? payload.subtotal)}</strong></div>
          </div>

          ${safeNotes}

          <p style="margin:28px 0 0;color:#71717a;font-size:12px;">
            Sent from KitchenOps on behalf of ${escapeHtml(businessName)}.
          </p>
        </div>
      </div>`;

    const textLines = [
      `Purchase Order ${orderNumber}`,
      `${businessName} — ${site.name || siteName}`,
      `Requested delivery: ${requestedDeliveryDate || "Not set"}`,
      "",
      ...items.map((item) => {
        const quantity = positiveNumber(item.quantity);
        return `${item.productName ?? "Item"} — ${quantity} ${item.orderUnit ?? ""} @ ${money(item.unitPrice)}`;
      }),
      "",
      `Order total: ${money(payload.total ?? payload.subtotal)}`,
      ...(notes ? ["", `Notes: ${notes}`] : []),
    ];

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "KitchenOps/1.0.4",
        "Idempotency-Key": `kitchenops-order-${orderId}`,
      },
      body: JSON.stringify({
        from,
        to: [supplierEmail],
        subject: `${businessName} Purchase Order ${orderNumber}`,
        html,
        text: textLines.join("\n"),
      }),
    });

    const raw = await resendResponse.text();
    let responseBody: unknown = null;

    try {
      responseBody = raw ? JSON.parse(raw) : null;
    } catch {
      responseBody = raw;
    }

    if (!resendResponse.ok) {
      const providerMessage =
        typeof responseBody === "object" &&
        responseBody !== null &&
        "message" in responseBody
          ? String((responseBody as { message?: unknown }).message ?? "")
          : "";

      return fail(
        providerMessage || "The supplier email could not be sent.",
        resendResponse.status >= 400 && resendResponse.status < 600
          ? resendResponse.status
          : 502
      );
    }

    const emailId =
      typeof responseBody === "object" &&
      responseBody !== null &&
      "id" in responseBody
        ? String((responseBody as { id?: unknown }).id ?? "")
        : "";

    return NextResponse.json({
      sent: true,
      emailId,
      recipient: supplierEmail,
    });
  } catch (error) {
    return fail(
      error instanceof Error
        ? error.message
        : "The supplier email could not be sent.",
      500
    );
  }
}
