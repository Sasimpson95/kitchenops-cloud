import type { CloudSession } from "@/lib/cloudSession";

let readyIdentity = "";

export function getSessionIdentity(session: CloudSession | null | undefined): string {
  if (!session?.authenticated || !session.user || !session.business?.id) return "";
  return [
    session.business.id,
    session.authType ?? "",
    session.user.role,
    session.user.name,
    session.siteId ?? session.user.siteId ?? "",
    session.user.site ?? "",
  ].join("::");
}

export function isRuntimeReadyFor(session: CloudSession | null | undefined): boolean {
  const identity = getSessionIdentity(session);
  return Boolean(identity && identity === readyIdentity);
}

export function markRuntimeReady(session: CloudSession): void {
  readyIdentity = getSessionIdentity(session);
}

export function clearRuntimeReadiness(): void {
  readyIdentity = "";
}
