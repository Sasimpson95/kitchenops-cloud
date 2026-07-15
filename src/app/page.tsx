"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCloudSession } from "@/lib/cloudSession";
import { setCurrentUser } from "@/lib/currentUser";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    async function route() {
      try {
        const session = await getCloudSession();
        if (session.authenticated && session.user) {
          setCurrentUser(session.user);
          router.replace("/home");
        } else {
          router.replace("/login");
        }
      } catch {
        router.replace("/login");
      }
    }
    void route();
  }, [router]);

  return null;
}
