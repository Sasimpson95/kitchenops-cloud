const STORAGE_KEY = "kitchenops-audit-log";
const AUDIT_CHANGED_EVENT = "kitchenops-audit-changed";

export type AuditAction =
  | "created"
  | "updated"
  | "completed"
  | "received"
  | "recorded"
  | "transferred"
  | "signed-in"
  | "settings-changed";

export type AuditRecord = {
  id: string;
  action: AuditAction;
  area: string;
  title: string;
  description: string;
  siteId?: string;
  siteName?: string;
  performedBy: string;
  createdAt: string;
};

function createId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function emitChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(AUDIT_CHANGED_EVENT));
}

export function getAuditRecords(): AuditRecord[] {
  if (typeof window === "undefined") return [];

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) return [];

  try {
    const parsed: unknown = JSON.parse(saved);

    if (!Array.isArray(parsed)) return [];

    return (parsed as AuditRecord[]).sort(
      (first, second) =>
        new Date(second.createdAt).getTime() -
        new Date(first.createdAt).getTime()
    );
  } catch {
    return [];
  }
}

export function addAuditRecord(
  input: Omit<AuditRecord, "id" | "createdAt">
): AuditRecord {
  if (typeof window === "undefined") {
    return {
      ...input,
      id: "server-audit",
      createdAt: new Date().toISOString(),
    };
  }

  const record: AuditRecord = {
    ...input,
    id: createId(),
    createdAt: new Date().toISOString(),
  };

  const records = [record, ...getAuditRecords()].slice(0, 1000);

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  emitChanged();

  return record;
}

export function subscribeToAuditChanges(
  callback: () => void
): () => void {
  if (typeof window === "undefined") return () => undefined;

  function handleLocal(): void {
    callback();
  }

  function handleStorage(event: StorageEvent): void {
    if (event.key === STORAGE_KEY) {
      callback();
    }
  }

  window.addEventListener(AUDIT_CHANGED_EVENT, handleLocal);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(AUDIT_CHANGED_EVENT, handleLocal);
    window.removeEventListener("storage", handleStorage);
  };
}
