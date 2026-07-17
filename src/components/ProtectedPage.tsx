"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import type { User } from "@/config/roles";
import { getCachedCloudSession, getCloudSession } from "@/lib/cloudSession";
import { getCurrentUser, setCurrentUser } from "@/lib/currentUser";
import { hydrateCloudCatalog } from "@/lib/cloud/catalogSync";
import { switchBusinessWorkspace } from "@/lib/businessWorkspace";
import { createClient } from "@/lib/supabase/client";

type ProtectedPageProps = { children: React.ReactNode };

export default function ProtectedPage({ children }: ProtectedPageProps) {
  const router = useRouter();
  const cachedUser = getCachedCloudSession()?.user ?? getCurrentUser();
  const [currentUser, setUser] = useState<User | null>(cachedUser);

  useEffect(() => {
    let cancelled = false;
    async function loadSession() {
      try {
        const session = await getCloudSession();
        if (cancelled) return;
        if (!session.authenticated || !session.user) {
          router.replace(session.needsOnboarding ? "/cloud-onboarding" : "/login");
          return;
        }
        if (session.business?.id) {
          const supabase = createClient();
          const { count } = await supabase
            .from("sites")
            .select("id", { count: "exact", head: true })
            .eq("business_id", session.business.id)
            .eq("active", true);
          switchBusinessWorkspace(session.business.id, (count ?? 0) === 0);
        }
        setCurrentUser(session.user);
        setUser(session.user);
        await hydrateCloudCatalog();
      } catch {
        if (!cancelled) router.replace("/login");
      }
    }
    void loadSession();
    return () => { cancelled = true; };
  }, [router]);

  if (!currentUser) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-2xl bg-white px-5 py-4 font-semibold text-gray-600 shadow-sm">Opening KitchenOps…</div>
      </main>
    );
  }

  return <AppShell currentUser={currentUser}>{children}</AppShell>;
}
