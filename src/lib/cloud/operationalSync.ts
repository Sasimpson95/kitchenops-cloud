import { getActiveBusinessId } from "@/lib/businessWorkspace";
import { getCloudSession } from "@/lib/cloudSession";
import { getCurrentUser } from "@/lib/currentUser";
import { siteNameToKey } from "@/lib/siteKey";
import { toast } from "@/lib/toast";

export type OperationalKind =
  | "prep"
  | "prep_history"
  | "orders"
  | "waste"
  | "stocktakes"
  | "transfers"
  | "handovers";

type JsonRecord = Record<string, unknown>;

type CloudOperationalRow = {
  kind: OperationalKind;
  record_id: string;
  site_keys: string[];
  data: JsonRecord;
  updated_at: string;
};

type OperationalChange = {
  businessId: string;
  kind: OperationalKind;
  id: string;
  siteKeys?: string[];
  data?: JsonRecord;
  deleted?: boolean;
  expectedRevision?: string | null;
  // RC4 compatibility only. RC5 never creates this field.
  expectedUpdatedAt?: string | null;
};

type Config = {
  key: string;
  event: string;
};

type RevisionAck = {
  kind: OperationalKind;
  id: string;
  revision: string | null;
};

type ConflictPayload = {
  error?: string;
  conflict?: {
    kind?: OperationalKind;
    id?: string;
  };
  revisions?: RevisionAck[];
};

class OperationalConflictError extends Error {
  readonly code = "OPERATIONAL_CONFLICT";
  readonly kind: OperationalKind;
  readonly id: string;

  constructor(kind: OperationalKind, id: string, message: string) {
    super(message);
    this.name = "OperationalConflictError";
    this.kind = kind;
    this.id = id;
  }
}


class OperationalRejectedError extends Error {
  readonly code = "OPERATIONAL_REJECTED";
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "OperationalRejectedError";
    this.status = status;
  }
}

function isOperationalRejectedError(error: unknown): error is OperationalRejectedError {
  return error instanceof OperationalRejectedError;
}

function isOperationalConflictError(error: unknown): error is OperationalConflictError {
  if (error instanceof OperationalConflictError) return true;
  if (typeof error !== "object" || error === null) return false;
  const candidate = error as { code?: unknown; kind?: unknown; id?: unknown };
  return (
    candidate.code === "OPERATIONAL_CONFLICT" &&
    typeof candidate.kind === "string" &&
    typeof candidate.id === "string"
  );
}

const CONFIG: Record<OperationalKind, Config> = {
  prep: { key: "kitchenops-prep-plan", event: "kitchenops-prep-changed" },
  prep_history: { key: "kitchenops-prep-history", event: "kitchenops-prep-changed" },
  orders: { key: "kitchenops-purchase-orders", event: "kitchenops-orders-changed" },
  waste: { key: "kitchenops-waste-records", event: "kitchenops-waste-changed" },
  stocktakes: { key: "kitchenops-stocktakes-v2", event: "kitchenops-stocktakes-changed" },
  transfers: { key: "kitchenops-stock-transfers", event: "kitchenops-transfers-changed" },
  handovers: { key: "kitchenops-site-handovers", event: "kitchenops-handover-changed" },
};

const MIGRATION_PREFIX = "kitchenops-operational-cloud-migrated";
const PENDING_KEY = "kitchenops-pending-operational-changes";
const REVISION_KEY = "kitchenops-operational-cloud-revisions-v1";
const RC4_PENDING_BACKUP_KEY = "kitchenops-rc4-prep-pending-backup";
const OPERATIONAL_HYDRATED_EVENT = "kitchenops-operational-hydrated";
let hydrationPromise: Promise<void> | null = null;
let flushPromise: Promise<void> | null = null;

function asRecord(value: unknown): JsonRecord | null {
  return typeof value === "object" && value !== null
    ? (value as JsonRecord)
    : null;
}

function readJsonArray<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  const saved = window.localStorage.getItem(key);
  if (!saved) return [];
  try {
    const parsed: unknown = JSON.parse(saved);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function readLocal(kind: OperationalKind): JsonRecord[] {
  return readJsonArray<unknown>(CONFIG[kind].key)
    .map(asRecord)
    .filter((item): item is JsonRecord => item !== null);
}

function writeLocal(kind: OperationalKind, records: JsonRecord[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CONFIG[kind].key, JSON.stringify(records));
  window.dispatchEvent(new CustomEvent(CONFIG[kind].event));
}

function recordId(record: JsonRecord): string {
  return String(record.id ?? "").trim();
}

function getSiteKeys(kind: OperationalKind, record: JsonRecord): string[] {
  let values: string[] = [];

  if (kind === "prep" || kind === "prep_history") {
    values = [siteNameToKey(String(record.site ?? ""))];
  } else if (kind === "handovers") {
    values = [siteNameToKey(String(record.siteName ?? ""))];
  } else if (kind === "transfers") {
    values = [String(record.fromSiteId ?? ""), String(record.toSiteId ?? "")];
  } else {
    values = [String(record.siteId ?? "")];
  }

  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function recordTimestamp(record: JsonRecord): number {
  for (const candidate of [
    record.updatedAt,
    record.archivedAt,
    record.completedAt,
    record.createdAt,
    record.requestedAt,
  ]) {
    if (typeof candidate !== "string") continue;
    const parsed = Date.parse(candidate);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function mergeForFirstMigration(local: JsonRecord[], cloud: JsonRecord[]): JsonRecord[] {
  const merged = new Map<string, JsonRecord>();
  for (const record of cloud) {
    const id = recordId(record);
    if (id) merged.set(id, record);
  }
  for (const record of local) {
    const id = recordId(record);
    if (!id) continue;
    const existing = merged.get(id);
    if (!existing || recordTimestamp(record) > recordTimestamp(existing)) {
      merged.set(id, record);
    }
  }
  return Array.from(merged.values());
}

function sameRecord(first: JsonRecord, second: JsonRecord): boolean {
  return JSON.stringify(first) === JSON.stringify(second);
}

function changeKey(change: Pick<OperationalChange, "businessId" | "kind" | "id">): string {
  return `${change.businessId}:${change.kind}:${change.id}`;
}

function readPending(): OperationalChange[] {
  return readJsonArray<OperationalChange>(PENDING_KEY).filter(
    (change) => Boolean(change.businessId) && Boolean(change.kind) && Boolean(change.id)
  );
}

function savePending(changes: OperationalChange[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PENDING_KEY, JSON.stringify(changes));
}

function readRevisions(): Record<string, string | null> {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(REVISION_KEY);
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    return asRecord(parsed) as Record<string, string | null> | null ?? {};
  } catch {
    return {};
  }
}

function saveRevisions(revisions: Record<string, string | null>): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(REVISION_KEY, JSON.stringify(revisions));
}

function revisionKey(businessId: string, kind: OperationalKind, id: string): string {
  return `${businessId}:${kind}:${id}`;
}

function getRevision(businessId: string, kind: OperationalKind, id: string): string | null {
  const value = readRevisions()[revisionKey(businessId, kind, id)];
  return typeof value === "string" && value ? value : null;
}

function setRevision(
  businessId: string,
  kind: OperationalKind,
  id: string,
  revision: string | null
): void {
  const revisions = readRevisions();
  const key = revisionKey(businessId, kind, id);
  if (revision === null) delete revisions[key];
  else revisions[key] = revision;
  saveRevisions(revisions);
}

function replacePrepRevisions(businessId: string, rows: CloudOperationalRow[]): void {
  const revisions = readRevisions();
  const prefix = `${businessId}:prep:`;
  for (const key of Object.keys(revisions)) {
    if (key.startsWith(prefix)) delete revisions[key];
  }
  for (const row of rows) {
    if (row.kind !== "prep" || !row.record_id || !row.updated_at) continue;
    revisions[revisionKey(businessId, "prep", row.record_id)] = row.updated_at;
  }
  saveRevisions(revisions);
}

function quarantineLegacyRc4PrepPending(): void {
  if (typeof window === "undefined") return;
  const pending = readPending();
  const legacyPrep = pending.filter(
    (change) =>
      change.kind === "prep" &&
      change.expectedRevision === undefined &&
      change.expectedUpdatedAt !== undefined
  );
  if (legacyPrep.length === 0) return;

  const previousBackup = readJsonArray<OperationalChange>(RC4_PENDING_BACKUP_KEY);
  window.localStorage.setItem(
    RC4_PENDING_BACKUP_KEY,
    JSON.stringify([...previousBackup, ...legacyPrep])
  );
  savePending(pending.filter((change) => !legacyPrep.includes(change)));
  toast.warning(
    "Prep sync reset",
    "KitchenOps cleared an RC4 prep retry that could block cross-device updates. The latest cloud prep will be loaded."
  );
}

function queueChanges(changes: OperationalChange[]): void {
  const merged = new Map<string, OperationalChange>();

  for (const change of readPending()) {
    merged.set(changeKey(change), change);
  }

  for (const change of changes) {
    const key = changeKey(change);
    const pending = merged.get(key);

    // Keep the server revision the local edit originally started from until
    // that queued write is acknowledged. A later local edit can replace the
    // payload, but it must not pretend it started from a newer cloud revision.
    if (change.kind === "prep" && pending) {
      merged.set(key, {
        ...change,
        expectedRevision: pending.expectedRevision ?? null,
      });
    } else {
      merged.set(key, change);
    }
  }

  savePending(Array.from(merged.values()));
}

async function sendChanges(changes: OperationalChange[]): Promise<RevisionAck[]> {
  const payload = changes.map(({ businessId: _businessId, expectedUpdatedAt: _legacy, ...change }) => change);
  const response = await fetch("/api/cloud/operations", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ changes: payload }),
  });

  const result = (await response.json().catch(() => ({}))) as ConflictPayload;

  if (!response.ok) {
    if (response.status === 409) {
      const fallbackPrep = changes.length === 1 && changes[0].kind === "prep" ? changes[0] : null;
      const kind = result.conflict?.kind ?? fallbackPrep?.kind;
      const id = result.conflict?.id ?? fallbackPrep?.id;
      if (kind && id) {
        throw new OperationalConflictError(
          kind,
          id,
          result.error ?? "This record changed on another device."
        );
      }
    }
    throw new OperationalRejectedError(
      response.status,
      result.error ?? "Operational data could not be saved."
    );
  }

  return result.revisions ?? [];
}

function scheduleConflictRefresh(): void {
  if (typeof window === "undefined") return;
  window.setTimeout(() => {
    void hydrateOperationalData({ force: true }).catch((error) => {
      console.warn("Conflict refresh failed:", error);
    });
  }, 0);
}

function removeOrAdvanceAcknowledgedChanges(
  businessId: string,
  batch: OperationalChange[],
  revisions: RevisionAck[]
): void {
  const sentByKey = new Map(batch.map((change) => [changeKey(change), change]));
  const revisionByKey = new Map(
    revisions.map((revision) => [
      revisionKey(businessId, revision.kind, revision.id),
      revision.revision,
    ])
  );

  for (const revision of revisions) {
    setRevision(businessId, revision.kind, revision.id, revision.revision);
  }

  const nextPending: OperationalChange[] = [];
  for (const current of readPending()) {
    const sent = sentByKey.get(changeKey(current));
    if (!sent) {
      nextPending.push(current);
      continue;
    }

    if (JSON.stringify(current) === JSON.stringify(sent)) {
      continue;
    }

    // The user made another local edit while this request was in flight. Keep
    // that newer payload, but advance its base revision to the version the
    // server just accepted so the second write does not false-conflict.
    if (current.kind === "prep") {
      const acceptedRevision = revisionByKey.get(
        revisionKey(businessId, current.kind, current.id)
      );
      nextPending.push({
        ...current,
        expectedRevision:
          acceptedRevision !== undefined
            ? acceptedRevision
            : current.expectedRevision ?? null,
      });
    } else {
      nextPending.push(current);
    }
  }

  savePending(nextPending);
}

export async function flushPendingOperationalChanges(): Promise<void> {
  if (typeof window === "undefined") return;
  if (flushPromise) return flushPromise;

  flushPromise = (async () => {
    while (true) {
      const businessId = getActiveBusinessId();
      if (!businessId) return;

      const activePending = readPending().filter(
        (change) => change.businessId === businessId
      );
      if (activePending.length === 0) return;

      // Prep writes are sent one at a time. That makes a 409 conflict
      // unambiguous even if an older cached API response omits conflict details.
      const prepChange = activePending.find((change) => change.kind === "prep");
      const batch = prepChange
        ? [prepChange]
        : activePending.filter((change) => change.kind !== "prep").slice(0, 200);

      try {
        const revisions = await sendChanges(batch);
        removeOrAdvanceAcknowledgedChanges(businessId, batch, revisions);
      } catch (error) {
        if (isOperationalConflictError(error)) {
          const conflictedKey = `${businessId}:${error.kind}:${error.id}`;
          savePending(
            readPending().filter((change) => changeKey(change) !== conflictedKey)
          );
          setRevision(businessId, error.kind, error.id, null);
          toast.warning(
            "Prep updated elsewhere",
            "KitchenOps found a newer prep change from another device. Your stale edit was not saved and the latest cloud version is being loaded."
          );
          scheduleConflictRefresh();
          continue;
        }

        // A permission rejection is permanent for the current user. Retrying it
        // forever only creates repeated warnings and can overlay stale local data.
        // Drop exactly the rejected batch, then reload the authoritative cloud copy.
        if (isOperationalRejectedError(error) && error.status === 403) {
          const rejectedKeys = new Set(batch.map((change) => changeKey(change)));
          savePending(
            readPending().filter((change) => !rejectedKeys.has(changeKey(change)))
          );
          for (const change of batch) {
            if (change.kind === "prep") {
              setRevision(businessId, change.kind, change.id, null);
            }
          }
          scheduleConflictRefresh();
          continue;
        }

        throw error;
      }
    }
  })()
    .catch((error) => {
      console.warn("Operational sync deferred:", error);
      toast.warning(
        "KitchenOps sync pending",
        error instanceof Error
          ? error.message
          : "KitchenOps will retry when the connection is available."
      );
    })
    .finally(() => {
      flushPromise = null;
    });

  return flushPromise;
}

export function syncOperationalCollection(
  kind: OperationalKind,
  previous: unknown[],
  next: unknown[]
): void {
  if (typeof window === "undefined") return;

  const businessId = getActiveBusinessId();
  if (!businessId) return;

  const before = previous.map(asRecord).filter((item): item is JsonRecord => item !== null);
  const after = next.map(asRecord).filter((item): item is JsonRecord => item !== null);
  const beforeById = new Map(before.map((record) => [recordId(record), record]));
  const afterById = new Map(after.map((record) => [recordId(record), record]));
  const changes: OperationalChange[] = [];
  const currentUser = getCurrentUser();
  const isChef = currentUser?.role === "chef";

  for (const record of after) {
    const id = recordId(record);
    if (!id) continue;
    const old = beforeById.get(id);
    if (!old || !sameRecord(old, record)) {
      // Mirror server permissions on the client so read-only hydration/rollover
      // can never manufacture writes the Chef role is guaranteed to reject.
      if (isChef) {
        if (kind === "prep" && !old) continue;
        if (kind === "waste" && old) continue;
        if (kind !== "prep" && kind !== "waste") continue;
      }

      const siteKeys = getSiteKeys(kind, record);
      if (siteKeys.length > 0) {
        changes.push({
          businessId,
          kind,
          id,
          siteKeys,
          data: record,
          expectedRevision: kind === "prep" ? getRevision(businessId, kind, id) : undefined,
        });
      }
    }
  }

  for (const record of before) {
    const id = recordId(record);
    if (id && !afterById.has(id)) {
      // The API intentionally forbids all Chef deletes. Automatic day rollover
      // must therefore remain a read-only operation on Chef devices.
      if (isChef) continue;
      changes.push({
        businessId,
        kind,
        id,
        deleted: true,
        expectedRevision: kind === "prep" ? getRevision(businessId, kind, id) : undefined,
      });
    }
  }

  if (changes.length === 0) return;
  queueChanges(changes);
  void flushPendingOperationalChanges();
}

function applyPendingOverlay(
  kind: OperationalKind,
  cloudRecords: JsonRecord[],
  businessId: string
): JsonRecord[] {
  const relevant = readPending().filter(
    (change) => change.businessId === businessId && change.kind === kind
  );
  if (relevant.length === 0) return cloudRecords;

  const merged = new Map(cloudRecords.map((record) => [recordId(record), record]));
  for (const change of relevant) {
    if (change.deleted) merged.delete(change.id);
    else if (change.data) merged.set(change.id, change.data);
  }
  return Array.from(merged.values());
}

export async function hydrateOperationalData(_options?: { force?: boolean }): Promise<void> {
  if (typeof window === "undefined") return;
  if (hydrationPromise) return hydrationPromise;

  hydrationPromise = (async () => {
    const session = await getCloudSession();
    const businessId = session.business?.id;
    if (!businessId) return;

    // RC4 could leave a stale prep retry permanently overlaying newer cloud
    // data. Preserve it for diagnostics, but never resend it under RC5.
    quarantineLegacyRc4PrepPending();
    await flushPendingOperationalChanges();

    const response = await fetch("/api/cloud/operations", { cache: "no-store" });
    if (!response.ok) {
      if (response.status === 401) return;
      const result = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(result.error ?? "KitchenOps could not load shared operational data.");
    }

    const payload = (await response.json()) as { records?: CloudOperationalRow[] };
    const rows = payload.records ?? [];
    replacePrepRevisions(businessId, rows);

    const migrationKey = `${MIGRATION_PREFIX}::${businessId}`;
    const firstMigration =
      session.user?.role === "operations" &&
      window.localStorage.getItem(migrationKey) !== "yes";

    for (const kind of Object.keys(CONFIG) as OperationalKind[]) {
      const kindRows = rows.filter((row) => row.kind === kind);
      const rawCloudRecords = kindRows
        .map((row) => asRecord(row.data))
        .filter((record): record is JsonRecord => record !== null);

      if (firstMigration) {
        const localRecords = readLocal(kind);
        const merged = mergeForFirstMigration(localRecords, rawCloudRecords);
        writeLocal(kind, merged);

        const cloudById = new Map(rawCloudRecords.map((record) => [recordId(record), record]));
        const migrationChanges = merged
          .filter((record) => {
            const cloud = cloudById.get(recordId(record));
            return !cloud || !sameRecord(cloud, record);
          })
          .map((record) => ({
            businessId,
            kind,
            id: recordId(record),
            siteKeys: getSiteKeys(kind, record),
            data: record,
            expectedRevision:
              kind === "prep" ? getRevision(businessId, kind, recordId(record)) : undefined,
          }))
          .filter((change) => change.id && change.siteKeys.length > 0);

        if (migrationChanges.length > 0) queueChanges(migrationChanges);
      } else {
        writeLocal(kind, applyPendingOverlay(kind, rawCloudRecords, businessId));
      }
    }

    if (firstMigration) {
      await flushPendingOperationalChanges();
      const migrationStillPending = readPending().some(
        (change) => change.businessId === businessId
      );
      if (!migrationStillPending) {
        window.localStorage.setItem(migrationKey, "yes");
      }
    }

    // Notify mounted screens only after every operational collection has been
    // refreshed from the authoritative cloud snapshot. Store-specific events
    // are useful for local edits, but this single event gives dashboard-style
    // aggregate views a reliable cross-device refresh boundary.
    window.dispatchEvent(new CustomEvent(OPERATIONAL_HYDRATED_EVENT));
  })().finally(() => {
    hydrationPromise = null;
  });

  return hydrationPromise;
}

export function subscribeToOperationalHydration(
  callback: () => void
): () => void {
  if (typeof window === "undefined") return () => undefined;

  window.addEventListener(OPERATIONAL_HYDRATED_EVENT, callback);
  return () => {
    window.removeEventListener(OPERATIONAL_HYDRATED_EVENT, callback);
  };
}

export function startOperationalPolling(intervalMs = 12000): () => void {
  if (typeof window === "undefined") return () => undefined;

  const refresh = () => {
    void hydrateOperationalData({ force: true }).catch((error) => {
      console.warn("Operational refresh failed:", error);
    });
  };

  const timer = window.setInterval(refresh, intervalMs);
  const onVisibility = () => {
    if (document.visibilityState === "visible") refresh();
  };
  const onOnline = () => refresh();
  const onFocus = () => refresh();
  const onPageShow = () => refresh();

  window.setTimeout(refresh, 250);
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("online", onOnline);
  window.addEventListener("focus", onFocus);
  window.addEventListener("pageshow", onPageShow);

  return () => {
    window.clearInterval(timer);
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("online", onOnline);
    window.removeEventListener("focus", onFocus);
    window.removeEventListener("pageshow", onPageShow);
  };
}
