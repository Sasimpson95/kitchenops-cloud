import type {
  User,
} from "@/config/roles";

export type CloudSession = {
  authenticated: boolean;
  user?: User;
  business?: {
    id: string;
    name: string;
    code?: string;
  } | null;
  siteId?: string;
  authType?: "supabase" | "pin";
  needsOnboarding?: boolean;
};

export async function getCloudSession(): Promise<CloudSession> {
  const response = await fetch(
    "/api/auth/session",
    {
      cache: "no-store",
    }
  );

  const data = await response.json() as CloudSession;
  return data;
}
