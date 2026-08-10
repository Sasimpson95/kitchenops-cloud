import { createHmac } from "node:crypto";
import type { NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

const WINDOW_MINUTES = 15;
const LOOKUP_CLIENT_LIMIT = 30;
const PIN_CLIENT_LIMIT = 20;
const PIN_STAFF_LIMIT = 5;

function limiterSecret(): string {
  const value =
    process.env.KITCHENOPS_LOGIN_RATE_LIMIT_SECRET ??
    process.env.KITCHENOPS_SESSION_SECRET;

  if (!value || value.length < 32) {
    throw new Error(
      "KITCHENOPS_LOGIN_RATE_LIMIT_SECRET or KITCHENOPS_SESSION_SECRET must contain at least 32 characters."
    );
  }

  return value;
}

export function getAuthClientKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  const address = forwarded || realIp || "unknown";
  const agent = request.headers.get("user-agent")?.slice(0, 160) || "unknown";

  return createHmac("sha256", limiterSecret())
    .update(`${address}|${agent}`)
    .digest("hex");
}

function windowStart(): string {
  return new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();
}

export async function checkLookupRateLimit(input: {
  clientKey: string;
}): Promise<boolean> {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from("staff_auth_attempts")
    .select("id", { count: "exact", head: true })
    .eq("attempt_type", "lookup")
    .eq("client_key", input.clientKey)
    .gte("attempted_at", windowStart());

  if (error) throw error;
  return (count ?? 0) < LOOKUP_CLIENT_LIMIT;
}

export async function recordLookupAttempt(input: {
  clientKey: string;
  businessCode: string;
}): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("staff_auth_attempts").insert({
    attempt_type: "lookup",
    client_key: input.clientKey,
    business_code: input.businessCode,
  });
  if (error) throw error;
}

export async function checkPinRateLimit(input: {
  clientKey: string;
  businessCode: string;
  siteId: string;
  staffId: string;
}): Promise<{ allowed: boolean; reason?: "client" | "staff" }> {
  const admin = createAdminClient();
  const cutoff = windowStart();

  const [clientResult, staffResult] = await Promise.all([
    admin
      .from("staff_auth_attempts")
      .select("id", { count: "exact", head: true })
      .eq("attempt_type", "pin")
      .eq("client_key", input.clientKey)
      .gte("attempted_at", cutoff),
    admin
      .from("staff_auth_attempts")
      .select("id", { count: "exact", head: true })
      .eq("attempt_type", "pin")
      .eq("business_code", input.businessCode)
      .eq("site_id", input.siteId)
      .eq("staff_id", input.staffId)
      .gte("attempted_at", cutoff),
  ]);

  if (clientResult.error) throw clientResult.error;
  if (staffResult.error) throw staffResult.error;

  if ((clientResult.count ?? 0) >= PIN_CLIENT_LIMIT) {
    return { allowed: false, reason: "client" };
  }
  if ((staffResult.count ?? 0) >= PIN_STAFF_LIMIT) {
    return { allowed: false, reason: "staff" };
  }

  return { allowed: true };
}

export async function recordFailedPinAttempt(input: {
  clientKey: string;
  businessCode: string;
  siteId: string;
  staffId: string;
}): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("staff_auth_attempts").insert({
    attempt_type: "pin",
    client_key: input.clientKey,
    business_code: input.businessCode,
    site_id: input.siteId,
    staff_id: input.staffId,
  });
  if (error) throw error;
}

export async function clearSuccessfulPinAttempts(input: {
  clientKey: string;
  businessCode: string;
  siteId: string;
  staffId: string;
}): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("staff_auth_attempts")
    .delete()
    .eq("attempt_type", "pin")
    .eq("client_key", input.clientKey)
    .eq("business_code", input.businessCode)
    .eq("site_id", input.siteId)
    .eq("staff_id", input.staffId);

  // Opportunistic housekeeping keeps the table small without a scheduled job.
  await admin
    .from("staff_auth_attempts")
    .delete()
    .lt("attempted_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
}
