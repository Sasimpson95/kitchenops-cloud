import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";

export const STAFF_COOKIE_NAME =
  "kitchenops-staff-session";

export type StaffSession = {
  staffId: string;
  businessId: string;
  businessName: string;
  siteId: string;
  siteName: string;
  name: string;
  role: "manager" | "chef";
  expiresAt: number;
};

function secret(): string {
  const value =
    process.env.KITCHENOPS_SESSION_SECRET;

  if (!value || value.length < 32) {
    throw new Error(
      "KITCHENOPS_SESSION_SECRET must contain at least 32 characters."
    );
  }

  return value;
}

function encode(value: string): string {
  return Buffer.from(value)
    .toString("base64url");
}

function decode(value: string): string {
  return Buffer.from(
    value,
    "base64url"
  ).toString("utf8");
}

function signature(payload: string): string {
  return createHmac(
    "sha256",
    secret()
  )
    .update(payload)
    .digest("base64url");
}

export function createStaffSessionToken(
  session: StaffSession
): string {
  const payload = encode(
    JSON.stringify(session)
  );

  return `${payload}.${signature(payload)}`;
}

export function readStaffSessionToken(
  token?: string
): StaffSession | null {
  if (!token) return null;

  const [payload, suppliedSignature] =
    token.split(".");

  if (!payload || !suppliedSignature) {
    return null;
  }

  const expected = signature(payload);
  const left = Buffer.from(expected);
  const right = Buffer.from(suppliedSignature);

  if (
    left.length !== right.length ||
    !timingSafeEqual(left, right)
  ) {
    return null;
  }

  try {
    const session = JSON.parse(
      decode(payload)
    ) as StaffSession;

    if (session.expiresAt <= Date.now()) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}
