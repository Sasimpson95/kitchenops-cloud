"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  AlertTriangle,
  Bell,
  CircleAlert,
  Info,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";

import ProtectedPage from "@/components/ProtectedPage";
import { isRouteAllowedForRole, type User } from "@/config/roles";
import { getCurrentUser } from "@/lib/currentUser";
import {
  getNotifications,
  type KitchenNotification,
} from "@/lib/notificationStore";
import { subscribeToOperationalHydration } from "@/lib/cloud/operationalSync";
import { subscribeToInventoryChanges } from "@/lib/inventoryStore";
import { subscribeToOrderChanges } from "@/lib/orderStore";
import { subscribeToPrepChanges } from "@/lib/prepStore";
import { subscribeToProductChanges } from "@/lib/productStore";
import { subscribeToStocktakeChanges } from "@/lib/stocktakeStore";
import { subscribeToWasteChanges } from "@/lib/wasteStore";

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
  const [notificationVersion, setNotificationVersion] = useState(0);

  useEffect(() => {
    const user = getCurrentUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    setCurrentUser(user);
  }, [router]);

  useEffect(() => {
    const refresh = () => setNotificationVersion((value) => value + 1);
    const unsubscribers = [
      subscribeToOperationalHydration(refresh),
      subscribeToInventoryChanges(refresh),
      subscribeToOrderChanges(refresh),
      subscribeToPrepChanges(refresh),
      subscribeToProductChanges(refresh),
      subscribeToStocktakeChanges(refresh),
      subscribeToWasteChanges(refresh),
    ];

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, []);

  if (!currentUser) {
    return (
      <ProtectedPage>
        <main className="flex min-h-screen items-center justify-center bg-slate-100">
          Loading Notifications...
        </main>
      </ProtectedPage>
    );
  }

  const notifications = useMemo(
    () => getNotifications(currentUser.site, currentUser.siteId),
    [currentUser.site, currentUser.siteId, notificationVersion]
  );

  return (
    <ProtectedPage>
      <main className="ko-page ko-enter">
        <div className="w-full max-w-5xl">
          <div>
            <h1 className="text-4xl font-bold text-gray-950">
              Notification Centre
            </h1>
            <p className="mt-2 text-gray-600">
              Actionable alerts from across KitchenOps.
            </p>
          </div>

          {notifications.length === 0 ? (
            <div className="mt-8 rounded-2xl bg-white p-12 text-center shadow-sm">
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
                  href={
                    isRouteAllowedForRole(currentUser.role, notification.href)
                      ? notification.href
                      : "/home"
                  }
                  key={notification.id}
                  className="flex gap-4 rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
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
