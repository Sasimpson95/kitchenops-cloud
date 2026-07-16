"use client";

import Link from "next/link";

import {
  AlertTriangle,
  Bell,
  CircleAlert,
  Info,
  X,
} from "lucide-react";

import { useState } from "react";

import type { User } from "@/config/roles";
import {
  getNotifications,
  type KitchenNotification,
} from "@/lib/notificationStore";

type NotificationPopoverProps = {
  currentUser: User;
};

function NotificationIcon({
  notification,
}: {
  notification: KitchenNotification;
}) {
  if (notification.severity === "critical") {
    return <CircleAlert size={18} className="text-red-700" />;
  }

  if (notification.severity === "warning") {
    return <AlertTriangle size={18} className="text-orange-700" />;
  }

  return <Info size={18} className="text-blue-700" />;
}

export default function NotificationPopover({
  currentUser,
}: NotificationPopoverProps) {
  const [open, setOpen] = useState(false);

  const notifications = getNotifications(currentUser.site);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-gray-300 text-gray-700 transition hover:bg-slate-50"
        aria-label="Notifications"
      >
        <Bell size={19} />

        {notifications.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {Math.min(notifications.length, 99)}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[min(420px,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b p-5">
            <div>
              <h2 className="font-bold text-gray-950">Notifications</h2>
              <p className="mt-1 text-xs text-gray-500">
                {notifications.length} item
                {notifications.length === 1 ? "" : "s"} need attention
              </p>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-slate-100"
            >
              <X size={18} />
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-3">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell size={30} className="mx-auto text-violet-700" />
                <p className="mt-3 font-bold text-gray-950">All clear</p>
                <p className="mt-1 text-sm text-gray-500">
                  Nothing needs your attention right now.
                </p>
              </div>
            ) : (
              notifications.slice(0, 20).map((notification) => (
                <Link
                  key={notification.id}
                  href={notification.href}
                  onClick={() => setOpen(false)}
                  className="flex gap-3 rounded-2xl p-4 transition hover:bg-slate-50"
                >
                  <div className="pt-0.5">
                    <NotificationIcon notification={notification} />
                  </div>

                  <div>
                    <p className="font-semibold text-gray-950">
                      {notification.title}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {notification.description}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>

          <div className="border-t p-3">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block rounded-xl bg-violet-800 px-4 py-3 text-center font-semibold text-white hover:bg-violet-900"
            >
              Open Notification Centre
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
