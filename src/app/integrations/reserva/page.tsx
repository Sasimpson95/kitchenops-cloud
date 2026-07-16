"use client";

import {
  CalendarDays,
  CheckCircle2,
  Link2,
  RefreshCw,
  Save,
} from "lucide-react";

import { useRouter } from "next/navigation";

import {
  useEffect,
  useState,
} from "react";

import ProtectedPage from "@/components/ProtectedPage";
import type { User } from "@/config/roles";
import { getCurrentUser } from "@/lib/currentUser";

import {
  getReservaSettings,
  markReservaSynced,
  saveReservaSettings,
  type ReservaSettings,
} from "@/lib/reservaStore";

import { addAuditRecord } from "@/lib/auditStore";

export default function ReservaIntegrationPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<ReservaSettings>(
    getReservaSettings()
  );
  const [saved, setSaved] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.role !== "operations") {
      router.replace("/home");
      return;
    }

    setCurrentUser(user);
    setSettings(getReservaSettings());
  }, [router]);

  function update<K extends keyof ReservaSettings>(
    field: K,
    value: ReservaSettings[K]
  ): void {
    setSettings((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function save(): void {
    const updated = saveReservaSettings({
      enabled: settings.enabled,
      apiBaseUrl: settings.apiBaseUrl,
      apiKey: settings.apiKey,
      venueId: settings.venueId,
      syncDaysAhead: settings.syncDaysAhead,
      lastSyncAt: settings.lastSyncAt,
    });

    setSettings(updated);
    setSaved(true);

    addAuditRecord({
      action: "settings-changed",
      area: "Reserva",
      title: "Reserva settings updated",
      description: updated.enabled
        ? "Reserva integration enabled or updated."
        : "Reserva integration settings saved while disabled.",
      performedBy: currentUser?.name || "Operations",
    });

    window.setTimeout(() => setSaved(false), 2000);
  }

  function testSync(): void {
    setSyncing(true);

    window.setTimeout(() => {
      const updated = markReservaSynced();
      setSettings(updated);
      setSyncing(false);
    }, 800);
  }

  if (!currentUser) {
    return (
      <ProtectedPage>
        <main className="flex min-h-screen items-center justify-center bg-slate-100">
          Loading Reserva...
        </main>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage>
      <main className="min-h-screen bg-slate-100 p-4 sm:p-8">
        <div className="mx-auto max-w-5xl">
          <div>
            <p className="font-semibold text-violet-800">Integration</p>
            <h1 className="mt-1 text-4xl font-bold text-gray-950">
              Reserva
            </h1>
            <p className="mt-2 text-gray-600">
              Connect booking data to covers, prep planning and forecasting.
            </p>
          </div>

          <section className="mt-8 rounded-3xl bg-white p-8 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-800">
                <Link2 size={24} />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-950">
                  Connection Settings
                </h2>
                <p className="mt-1 text-gray-600">
                  Enter the read-only API details supplied by Reserva.
                </p>
              </div>
            </div>

            <label className="mt-7 flex cursor-pointer items-center justify-between rounded-2xl border border-gray-200 p-5">
              <div>
                <p className="font-bold text-gray-950">
                  Enable Reserva Integration
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  KitchenOps will be ready to request booking and cover data.
                </p>
              </div>

              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(event) => update("enabled", event.target.checked)}
                className="h-6 w-6 accent-violet-800"
              />
            </label>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <label>
                <span className="text-sm font-semibold text-gray-700">
                  API Base URL
                </span>
                <input
                  value={settings.apiBaseUrl}
                  onChange={(event) =>
                    update("apiBaseUrl", event.target.value)
                  }
                  placeholder="https://api.reserva.example"
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-violet-800"
                />
              </label>

              <label>
                <span className="text-sm font-semibold text-gray-700">
                  Venue ID
                </span>
                <input
                  value={settings.venueId}
                  onChange={(event) =>
                    update("venueId", event.target.value)
                  }
                  placeholder="Venue identifier"
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-violet-800"
                />
              </label>

              <label className="md:col-span-2">
                <span className="text-sm font-semibold text-gray-700">
                  Read-Only API Key
                </span>
                <input
                  type="password"
                  value={settings.apiKey}
                  onChange={(event) => update("apiKey", event.target.value)}
                  placeholder="Paste API key"
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-violet-800"
                />
              </label>

              <label>
                <span className="text-sm font-semibold text-gray-700">
                  Sync Days Ahead
                </span>
                <input
                  type="number"
                  min={1}
                  value={settings.syncDaysAhead}
                  onChange={(event) =>
                    update("syncDaysAhead", Number(event.target.value))
                  }
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-violet-800"
                />
              </label>

              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-sm text-gray-500">Last Connection Test</p>
                <p className="mt-1 font-bold text-gray-950">
                  {settings.lastSyncAt
                    ? new Intl.DateTimeFormat("en-GB", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(settings.lastSyncAt))
                    : "Not tested"}
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-end gap-3 border-t pt-6">
              {saved && (
                <span className="inline-flex items-center gap-2 font-semibold text-violet-800">
                  <CheckCircle2 size={18} />
                  Saved
                </span>
              )}

              <button
                type="button"
                onClick={testSync}
                disabled={syncing}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw size={18} className={syncing ? "animate-spin" : ""} />
                {syncing ? "Testing..." : "Test Connection"}
              </button>

              <button
                type="button"
                onClick={save}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-800 px-6 py-3 font-semibold text-white hover:bg-violet-900"
              >
                <Save size={18} />
                Save Settings
              </button>
            </div>
          </section>

          <section className="mt-6 rounded-3xl bg-blue-50 p-6">
            <div className="flex gap-3">
              <CalendarDays size={24} className="shrink-0 text-blue-800" />
              <div>
                <h2 className="font-bold text-blue-950">
                  Integration framework ready
                </h2>
                <p className="mt-1 text-sm leading-6 text-blue-800">
                  This update stores connection details and prepares the workflow.
                  Live bookings require the actual Reserva API documentation and
                  credentials before real requests can be implemented.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </ProtectedPage>
  );
}
