"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { CheckCircle2, Loader2, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading || !email.trim()) return;
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
      if (resetError) throw resetError;
      setSent(true);
    } catch {
      setError("KitchenOps could not send the reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-7 shadow-xl shadow-slate-900/5 sm:p-9">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-950 text-xl font-bold text-white">K</div>
        <p className="mt-5 font-semibold text-violet-800">KitchenOps Cloud</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-950">Reset your password</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Enter the email address used for your Operations account.</p>
        {sent ? (
          <div className="mt-7">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex gap-3">
                <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-700" size={20} />
                <div>
                  <p className="font-bold text-emerald-950">Check your email</p>
                  <p className="mt-1 text-sm leading-6 text-emerald-800">If an account exists for that email address, a password reset link has been sent.</p>
                </div>
              </div>
            </div>
            <Link href="/login" className="mt-6 flex w-full items-center justify-center rounded-xl border border-violet-800 px-5 py-3 font-semibold text-violet-800 hover:bg-violet-50">Back to sign in</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-7 space-y-5">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Email</span>
              <div className="relative mt-2">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-slate-300 py-3 pl-11 pr-4 outline-none focus:border-violet-800" />
              </div>
            </label>
            {error && <p className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>}
            <button disabled={loading || !email.trim()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-800 px-5 py-3 font-semibold text-white hover:bg-violet-900 disabled:opacity-60">{loading && <Loader2 size={18} className="animate-spin" />}Send reset link</button>
            <div className="border-t pt-5 text-center"><Link href="/login" className="font-semibold text-violet-800 hover:underline">Back to sign in</Link></div>
          </form>
        )}
      </div>
    </main>
  );
}