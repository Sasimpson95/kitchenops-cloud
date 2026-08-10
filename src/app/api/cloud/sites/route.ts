import { NextRequest, NextResponse } from "next/server";

import { getCloudRequestContext } from "@/lib/cloud/serverContext";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const context = await getCloudRequestContext();
    if (!context) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const includeArchived = request.nextUrl.searchParams.get("includeArchived") === "true";
    const admin = createAdminClient();

    let query = admin
      .from("sites")
      .select("id, name, active")
      .eq("business_id", context.businessId)
      .order("name");

    if (!includeArchived) query = query.eq("active", true);
    if (context.role !== "operations" && context.siteId) {
      query = query.eq("id", context.siteId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ sites: data ?? [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sites could not be loaded." },
      { status: 500 }
    );
  }
}
