import { NextRequest, NextResponse } from "next/server";

import { getCloudRequestContext } from "@/lib/cloud/serverContext";
import { createAdminClient } from "@/lib/supabase/admin";

const fail = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

async function resolveSite(input: {
  businessId: string;
  requestedSiteName: string;
  assignedSiteName?: string;
}) {
  if (
    input.assignedSiteName &&
    input.requestedSiteName.trim().toLowerCase() !==
      input.assignedSiteName.trim().toLowerCase()
  ) {
    return null;
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("sites")
    .select("id, name, active")
    .eq("business_id", input.businessId)
    .eq("name", input.requestedSiteName.trim())
    .eq("active", true)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export async function GET(request: NextRequest) {
  try {
    const context = await getCloudRequestContext();
    if (!context) return fail("Authentication required.", 401);

    const siteName = request.nextUrl.searchParams.get("siteName")?.trim();
    if (!siteName) return fail("Site is required.", 400);

    const site = await resolveSite({
      businessId: context.businessId,
      requestedSiteName: siteName,
      assignedSiteName: context.role === "operations" ? undefined : context.siteName,
    });
    if (!site) return fail("That site is not available to this account.", 403);

    const admin = createAdminClient();
    let query = admin
      .from("handover_versions")
      .select(
        "id, site_name, handover_day, notes, updated_by, created_at, visible_to_chefs"
      )
      .eq("business_id", context.businessId)
      .eq("site_name", site.name)
      .order("created_at", { ascending: false })
      .limit(100);

    if (context.role === "chef") {
      query = query.eq("visible_to_chefs", true);
    }

    const { data, error } = await query;
    if (error) return fail(error.message, 500);
    return NextResponse.json({ history: data ?? [] });
  } catch (error) {
    return fail(
      error instanceof Error
        ? error.message
        : "Handover history could not be loaded.",
      500
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await getCloudRequestContext();
    if (!context) return fail("Authentication required.", 401);
    if (context.role === "chef") {
      return fail("Chef permission does not allow editing handovers.", 403);
    }

    const body = (await request.json()) as {
      siteName?: string;
      day?: "today" | "tomorrow";
      notes?: string[];
      updatedBy?: string;
      visibleToChefs?: boolean;
    };

    const requestedSiteName = body.siteName?.trim();
    if (!requestedSiteName || !body.day) {
      return fail("Site and handover day are required.", 400);
    }

    const site = await resolveSite({
      businessId: context.businessId,
      requestedSiteName,
      assignedSiteName: context.role === "operations" ? undefined : context.siteName,
    });
    if (!site) return fail("That site is not available to this account.", 403);

    const admin = createAdminClient();
    const { error } = await admin.from("handover_versions").insert({
      business_id: context.businessId,
      site_id: site.id,
      site_name: site.name,
      handover_day: body.day,
      notes: (body.notes ?? []).map(String).map((note) => note.trim()).filter(Boolean),
      updated_by: context.staffName ?? body.updatedBy?.trim() ?? "KitchenOps",
      visible_to_chefs: body.visibleToChefs === true,
    });

    if (error) return fail(error.message, 400);
    return NextResponse.json({ success: true });
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Handover could not be saved.",
      500
    );
  }
}
