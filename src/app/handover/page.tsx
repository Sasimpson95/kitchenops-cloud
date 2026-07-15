"use client";

import {
  CalendarDays,
  Plus,
  Save,
  Trash2,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import ProtectedPage from "@/components/ProtectedPage";

import type {
  User,
} from "@/config/roles";

import {
  getCurrentUser,
} from "@/lib/currentUser";

import {
  getSiteHandover,
  saveSiteHandover,
  subscribeToHandoverChanges,
  type HandoverDay,
} from "@/lib/handoverStore";

const SITES = [
  "Beeston",
  "City",
  "Sherwood",
  "Bakery",
];

function NotesEditor({
  title,
  siteName,
  day,
  currentUser,
}: {
  title: string;
  siteName: string;
  day: HandoverDay;
  currentUser: User;
}) {
  const [
    notes,
    setNotes,
  ] = useState<string[]>([]);

  const [
    newNote,
    setNewNote,
  ] = useState("");

  const [
    saved,
    setSaved,
  ] = useState(false);

  useEffect(() => {
    function refresh(): void {
      setNotes(
        getSiteHandover(
          siteName,
          day
        ).notes
      );
    }

    refresh();

    return subscribeToHandoverChanges(
      refresh
    );
  }, [siteName, day]);

  function addNote(): void {
    const note =
      newNote.trim();

    if (!note) {
      return;
    }

    setNotes(
      (current) => [
        ...current,
        note,
      ]
    );

    setNewNote("");
    setSaved(false);
  }

  function removeNote(
    index: number
  ): void {
    setNotes(
      (current) =>
        current.filter(
          (_, noteIndex) =>
            noteIndex !== index
        )
    );

    setSaved(false);
  }

  function save(): void {
    saveSiteHandover({
      siteName,
      day,
      notes,
      updatedBy:
        currentUser.name ||
        currentUser.role,
    });

    setSaved(true);

    window.setTimeout(
      () =>
        setSaved(false),
      1800
    );
  }

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <CalendarDays
          size={22}
          className="text-green-800"
        />

        <h2 className="text-xl font-bold text-gray-950">
          {title}
        </h2>
      </div>

      <div className="mt-5 flex gap-3">
        <input
          value={newNote}
          onChange={(event) =>
            setNewNote(
              event.target.value
            )
          }
          onKeyDown={(event) => {
            if (
              event.key ===
              "Enter"
            ) {
              event.preventDefault();
              addNote();
            }
          }}
          placeholder="Add a handover note..."
          className="min-w-0 flex-1 rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-800"
        />

        <button
          type="button"
          onClick={addNote}
          className="inline-flex items-center gap-2 rounded-xl border border-green-800 px-4 py-3 font-semibold text-green-800 hover:bg-green-50"
        >
          <Plus size={18} />
          Add
        </button>
      </div>

      {notes.length === 0 ? (
        <div className="mt-5 rounded-2xl bg-slate-50 p-8 text-center text-gray-500">
          No handover notes have been added.
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {notes.map(
            (note, index) => (
              <div
                key={`${day}-${index}-${note}`}
                className="flex items-start justify-between gap-4 rounded-2xl bg-slate-50 p-4"
              >
                <p className="text-sm leading-6 text-gray-700">
                  {note}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    removeNote(
                      index
                    )
                  }
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-red-700 hover:bg-red-50"
                  aria-label="Delete handover note"
                >
                  <Trash2
                    size={17}
                  />
                </button>
              </div>
            )
          )}
        </div>
      )}

      <div className="mt-6 flex items-center justify-end gap-3 border-t pt-5">
        {saved && (
          <span className="text-sm font-semibold text-green-800">
            Saved
          </span>
        )}

        <button
          type="button"
          onClick={save}
          className="inline-flex items-center gap-2 rounded-xl bg-green-800 px-5 py-3 font-semibold text-white hover:bg-green-900"
        >
          <Save size={18} />
          Save Handover
        </button>
      </div>
    </section>
  );
}

export default function HandoverPage() {
  const router =
    useRouter();

  const [
    currentUser,
    setCurrentUser,
  ] = useState<User | null>(
    null
  );

  const [
    selectedSite,
    setSelectedSite,
  ] = useState("");

  useEffect(() => {
    const user =
      getCurrentUser();

    if (!user) {
      router.replace(
        "/login"
      );
      return;
    }

    setCurrentUser(user);

    setSelectedSite(
      user.role ===
      "operations"
        ? "Beeston"
        : user.site
    );
  }, [router]);

  if (
    !currentUser ||
    !selectedSite
  ) {
    return (
      <ProtectedPage>
        <main className="flex min-h-screen items-center justify-center bg-slate-100">
          Loading Handover...
        </main>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage>
      <main className="min-h-screen bg-slate-100 p-4 sm:p-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <h1 className="text-4xl font-bold text-gray-950">
                Handover
              </h1>

              <p className="mt-2 text-gray-600">
                Add notes for today and prepare tomorrow&apos;s handover.
              </p>
            </div>

            {currentUser.role ===
              "operations" && (
              <select
                value={
                  selectedSite
                }
                onChange={(
                  event
                ) =>
                  setSelectedSite(
                    event.target
                      .value
                  )
                }
                className="rounded-xl border border-gray-300 bg-white px-4 py-3 font-semibold outline-none focus:border-green-800"
              >
                {SITES.map(
                  (site) => (
                    <option
                      key={site}
                      value={site}
                    >
                      {site}
                    </option>
                  )
                )}
              </select>
            )}
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-2">
            <NotesEditor
              title="Today's Handover"
              siteName={
                selectedSite
              }
              day="today"
              currentUser={
                currentUser
              }
            />

            <NotesEditor
              title="Tomorrow's Handover"
              siteName={
                selectedSite
              }
              day="tomorrow"
              currentUser={
                currentUser
              }
            />
          </div>
        </div>
      </main>
    </ProtectedPage>
  );
}
