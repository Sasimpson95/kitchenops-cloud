import { NextRequest, NextResponse } from "next/server";

import { getCloudRequestContext } from "@/lib/cloud/serverContext";
import { createAdminClient } from "@/lib/supabase/admin";

type HandoverDepartment = "boh" | "foh";

const fail = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

function requestedDepartment(
  role: "operations" | "manager" | "foh_manager" | "chef",
  requested?: string | null
): HandoverDepartment | null {
  if (role === "manager" || role === "chef") {
    if (requested && requested !== "boh") return null;
    return "boh";
  }

  if (role === "foh_manager") {
    if (requested && requested !== "foh") return null;
    return "foh";
  }

  if (requested === "boh" || requested === "foh") {
    return requested;
  }

  // Operations defaults to BOH for compatibility with older clients.
  return "boh";
}

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

    const department = requestedDepartment(
      context.role,
      request.nextUrl.searchParams.get("department")
    );

    if (!department) {
      return fail(
        "This account does not have access to that handover department.",
        403
      );
    }

    const site = await resolveSite({
      businessId: context.businessId,
      requestedSiteName: siteName,
      assignedSiteName:
        context.role === "operations" ? undefined : context.siteName,
    });

    if (!site) {
      return fail("That site is not available to this account.", 403);
    }

    const admin = createAdminClient();
    let query = admin
      .from("handover_versions")
      .select(
        "id, site_name, handover_day, handover_department, notes, updated_by, created_at, visible_to_chefs"
      )
      .eq("business_id", context.businessId)
      .eq("site_name", site.name)
      .eq("handover_department", department)
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
      department?: HandoverDepartment;
      notes?: string[];
      updatedBy?: string;
      visibleToChefs?: boolean;
    };

    const requestedSiteName = body.siteName?.trim();
    if (!requestedSiteName || !body.day) {
      return fail("Site and handover day are required.", 400);
    }

    const department = requestedDepartment(context.role, body.department);

    if (!department) {
      return fail(
        "This account does not have permission to edit that handover department.",
        403
      );
    }

    const site = await resolveSite({
      businessId: context.businessId,
      requestedSiteName,
      assignedSiteName:
        context.role === "operations" ? undefined : context.siteName,
    });

    if (!site) {
      return fail("That site is not available to this account.", 403);
    }

    const admin = createAdminClient();
    const { error } = await admin.from("handover_versions").insert({
      business_id: context.businessId,
      site_id: site.id,
      site_name: site.name,
      handover_day: body.day,
      handover_department: department,
      notes: (body.notes ?? [])
        .map(String)
        .map((note) => note.trim())
        .filter(Boolean),
      updated_by:
        context.staffName ?? body.updatedBy?.trim() ?? "KitchenOps",

      // Chef visibility belongs to the kitchen/BOH handover only.
      visible_to_chefs:
        department === "boh" && body.visibleToChefs === true,
    });

    if (error) return fail(error.message, 400);

    return NextResponse.json({ success: true });
  } catch (error) {
    return fail(
      error instanceof Error
        ? error.message
        : "Handover could not be saved.",
      500
    );
  }
}
