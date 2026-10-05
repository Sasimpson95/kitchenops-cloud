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
  } else if (kind === "orders" && data.orderType === "internal" && data.status !== "Draft") {
    values = [String(data.siteId ?? ""), String(data.supplyingSiteId ?? "")];
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
    "department",
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

function getPrepDepartment(
  data: Record<string, unknown> | null
): "boh" | "foh" {
  // Legacy prep records pre-date department support and are BOH.
  return data?.department === "foh" ? "foh" : "boh";
}

function canEditPrepDepartment(
  context: CloudRequestContext,
  data: Record<string, unknown> | null
): boolean {
  if (!data) return false;

  const department = getPrepDepartment(data);

  if (context.role === "operations") return true;
  if (context.role === "foh_manager") return department === "foh";

  // Existing managers are BOH managers. Chefs also work with BOH prep only.
  return department === "boh";
}

function canAccessHandoverDepartment(
  context: CloudRequestContext,
  data: Record<string, unknown> | null
): boolean {
  if (!data) return false;

  // Legacy handovers pre-date department support and are BOH.
  const department = data.department === "foh" ? "foh" : "boh";

  if (context.role === "operations") return true;
  if (context.role === "foh_manager") return department === "foh";

  // Existing managers are BOH managers. Chef handover access also remains BOH.
  return department === "boh";
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

  if (
    input.kind === "handovers" &&
    !canAccessHandoverDepartment(input.context, asRecord(data.data))
  ) {
    return null;
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

    const records = (data ?? []).filter(
      (row: { kind: string; data: unknown }) => {
        const kind = row.kind as OperationalKind;

        if (
          kind === "handovers" &&
          !canAccessHandoverDepartment(context, asRecord(row.data))
        ) {
          return false;
        }

        if (context.role !== "chef") return true;
        if (!CHEF_READ_KINDS.has(kind)) return false;

        if (
          (kind === "prep" || kind === "prep_history") &&
          getPrepDepartment(asRecord(row.data)) !== "boh"
        ) {
          return false;
        }

        return true;
      }
    );

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
    const siteIds = new Set((businessSites ?? []).map((site) => String(site.id)));

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

        // A supplying site may read an internal request, but may not delete it.
        if (kind === "orders" && context.role !== "operations") {
          const existingOrder = asRecord(existing.data);
          if (!existingOrder || !getContextSiteAccessKeys(context).includes(String(existingOrder.siteId ?? ""))) {
            return fail("Only the ordering site can delete its order.", 403);
          }
        }

        if (kind === "prep") {
          if (!canEditPrepDepartment(context, asRecord(existing.data))) {
            return fail(
              "This account does not have permission to delete that prep department.",
              403
            );
          }

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

      // All newly created orders must match their authoritative cloud supplier.
      // This prevents an internal supplier being disguised as external to bypass
      // linked-site and dispatch rules.
      if (kind === "orders") {
        if (String(data.businessId ?? "") !== context.businessId) {
          return fail("Order business does not match the signed-in workspace.", 403);
        }
        const supplierId = Number(data.supplierId);
        if (!Number.isSafeInteger(supplierId)) return fail("Invalid order supplier.", 400);
        const { data: supplierRow, error: supplierError } = await admin
          .from("cloud_suppliers")
          .select("data")
          .eq("business_id", context.businessId)
          .eq("legacy_id", supplierId)
          .maybeSingle();
        if (supplierError) throw supplierError;
        const supplier = asRecord(supplierRow?.data);
        if (!supplier || String(supplier.name ?? "") !== String(data.supplierName ?? "") ||
            (supplier.supplierType === "internal" ? data.orderType !== "internal" : data.orderType === "internal")) {
          return fail("Order supplier type does not match the linked supplier.", 400);
        }
      }
      // Never let the browser choose arbitrary visibility keys for an internal order.
      if (kind === "orders" && data.orderType === "internal") {
        const supplierId = Number(data.supplierId);
        if (!Number.isSafeInteger(supplierId)) return fail("Invalid internal supplier.", 400);
        const { data: supplierRow, error: supplierError } = await admin
          .from("cloud_suppliers")
          .select("data")
          .eq("business_id", context.businessId)
          .eq("legacy_id", supplierId)
          .maybeSingle();
        if (supplierError) throw supplierError;
        const supplier = asRecord(supplierRow?.data);
        const sourceSiteId = String(data.siteId ?? "");
        const supplyingSiteId = String(data.supplyingSiteId ?? "");
        if (!supplier || supplier.supplierType !== "internal" || supplier.active !== true ||
            String(supplier.linkedSiteId ?? "") !== supplyingSiteId ||
            String(supplier.name ?? "") !== String(data.supplierName ?? "") ||
            !siteIds.has(sourceSiteId) || !siteIds.has(supplyingSiteId) || sourceSiteId === supplyingSiteId) {
          return fail("The internal supplier must link to another active business site.", 400);
        }
        if (!["Draft", "Sent", "Accepted", "Declined", "Cancelled"].includes(String(data.status ?? ""))) {
          return fail("Unsupported internal order status.", 400);
        }
      }

      const siteKeys = deriveSiteKeys(kind, data);
      if (siteKeys.length === 0) return fail("Operational record site is required.", 400);
      if (String(data.id ?? "").trim() !== id) {
        return fail("Operational record identity does not match its payload.", 400);
      }
      if (siteKeys.some((key) => !validSiteKeys.has(key))) {
        return fail("Operational record references an invalid site.", 400);
      }
      if (kind === "orders" && data.orderType === "internal" && data.status !== "Draft" && siteKeys.length !== 2) {
        return fail("An internal order requires two different business sites.", 400);
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
        if (kind === "orders" && data.orderType !== "internal" && !accessKeys.includes(String(data.siteId ?? ""))) {
          return fail("Only the ordering site can create or edit this order.", 403);
        }
        if (kind !== "transfers" && !(kind === "orders" && data.orderType === "internal") && (siteKeys.length !== 1 || !accessKeys.includes(siteKeys[0]))) {
          return fail("This record belongs to another KitchenOps site.", 403);
        }
      }

      if (kind === "orders") {
        const { data: existingOrderRow, error: existingOrderError } = await admin
          .from("cloud_operational_records")
          .select("data")
          .eq("business_id", context.businessId)
          .eq("kind", "orders")
          .eq("record_id", id)
          .maybeSingle();
        if (existingOrderError) throw existingOrderError;
        const previous = asRecord(existingOrderRow?.data);

        if (!previous && data.orderType === "internal" && context.role !== "operations") {
          const accessKeys = getContextSiteAccessKeys(context);
          if (!accessKeys.includes(String(data.siteId ?? ""))) {
            return fail("Only the ordering site can create an internal order.", 403);
          }
        }

        if (previous) {
          // Site, supplier and order identity are fixed at creation.
          for (const field of ["businessId", "id", "orderNumber", "siteId", "siteName", "supplierId", "supplierName", "orderType", "supplyingSiteId", "supplyingSiteName", "createdAt", "createdBy"]) {
            if (!samePrimitive(previous[field], data[field])) {
              return fail("An order's site and supplier cannot be changed after creation.", 403);
            }
          }

          if (previous.orderType === "internal") {
            // Once submitted, request contents are immutable. Review changes may
            // only add status/audit metadata and a timeline event.
            if (previous.status !== "Draft" &&
                (JSON.stringify(previous.items) !== JSON.stringify(data.items) ||
                 !samePrimitive(previous.notes, data.notes) ||
                 !samePrimitive(previous.requestedDeliveryDate, data.requestedDeliveryDate) ||
                 !samePrimitive(previous.subtotal, data.subtotal) ||
                 !samePrimitive(previous.vat, data.vat) ||
                 !samePrimitive(previous.total, data.total))) {
              return fail("Submitted internal requests cannot be edited.", 403);
            }

            const from = String(previous.status ?? "");
            const to = String(data.status ?? "");
            const accessKeys = getContextSiteAccessKeys(context);
            const isOrderingSite = accessKeys.includes(String(previous.siteId ?? ""));
            const isSupplyingSite = accessKeys.includes(String(previous.supplyingSiteId ?? ""));

            if (from !== to) {
              const orderingTransition =
                (from === "Draft" && (to === "Sent" || to === "Cancelled")) ||
                (from === "Sent" && to === "Cancelled");
              const supplyingTransition =
                from === "Sent" && (to === "Accepted" || to === "Declined");

              if (context.role !== "operations") {
                if (orderingTransition && !isOrderingSite) {
                  return fail("Only the ordering site can send or cancel this request.", 403);
                }
                if (supplyingTransition && !isSupplyingSite) {
                  return fail("Only the supplying site can accept or decline this request.", 403);
                }
              }

              if (!orderingTransition && !supplyingTransition) {
                return fail("Invalid internal order transition.", 403);
              }

              if (supplyingTransition) {
                const staffName = context.staffName?.trim() || "";
                const acceptedBy = String(data.acceptedBy ?? "").trim();
                const declinedBy = String(data.declinedBy ?? "").trim();
                if (to === "Accepted") {
                  if (!acceptedBy || !String(data.acceptedAt ?? "").trim() ||
                      (context.role !== "operations" && acceptedBy !== staffName)) {
                    return fail("Internal order acceptance audit details are invalid.", 403);
                  }
                }
                if (to === "Declined") {
                  const reason = String(data.declineReason ?? "").trim();
                  if (!declinedBy || !String(data.declinedAt ?? "").trim() || !reason || reason.length > 500 ||
                      (context.role !== "operations" && declinedBy !== staffName)) {
                    return fail("A valid decline reason and reviewer are required.", 403);
                  }
                }
              }
            }
          }
        }
      }

      if (
        kind === "handovers" &&
        !canAccessHandoverDepartment(context, data)
      ) {
        return fail(
          "This account does not have permission to edit that handover department.",
          403
        );
      }

      if (kind === "handovers") {
        const admin = createAdminClient();
        const { data: existingHandover, error: existingHandoverError } = await admin
          .from("cloud_operational_records")
          .select("data")
          .eq("business_id", context.businessId)
          .eq("kind", "handovers")
          .eq("record_id", id)
          .maybeSingle();

        if (existingHandoverError) throw existingHandoverError;

        if (
          existingHandover &&
          !canAccessHandoverDepartment(context, asRecord(existingHandover.data))
        ) {
          return fail(
            "This account does not have permission to overwrite that handover.",
            403
          );
        }
      }

      if (kind === "prep") {
        const existingPrepRecord = await canAccessExistingRecord({ context, kind, id });
        const expected = resolveExpectedPrepRevision(existingPrepRecord, rawChange);
        if (!expected.valid) return prepConflict(id);

        if (!canEditPrepDepartment(context, data)) {
          return fail(
            "This account does not have permission to edit that prep department.",
            403
          );
        }

        if (existingPrepRecord) {
          const existingPrepData = asRecord(existingPrepRecord.data);
          if (!existingPrepData) return fail("The prep record is invalid.", 409);

          if (!canEditPrepDepartment(context, existingPrepData)) {
            return fail(
              "This account does not have permission to overwrite that prep department.",
              403
            );
          }

          if (context.role === "chef") {
            const validationError = validateChefPrepUpdate(
              existingPrepData,
              data,
              context.staffName
            );
            if (validationError) return fail(validationError, 403);
          }

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
