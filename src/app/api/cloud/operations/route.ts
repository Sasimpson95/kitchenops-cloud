import { NextRequest, NextResponse } from "next/server";

import {
  getCloudRequestContext,
  getContextSiteAccessKeys,
  type CloudRequestContext,
} from "@/lib/cloud/serverContext";
import { siteNameToKey } from "@/lib/siteKey";
import { createAdminClient } from "@/lib/supabase/admin";

type OperationalKind =
  | "prep"
  | "prep_history"
  | "orders"
  | "waste"
  | "stocktakes"
  | "transfers"
  | "handovers";

type OperationalChange = {
  kind?: OperationalKind;
  id?: string;
  siteKeys?: string[];
  data?: unknown;
  deleted?: boolean;
  expectedRevision?: string | null;
  // Compatibility with RC4 clients while browsers/app WebViews refresh.
  expectedUpdatedAt?: string | null;
};

type ExistingOperationalRecord = {
  kind: OperationalKind;
  record_id: string;
  site_keys: string[];
  data: unknown;
  updated_at: string;
};

type RevisionAck = {
  kind: OperationalKind;
  id: string;
  revision: string | null;
};

const KINDS = new Set<OperationalKind>([
  "prep",
  "prep_history",
  "orders",
  "waste",
  "stocktakes",
  "transfers",
  "handovers",
]);

const CHEF_READ_KINDS = new Set<OperationalKind>([
  "prep",
  "prep_history",
  "waste",
  "handovers",
]);

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function prepConflict(id: string) {
  return NextResponse.json(
    {
      error:
        "This prep changed on another device. KitchenOps will refresh the latest version before another edit is saved.",
      conflict: { kind: "prep", id },
    },
    { status: 409 }
  );
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

function deriveSiteKeys(
  kind: OperationalKind,
  data: Record<string, unknown>
): string[] {
  let values: string[];

  if (kind === "prep" || kind === "prep_history") {
    values = [siteNameToKey(String(data.site ?? ""))];
  } else if (kind === "handovers") {
    values = [siteNameToKey(String(data.siteName ?? ""))];
  } else if (kind === "transfers") {
    values = [String(data.fromSiteId ?? ""), String(data.toSiteId ?? "")];
  } else {
    values = [String(data.siteId ?? "")];
  }

  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function samePrimitive(a: unknown, b: unknown): boolean {
  return a === b || (a == null && b == null);
}

function recordUpdatedAt(data: Record<string, unknown> | null): string | null {
  if (!data || typeof data.updatedAt !== "string") return null;
  const value = data.updatedAt.trim();
  return value || null;
}

function nextRevision(previous?: string | null): string {
  const previousMs = previous ? Date.parse(previous) : Number.NaN;
  const timestamp = Number.isFinite(previousMs)
    ? Math.max(Date.now(), previousMs + 1)
    : Date.now();
  return new Date(timestamp).toISOString();
}

function resolveExpectedPrepRevision(
  existing: ExistingOperationalRecord | null,
  change: OperationalChange
): { valid: true; revision: string | null } | { valid: false } {
  if (change.expectedRevision !== undefined) {
    if (change.expectedRevision === null) {
      return { valid: true, revision: null };
    }
    const revision = change.expectedRevision.trim();
    return revision ? { valid: true, revision } : { valid: false };
  }

  // RC4 used the prep payload's updatedAt value as its comparison token.
  // Validate that legacy token, then convert it to the server row revision so
  // the actual mutation can still be applied atomically.
  if (change.expectedUpdatedAt !== undefined) {
    if (!existing) {
      return change.expectedUpdatedAt === null
        ? { valid: true, revision: null }
        : { valid: false };
    }
    if (recordUpdatedAt(asRecord(existing.data)) !== change.expectedUpdatedAt) {
      return { valid: false };
    }
    return { valid: true, revision: existing.updated_at };
  }

  return { valid: false };
}

function validateChefPrepUpdate(
  existingData: Record<string, unknown>,
  nextData: Record<string, unknown>,
  staffName?: string
): string | null {
  const immutable = [
    "id",
    "site",
    "name",
    "emoji",
    "planned",
    "day",
    "scheduledDate",
    "createdAt",
    "approvedBy",
    "completedAt",
  ];
  for (const key of immutable) {
    if (!samePrimitive(existingData[key], nextData[key])) {
      return "Chef permission does not allow changing the prep plan.";
    }
  }

  if (existingData.status !== "planned" || nextData.status !== "awaitingApproval") {
    return "Chef permission only allows submitting planned prep for approval.";
  }

  const produced = Number(nextData.produced);
  if (!Number.isFinite(produced) || produced <= 0) {
    return "Enter how many batches were prepared.";
  }

  if (staffName && String(nextData.chef ?? "").trim() !== staffName.trim()) {
    return "Prep must be submitted as the signed-in staff member.";
  }

  return null;
}

async function canAccessExistingRecord(input: {
  context: CloudRequestContext;
  kind: OperationalKind;
  id: string;
}): Promise<ExistingOperationalRecord | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("cloud_operational_records")
    .select("kind, record_id, site_keys, data, updated_at")
    .eq("business_id", input.context.businessId)
    .eq("kind", input.kind)
    .eq("record_id", input.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  if (input.context.role !== "operations") {
    const accessKeys = getContextSiteAccessKeys(input.context);
    if (!data.site_keys.some((key: string) => accessKeys.includes(key))) return null;
  }

  return data as ExistingOperationalRecord;
}

export async function GET() {
  try {
    const context = await getCloudRequestContext();
    if (!context) return fail("Authentication required.", 401);

    const admin = createAdminClient();
    let query = admin
      .from("cloud_operational_records")
      .select("kind, record_id, site_keys, data, updated_at")
      .eq("business_id", context.businessId)
      .order("updated_at", { ascending: false });

    if (context.role !== "operations") {
      const accessKeys = getContextSiteAccessKeys(context);
      if (accessKeys.length === 0) return fail("A valid site is required.", 403);
      query = query.overlaps("site_keys", accessKeys);
    }

    const { data, error } = await query;
    if (error) return fail(error.message, 500);

    const records = (data ?? []).filter((row: { kind: string }) => {
      if (context.role !== "chef") return true;
      return CHEF_READ_KINDS.has(row.kind as OperationalKind);
    });

    return NextResponse.json({ records });
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Operational data could not be loaded.",
      500
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const context = await getCloudRequestContext();
    if (!context) return fail("Authentication required.", 401);

    const body = (await request.json()) as { changes?: OperationalChange[] };
    if (!Array.isArray(body.changes) || body.changes.length === 0) {
      return fail("No operational changes were supplied.", 400);
    }
    if (body.changes.length > 250) {
      return fail("Too many operational changes in one request.", 400);
    }

    const admin = createAdminClient();
    const { data: businessSites, error: sitesError } = await admin
      .from("sites")
      .select("id, name")
      .eq("business_id", context.businessId);
    if (sitesError) throw sitesError;

    const validSiteKeys = new Set<string>();
    for (const site of businessSites ?? []) {
      validSiteKeys.add(String(site.id));
      validSiteKeys.add(siteNameToKey(String(site.name)));
    }

    const revisions: RevisionAck[] = [];

    for (const rawChange of body.changes) {
      const kind = rawChange.kind;
      const id = rawChange.id?.trim();

      if (!kind || !KINDS.has(kind) || !id) {
        return fail("An operational record was invalid.", 400);
      }

      if (rawChange.deleted) {
        if (context.role === "chef") {
          return fail("Chef permission does not allow deleting operational records.", 403);
        }

        const existing = await canAccessExistingRecord({ context, kind, id });
        if (!existing) continue;

        if (kind === "prep") {
          const expected = resolveExpectedPrepRevision(existing, rawChange);
          if (!expected.valid || !expected.revision) return prepConflict(id);

          const { data: deleted, error } = await admin
            .from("cloud_operational_records")
            .delete()
            .eq("business_id", context.businessId)
            .eq("kind", kind)
            .eq("record_id", id)
            .eq("updated_at", expected.revision)
            .select("updated_at")
            .maybeSingle();
          if (error) throw error;
          if (!deleted) return prepConflict(id);
          revisions.push({ kind, id, revision: null });
          continue;
        }

        const { error } = await admin
          .from("cloud_operational_records")
          .delete()
          .eq("business_id", context.businessId)
          .eq("kind", kind)
          .eq("record_id", id);
        if (error) throw error;
        continue;
      }

      const data = asRecord(rawChange.data);
      if (!data) return fail("Operational record data is required.", 400);

      const siteKeys = deriveSiteKeys(kind, data);
      if (siteKeys.length === 0) return fail("Operational record site is required.", 400);
      if (String(data.id ?? "").trim() !== id) {
        return fail("Operational record identity does not match its payload.", 400);
      }
      if (siteKeys.some((key) => !validSiteKeys.has(key))) {
        return fail("Operational record references an invalid site.", 400);
      }
      if (kind === "transfers" && siteKeys.length !== 2) {
        return fail("A transfer requires two different KitchenOps sites.", 400);
      }

      if (context.role !== "operations") {
        const accessKeys = getContextSiteAccessKeys(context);
        const belongsToAssignedSite = siteKeys.some((key) => accessKeys.includes(key));
        if (!belongsToAssignedSite) {
          return fail("This record belongs to another KitchenOps site.", 403);
        }
        if (kind !== "transfers" && (siteKeys.length !== 1 || !accessKeys.includes(siteKeys[0]))) {
          return fail("This record belongs to another KitchenOps site.", 403);
        }
      }

      if (kind === "prep") {
        const existingPrepRecord = await canAccessExistingRecord({ context, kind, id });
        const expected = resolveExpectedPrepRevision(existingPrepRecord, rawChange);
        if (!expected.valid) return prepConflict(id);

        if (context.role === "chef") {
          if (!existingPrepRecord) {
            return fail("Chef permission does not allow creating prep items.", 403);
          }
          const currentData = asRecord(existingPrepRecord.data);
          if (!currentData) return fail("The prep record is invalid.", 409);
          const validationError = validateChefPrepUpdate(currentData, data, context.staffName);
          if (validationError) return fail(validationError, 403);
        }

        if (existingPrepRecord) {
          if (!expected.revision) return prepConflict(id);
          const revision = nextRevision(existingPrepRecord.updated_at);
          const { data: updated, error } = await admin
            .from("cloud_operational_records")
            .update({
              site_keys: siteKeys,
              data,
              updated_at: revision,
            })
            .eq("business_id", context.businessId)
            .eq("kind", kind)
            .eq("record_id", id)
            .eq("updated_at", expected.revision)
            .select("updated_at")
            .maybeSingle();
          if (error) throw error;
          if (!updated) return prepConflict(id);
          revisions.push({ kind, id, revision: String(updated.updated_at) });
          continue;
        }

        if (expected.revision !== null) return prepConflict(id);
        if (context.role === "chef") {
          return fail("Chef permission does not allow creating prep items.", 403);
        }

        const revision = nextRevision();
        const { data: inserted, error } = await admin
          .from("cloud_operational_records")
          .insert({
            business_id: context.businessId,
            kind,
            record_id: id,
            site_keys: siteKeys,
            data,
            updated_at: revision,
          })
          .select("updated_at")
          .single();

        if (error) {
          if (error.code === "23505") return prepConflict(id);
          throw error;
        }
        revisions.push({ kind, id, revision: String(inserted.updated_at) });
        continue;
      }

      if (context.role === "chef") {
        if (kind === "waste") {
          data.recordedBy = context.staffName ?? data.recordedBy;
          data.businessId = context.businessId;
          data.siteId = context.siteId ?? data.siteId;
          data.siteName = context.siteName ?? data.siteName;
          const existing = await canAccessExistingRecord({ context, kind, id });
          if (existing) return fail("Waste records cannot be edited after submission.", 403);
        } else {
          return fail("Chef permission does not allow this change.", 403);
        }
      }

      const { error } = await admin.from("cloud_operational_records").upsert(
        {
          business_id: context.businessId,
          kind,
          record_id: id,
          site_keys: siteKeys,
          data,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "business_id,kind,record_id" }
      );
      if (error) throw error;
    }

    return NextResponse.json({ success: true, revisions });
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Operational data could not be saved.",
      500
    );
  }
}
