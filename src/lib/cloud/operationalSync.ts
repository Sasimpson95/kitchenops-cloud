import { getActiveBusinessId } from "@/lib/businessWorkspace";
import { getCloudSession } from "@/lib/cloudSession";
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
};

type Config = {
  key: string;
  event: string;
};

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

function readPending(): OperationalChange[] {
  return readJsonArray<OperationalChange>(PENDING_KEY).filter(
    (change) =>
      Boolean(change.businessId) &&
      Boolean(change.kind) &&
      Boolean(change.id)
  );
}

function savePending(changes: OperationalChange[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PENDING_KEY, JSON.stringify(changes));
}

function queueChanges(changes: OperationalChange[]): void {
  const pending = readPending();
  const merged = new Map<string, OperationalChange>();

  for (const change of pending) {
    merged.set(`${change.businessId}:${change.kind}:${change.id}`, change);
  }
  for (const change of changes) {
    merged.set(`${change.businessId}:${change.kind}:${change.id}`, change);
  }

  savePending(Array.from(merged.values()));
}

async function sendChanges(changes: OperationalChange[]): Promise<void> {
  const payload = changes.map(({ businessId: _businessId, ...change }) => change);
  const response = await fetch("/api/cloud/operations", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ changes: payload }),
  });

  if (!response.ok) {
    const result = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(result.error ?? "Operational data could not be saved.");
  }
}

export async function flushPendingOperationalChanges(): Promise<void> {
  if (typeof window === "undefined") return;
  if (flushPromise) return flushPromise;

  flushPromise = (async () => {
    while (true) {
      const businessId = getActiveBusinessId();
      if (!businessId) return;

      const allPending = readPending();
      const activePending = allPending.filter(
        (change) => change.businessId === businessId
      );
      if (activePending.length === 0) return;

      const batch = activePending.slice(0, 200);
      await sendChanges(batch);

      const applied = new Set(
        batch.map((change) => `${change.businessId}:${change.kind}:${change.id}`)
      );
      savePending(
        readPending().filter(
          (change) => !applied.has(`${change.businessId}:${change.kind}:${change.id}`)
        )
      );
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

  for (const record of after) {
    const id = recordId(record);
    if (!id) continue;
    const old = beforeById.get(id);
    if (!old || !sameRecord(old, record)) {
      const siteKeys = getSiteKeys(kind, record);
      if (siteKeys.length > 0) {
        changes.push({ businessId, kind, id, siteKeys, data: record });
      }
    }
  }

  for (const record of before) {
    const id = recordId(record);
    if (id && !afterById.has(id)) {
      changes.push({ businessId, kind, id, deleted: true });
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

export async function hydrateOperationalData(options?: { force?: boolean }): Promise<void> {
  if (typeof window === "undefined") return;
  if (hydrationPromise && !options?.force) return hydrationPromise;

  hydrationPromise = (async () => {
    const session = await getCloudSession();
    const businessId = session.business?.id;
    if (!businessId) return;

    await flushPendingOperationalChanges();

    const response = await fetch("/api/cloud/operations", { cache: "no-store" });
    if (!response.ok) {
      if (response.status === 401) return;
      const result = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(result.error ?? "KitchenOps could not load shared operational data.");
    }

    const payload = (await response.json()) as { records?: CloudOperationalRow[] };
    const rows = payload.records ?? [];
    const migrationKey = `${MIGRATION_PREFIX}::${businessId}`;
    const firstMigration =
      session.user?.role === "operations" &&
      window.localStorage.getItem(migrationKey) !== "yes";

    for (const kind of Object.keys(CONFIG) as OperationalKind[]) {
      const rawCloudRecords = rows
        .filter((row) => row.kind === kind)
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
          }))
          .filter((change) => change.id && change.siteKeys.length > 0);

        if (migrationChanges.length > 0) {
          queueChanges(migrationChanges);
        }
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
  })().finally(() => {
    hydrationPromise = null;
  });

  return hydrationPromise;
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

  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("online", onOnline);

  return () => {
    window.clearInterval(timer);
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("online", onOnline);
  };
}
