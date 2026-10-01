import { createClient } from "@/lib/supabase/client";

export type SetupStep =
  | "welcome"
  | "site"
  | "supplier"
  | "products"
  | "storage"
  | "team"
  | "ready";

export type SetupStatus =
  | "pending"
  | "complete"
  | "dismissed"
  | null;

export type SetupProgress = {
  status: SetupStatus;
  step: SetupStep | null;
  updatedAt: string | null;
};

export async function getSetupProgress(
  businessId: string
): Promise<SetupProgress> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc(
    "get_kitchenops_setup_progress",
    {
      requested_business_id: businessId,
    }
  );

  if (error) throw error;

  return data as SetupProgress;
}

export async function saveSetupProgress(
  businessId: string,
  status: Exclude<SetupStatus, null>,
  step: SetupStep
): Promise<SetupProgress> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc(
    "set_kitchenops_setup_progress",
    {
      requested_business_id: businessId,
      requested_status: status,
      requested_step: step,
    }
  );

  if (error) throw error;

  return data as SetupProgress;
}
