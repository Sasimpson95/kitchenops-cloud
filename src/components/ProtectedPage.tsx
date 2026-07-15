"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import AppShell from "@/components/AppShell";

import type {
  User,
} from "@/config/roles";

import {
  getCloudSession,
} from "@/lib/cloudSession";

import {
  setCurrentUser,
} from "@/lib/currentUser";

type ProtectedPageProps = {
  children: React.ReactNode;
};

export default function ProtectedPage({
  children,
}: ProtectedPageProps) {
  const router = useRouter();

  const [currentUser, setUser] =
    useState<User | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const session =
          await getCloudSession();

        if (cancelled) return;

        if (
          !session.authenticated ||
          !session.user
        ) {
          router.replace(
            session.needsOnboarding
              ? "/cloud-onboarding"
              : "/login"
          );
          return;
        }

        // Compatibility bridge while operational modules are migrated.
        setCurrentUser(session.user);
        setUser(session.user);
      } catch {
        if (!cancelled) {
          router.replace("/login");
        }
      }
    }

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!currentUser) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="font-semibold text-gray-600">
          Loading KitchenOps...
        </p>
      </main>
    );
  }

  return (
    <AppShell currentUser={currentUser}>
      {children}
    </AppShell>
  );
}
