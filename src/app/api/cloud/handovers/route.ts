import { NextRequest, NextResponse } from "next/server";
import { getCloudRequestContext } from "@/lib/cloud/serverContext";
import { createAdminClient } from "@/lib/supabase/admin";

const fail = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

export async function GET(request: NextRequest) {
  try {
    const context = await getCloudRequestContext();
    if (!context) return fail("Authentication required.", 401);

    const siteName = request.nextUrl.searchParams.get("siteName");
    if (!siteName) return fail("Site is required.", 400);

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("handover_versions")
      .select(
        "id, site_name, handover_day, notes, updated_by, created_at, visible_to_chefs"
      )
      .eq("business_id", context.businessId)
      .eq("site_name", siteName)
      .order("created_at", { ascending: false })
      .limit(100);

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

    const body = (await request.json()) as {
      siteName?: string;
      day?: "today" | "tomorrow";
      notes?: string[];
      updatedBy?: string;
      visibleToChefs?: boolean;
    };

    if (!body.siteName || !body.day) {
      return fail("Site and handover day are required.", 400);
    }

    const admin = createAdminClient();
    const { error } = await admin.from("handover_versions").insert({
      business_id: context.businessId,
      site_id: context.siteId ?? null,
      site_name: body.siteName,
      handover_day: body.day,
      notes: (body.notes ?? []).filter(Boolean),
      updated_by: body.updatedBy ?? "KitchenOps",
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
