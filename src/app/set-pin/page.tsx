"use client";

import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2, Loader2, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  clearCloudSessionCache,
  getCloudSession,
} from "@/lib/cloudSession";

export default function SetPinPage() {
  const router = useRouter();
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function check(): Promise<void> {
      const session = await getCloudSession({ force: true });
      if (cancelled) return;

      if (!session.authenticated || session.authType !== "pin") {
        router.replace("/login");
        return;
      }

      if (!session.mustChangePin) {
        router.replace("/home");
        return;
      }

      setChecking(false);
    }

    void check();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (saving) return;

    if (!/^\d{4}$/.test(newPin)) {
      setError("Choose a four-digit PIN.");
      return;
    }

    if (newPin !== confirmPin) {
      setError("The PINs do not match.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/staff/change-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPin, confirmPin }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "The PIN could not be changed.");
      }

      clearCloudSessionCache();
      router.replace("/home");
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The PIN could not be changed."
      );
      setSaving(false);
    }
  }

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <Loader2 className="animate-spin text-violet-800" size={28} />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-5 py-10">
      <section className="w-full max-w-md rounded-3xl bg-white p-7 shadow-xl shadow-slate-900/10 sm:p-9">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-800">
          <LockKeyhole size={28} />
        </div>
        <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-violet-700">
          First sign-in security
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">Set your new PIN</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Your current PIN is temporary. Choose a new four-digit PIN before continuing into KitchenOps.
        </p>

        <form onSubmit={submit} className="mt-7 space-y-5">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">New PIN</span>
            <input
              autoFocus
              inputMode="numeric"
              maxLength={4}
              value={newPin}
              onChange={(event) =>
                setNewPin(event.target.value.replace(/\D/g, "").slice(0, 4))
              }
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-center text-2xl tracking-[0.5em] outline-none focus:border-violet-800"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Confirm new PIN</span>
            <input
              inputMode="numeric"
              maxLength={4}
              value={confirmPin}
              onChange={(event) =>
                setConfirmPin(event.target.value.replace(/\D/g, "").slice(0, 4))
              }
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-center text-2xl tracking-[0.5em] outline-none focus:border-violet-800"
            />
          </label>

          {error && (
            <p className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving || newPin.length !== 4 || confirmPin.length !== 4}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-800 px-5 py-3 font-bold text-white hover:bg-violet-900 disabled:opacity-60"
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
            Save new PIN
          </button>
        </form>
      </section>
    </main>
  );
}
