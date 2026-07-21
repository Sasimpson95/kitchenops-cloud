"use client";

import { CalendarDays, Clock3, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedPage from "@/components/ProtectedPage";
import type { User } from "@/config/roles";
import { getCurrentUser } from "@/lib/currentUser";
import { useBusinessSites } from "@/lib/useBusinessSites";
import {
  getSiteHandover,
  rollOverHandoversIfNeeded,
  saveSiteHandover,
  subscribeToHandoverChanges,
} from "@/lib/handoverStore";

type History = {
  id: string;
  site_name: string;
  handover_day: "today" | "tomorrow";
  notes: string[];
  updated_by: string;
  created_at: string;
  visible_to_chefs?: boolean;
};

function formatTomorrow(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default function HandoverPage() {
  const router = useRouter();
  const { siteNames: sites, loading: loadingSites } = useBusinessSites();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedSite, setSelectedSite] = useState("");
  const [todayNotes, setTodayNotes] = useState<string[]>([]);
  const [todayVisibleToChefs, setTodayVisibleToChefs] = useState(false);
  const [tomorrowText, setTomorrowText] = useState("");
  const [tomorrowVisibleToChefs, setTomorrowVisibleToChefs] = useState(false);
  const [history, setHistory] = useState<History[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const canWriteHandover =
    currentUser?.role === "manager" || currentUser?.role === "operations";

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.replace("/login");
      return;
    }

    rollOverHandoversIfNeeded();
    setCurrentUser(user);
    setSelectedSite(user.role === "operations" ? "" : user.site);
  }, [router]);

  useEffect(() => {
    if (currentUser?.role === "operations" && !selectedSite && sites[0]) {
      setSelectedSite(sites[0]);
    }
  }, [currentUser, selectedSite, sites]);

  useEffect(() => {
    if (!selectedSite) return;

    const refresh = (): void => {
      const today = getSiteHandover(selectedSite, "today");
      const tomorrow = getSiteHandover(selectedSite, "tomorrow");
      setTodayNotes(today.notes);
      setTodayVisibleToChefs(today.visibleToChefs);
      setTomorrowText(tomorrow.notes.join("\n"));
      setTomorrowVisibleToChefs(tomorrow.visibleToChefs);
    };

    refresh();
    return subscribeToHandoverChanges(refresh);
  }, [selectedSite]);

  async function loadHistory(siteName = selectedSite): Promise<void> {
    if (!siteName) return;

    setLoadingHistory(true);
    try {
      const response = await fetch(
        `/api/cloud/handovers?siteName=${encodeURIComponent(siteName)}`,
        { cache: "no-store" }
      );
      const data = (await response.json()) as { history?: History[] };
      setHistory(data.history ?? []);
    } finally {
      setLoadingHistory(false);
    }
  }

  useEffect(() => {
    void loadHistory(selectedSite);
  }, [selectedSite]);

  async function saveTomorrow(): Promise<void> {
    if (!currentUser || !selectedSite || !canWriteHandover) return;

    const notes = tomorrowText
      .split("\n")
      .map((note) => note.trim())
      .filter(Boolean);

    setSaving(true);
    setSaved(false);
    setError("");

    try {
      const updatedBy = currentUser.name || currentUser.role;
      saveSiteHandover({
        siteName: selectedSite,
        day: "tomorrow",
        notes,
        updatedBy,
        visibleToChefs: tomorrowVisibleToChefs,
      });

      const response = await fetch("/api/cloud/handovers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteName: selectedSite,
          day: "tomorrow",
          notes,
          updatedBy,
          visibleToChefs: tomorrowVisibleToChefs,
        }),
      });

      if (!response.ok) {
        const result = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(result.error || "The handover could not be saved.");
      }

      setSaved(true);
      await loadHistory();
      window.setTimeout(() => setSaved(false), 1800);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The handover could not be saved."
      );
    } finally {
      setSaving(false);
    }
  }

  const filteredHistory = useMemo(
    () => history.filter((item) => item.handover_day === "tomorrow"),
    [history]
  );

  if (!currentUser || loadingSites) {
    return (
      <ProtectedPage>
        <main className="min-h-screen bg-slate-100 p-4 sm:p-8" />
      </ProtectedPage>
    );
  }

  if (!selectedSite) {
    return (
      <ProtectedPage>
        <main className="min-h-screen bg-slate-100 p-4 sm:p-8">
          <div className="mx-auto max-w-4xl rounded-3xl bg-white p-10 text-center shadow-sm">
            <h1 className="text-3xl font-bold text-gray-950">No sites yet</h1>
            <p className="mt-3 text-gray-600">
              Add your first site in Settings before using Handover.
            </p>
            <a
              href="/settings/sites"
              className="mt-6 inline-flex rounded-xl bg-violet-800 px-5 py-3 font-semibold text-white hover:bg-violet-900"
            >
              Add first site
            </a>
          </div>
        </main>
      </ProtectedPage>
    );
  }

  if (currentUser.role === "chef" && !todayVisibleToChefs) {
    return (
      <ProtectedPage>
        <main className="min-h-screen bg-slate-100 p-4 sm:p-8">
          <div className="mx-auto max-w-4xl rounded-3xl bg-white p-10 text-center shadow-sm">
            <h1 className="text-3xl font-bold text-gray-950">Handover</h1>
            <p className="mt-3 text-gray-600">
              No handover has been shared with the kitchen team today.
            </p>
            <button
              type="button"
              onClick={() => router.push("/home")}
              className="mt-6 rounded-xl bg-violet-800 px-5 py-3 font-semibold text-white hover:bg-violet-900"
            >
              Back to Dashboard
            </button>
          </div>
        </main>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage>
      <main className="min-h-screen bg-slate-100 p-4 sm:p-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <h1 className="text-4xl font-bold text-gray-950">Handover</h1>
              <p className="mt-2 text-gray-600">
                Simple notes written by the manager the day before for the next kitchen team.
                {currentUser.role === "chef" &&
                  " Reading handover notes is optional."}
              </p>
            </div>

            {currentUser.role === "operations" && (
              <select
                value={selectedSite}
                onChange={(event) => setSelectedSite(event.target.value)}
                className="rounded-xl border border-gray-300 bg-white px-4 py-3 font-semibold outline-none focus:border-violet-800"
              >
                {sites.map((site) => (
                  <option key={site}>{site}</option>
                ))}
              </select>
            )}
          </div>

          <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <CalendarDays size={22} className="text-violet-800" />
              <div>
                <h2 className="text-xl font-bold text-gray-950">Today's Handover</h2>
                <p className="text-sm text-gray-500">
                  Notes left by yesterday's manager for {selectedSite}.
                </p>
              </div>
            </div>

            {todayNotes.length === 0 ? (
              <div className="mt-5 rounded-2xl bg-slate-50 p-8 text-center text-gray-500">
                No handover notes were left for today.
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {todayNotes.map((note, index) => (
                  <div
                    key={`${index}-${note}`}
                    className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-gray-700"
                  >
                    • {note}
                  </div>
                ))}
              </div>
            )}
          </section>

          {canWriteHandover && (
            <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <CalendarDays size={22} className="text-violet-800" />
                <div>
                  <h2 className="text-xl font-bold text-gray-950">
                    Tomorrow's Handover
                  </h2>
                  <p className="text-sm text-gray-500">
                    For {formatTomorrow()} · {selectedSite}
                  </p>
                </div>
              </div>

              <label className="mt-5 block">
                <span className="text-sm font-semibold text-gray-700">
                  Notes for tomorrow's team
                </span>
                <textarea
                  value={tomorrowText}
                  onChange={(event) => {
                    setTomorrowText(event.target.value);
                    setSaved(false);
                  }}
                  rows={9}
                  placeholder={
                    "Fridge 2 is running slightly warm, keep an eye on it.\nBrakes delivery due around 9am.\nNew brunch special starts tomorrow."
                  }
                  className="mt-2 w-full rounded-2xl border border-gray-300 px-4 py-4 leading-7 outline-none focus:border-violet-800"
                />
              </label>

              <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-violet-200 bg-violet-50 p-4">
                <input
                  type="checkbox"
                  checked={tomorrowVisibleToChefs}
                  onChange={(event) => {
                    setTomorrowVisibleToChefs(event.target.checked);
                    setSaved(false);
                  }}
                  className="mt-1 h-5 w-5 accent-violet-800"
                />
                <span>
                  <span className="block font-semibold text-violet-950">
                    Visible to chefs
                  </span>
                  <span className="mt-1 block text-sm text-violet-800">
                    Leave this off for manager-only notes. Turn it on only when tomorrow's kitchen team should see this handover.
                  </span>
                </span>
              </label>

              <p className="mt-3 text-xs text-gray-500">
                Put each note on a new line. Tomorrow these notes automatically become Today's Handover.
              </p>

              {error && (
                <p className="mt-4 rounded-xl bg-red-50 p-3 font-semibold text-red-700">
                  {error}
                </p>
              )}

              <div className="mt-6 flex items-center justify-end gap-3 border-t pt-5">
                {saved && (
                  <span className="text-sm font-semibold text-green-700">Saved</span>
                )}
                <button
                  type="button"
                  onClick={() => void saveTomorrow()}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-800 px-5 py-3 font-semibold text-white hover:bg-violet-900 disabled:opacity-60"
                >
                  <Save size={18} />
                  {saving ? "Saving..." : "Save Tomorrow's Handover"}
                </button>
              </div>
            </section>
          )}

          <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Clock3 className="text-violet-800" />
              <div>
                <h2 className="text-2xl font-bold text-gray-950">Handover History</h2>
                <p className="text-sm text-gray-500">
                  Previous manager handover notes for {selectedSite}.
                </p>
              </div>
            </div>

            {loadingHistory ? (
              <p className="mt-5 text-gray-500">Loading history…</p>
            ) : filteredHistory.length === 0 ? (
              <p className="mt-5 rounded-2xl bg-slate-50 p-6 text-gray-500">
                No saved handovers yet.
              </p>
            ) : (
              <div className="mt-6 space-y-4">
                {filteredHistory.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-gray-200 p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-bold text-gray-950">
                        {new Date(item.created_at).toLocaleDateString("en-GB", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          Written by {item.updated_by} · {new Date(item.created_at).toLocaleTimeString("en-GB", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        {item.visible_to_chefs && (
                          <span className="mt-2 inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-800">
                            Shared with chefs
                          </span>
                        )}
                      </div>
                    </div>

                    {item.notes.length > 0 ? (
                      <div className="mt-3 space-y-2 text-sm text-gray-700">
                        {item.notes.map((note, index) => (
                          <p key={`${item.id}-${index}`}>• {note}</p>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-gray-500">No notes were added.</p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </ProtectedPage>
  );
}
