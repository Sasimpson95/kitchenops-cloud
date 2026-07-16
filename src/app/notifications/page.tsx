"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  AlertTriangle,
  Bell,
  CircleAlert,
  Info,
} from "lucide-react";

import { useEffect, useState } from "react";

import ProtectedPage from "@/components/ProtectedPage";
import type { User } from "@/config/roles";
import { getCurrentUser } from "@/lib/currentUser";
import {
  getNotifications,
  type KitchenNotification,
} from "@/lib/notificationStore";

function Icon({
  notification,
}: {
  notification: KitchenNotification;
}) {
  if (notification.severity === "critical") {
    return <CircleAlert size={22} className="text-red-700" />;
  }

  if (notification.severity === "warning") {
    return <AlertTriangle size={22} className="text-orange-700" />;
  }

  return <Info size={22} className="text-blue-700" />;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const user = getCurrentUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    setCurrentUser(user);
  }, [router]);

  if (!currentUser) {
    return (
      <ProtectedPage>
        <main className="flex min-h-screen items-center justify-center bg-slate-100">
          Loading Notifications...
        </main>
      </ProtectedPage>
    );
  }

  const notifications = getNotifications(currentUser.site);

  return (
    <ProtectedPage>
      <main className="min-h-screen bg-slate-100 p-4 sm:p-8">
        <div className="mx-auto max-w-5xl">
          <div>
            <h1 className="text-4xl font-bold text-gray-950">
              Notification Centre
            </h1>
            <p className="mt-2 text-gray-600">
              Actionable alerts from across KitchenOps.
            </p>
          </div>

          {notifications.length === 0 ? (
            <div className="mt-8 rounded-3xl bg-white p-12 text-center shadow-sm">
              <Bell size={42} className="mx-auto text-violet-700" />
              <h2 className="mt-4 text-2xl font-bold text-gray-950">
                Everything is up to date
              </h2>
              <p className="mt-2 text-gray-500">
                There are no active notifications.
              </p>
            </div>
          ) : (
            <div className="mt-8 space-y-4">
              {notifications.map((notification) => (
                <Link
                  href={notification.href}
                  key={notification.id}
                  className="flex gap-4 rounded-3xl bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="pt-1">
                    <Icon notification={notification} />
                  </div>

                  <div>
                    <h2 className="font-bold text-gray-950">
                      {notification.title}
                    </h2>
                    <p className="mt-1 text-sm text-gray-600">
                      {notification.description}
                    </p>
                    {notification.siteName && (
                      <p className="mt-2 text-xs font-semibold text-violet-800">
                        {notification.siteName}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </ProtectedPage>
  );
}
