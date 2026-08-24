"use client";

import {
  AlertTriangle,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import ProtectedPage from "@/components/ProtectedPage";

type DeleteResponse = {
  ok?: boolean;
  code?: string;
  error?: string;
  message?: string;
};

export default function AccountSettingsPage() {
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const canDelete = confirmation === "DELETE" && !deleting;

  async function deleteAccount(): Promise<void> {
    if (!canDelete) return;

    setDeleting(true);
    setError("");

    try {
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          confirmation,
        }),
      });

      const result = (await response.json()) as DeleteResponse;

      if (!response.ok || !result.ok) {
        if (result.code === "SOLE_OPERATIONS_USER") {
          setError(
            result.error ??
              "Another Operations user must be added before this account can be deleted."
          );
        } else {
          setError(
            result.error ??
              "Your account could not be deleted."
          );
        }

        setDeleting(false);
        return;
      }

      window.location.replace("/login");
    } catch {
      setError(
        "KitchenOps could not complete the deletion request. Please try again."
      );
      setDeleting(false);
    }
  }

  return (
    <ProtectedPage>
      <main className="ko-page ko-enter">
        <div className="w-full max-w-4xl">
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 text-sm font-semibold text-violet-800 hover:text-violet-950"
          >
            <ArrowLeft size={17} />
            Back to Settings
          </Link>

          <div className="mt-6 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-800">
              <UserRound size={24} />
            </div>

            <div>
              <p className="font-semibold text-violet-800">
                Account
              </p>

              <h1 className="mt-1 text-4xl font-bold text-gray-950">
                Account & Privacy
              </h1>

              <p className="mt-2 max-w-2xl text-gray-600">
                Manage your KitchenOps account and understand what happens to
                your business data if your login is removed.
              </p>
            </div>
          </div>

          <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <ShieldCheck size={22} />
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-950">
                  Your account
                </h2>

                <p className="mt-2 leading-7 text-gray-600">
                  Your Operations login is separate from your KitchenOps
                  business, sites, staff and operational records.
                </p>

                <p className="mt-3 leading-7 text-gray-600">
                  Deleting your account removes your own KitchenOps login and
                  business membership. It does not automatically delete the
                  entire business or its kitchen records.
                </p>
              </div>
            </div>
          </section>

          <section className="mt-6 rounded-2xl border border-red-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-700">
                <Trash2 size={22} />
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-950">
                  Delete my account
                </h2>

                <p className="mt-2 leading-7 text-gray-600">
                  This permanently removes your KitchenOps Operations login.
                  You will no longer be able to sign in using this account.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-amber-50 p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle
                  size={21}
                  className="mt-0.5 shrink-0 text-amber-700"
                />

                <div>
                  <p className="font-bold text-amber-950">
                    Before deleting your account
                  </p>

                  <ul className="mt-2 space-y-2 text-sm leading-6 text-amber-900">
                    <li>
                      • KitchenOps business data is not automatically deleted.
                    </li>
                    <li>
                      • Prep, purchasing, waste, stocktakes and handovers remain
                      attached to the business.
                    </li>
                    <li>
                      • If you are the only active Operations user, KitchenOps
                      will stop the deletion so the business is not left
                      without an administrator.
                    </li>
                    <li>
                      • Business deletion is a separate process.
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-6 rounded-2xl bg-red-50 p-4 text-sm font-semibold leading-6 text-red-700">
                {error}
              </div>
            )}

            <div className="mt-7">
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">
                  Type DELETE to confirm
                </span>

                <input
                  type="text"
                  value={confirmation}
                  onChange={(event) =>
                    setConfirmation(event.target.value)
                  }
                  autoComplete="off"
                  spellCheck={false}
                  disabled={deleting}
                  className="mt-2 w-full max-w-md rounded-xl border border-gray-300 px-4 py-3 font-mono outline-none focus:border-red-500 disabled:bg-gray-100"
                  placeholder="DELETE"
                />
              </label>

              <button
                type="button"
                onClick={deleteAccount}
                disabled={!canDelete}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-700 px-5 py-3 font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {deleting ? (
                  <Loader2
                    className="animate-spin"
                    size={18}
                  />
                ) : (
                  <Trash2 size={18} />
                )}

                {deleting
                  ? "Deleting account..."
                  : "Permanently delete my account"}
              </button>
            </div>
          </section>
        </div>
      </main>
    </ProtectedPage>
  );
}