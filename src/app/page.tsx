"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCloudSession } from "@/lib/cloudSession";
import { setCurrentUser } from "@/lib/currentUser";
import { getSetupProgress } from "@/lib/setupProgress";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    async function route() {
      try {
        const session = await getCloudSession();
        if (session.authenticated && session.user) {
          setCurrentUser(session.user);

          if (
            session.user.role === "operations" &&
            session.business?.id &&
            !session.subscriptionRequired
          ) {
            try {
              const progress = await getSetupProgress(
                session.business.id
              );

              if (progress.status === "pending") {
                router.replace("/getting-started");
                return;
              }
            } catch (error) {
              console.warn(
                "Setup progress check deferred:",
                error
              );
            }
          }

          router.replace(
            session.subscriptionRequired
              ? "/subscription-required"
              : session.authType === "pin" && session.mustChangePin
                ? "/set-pin"
                : "/home"
          );
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
