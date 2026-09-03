"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2, Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [checking, setChecking] = useState(true);
  const [validSession, setValidSession] = useState(false);
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function checkSession() {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      if (!cancelled) {
        setValidSession(Boolean(data.session));
        setChecking(false);
      }
    }
    void checkSession();
    return () => { cancelled = true; };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setError("");
    if (password.length < 8) { setError("Use at least 8 characters for your new password."); return; }
    if (password !== confirmPassword) { setError("The passwords do not match."); return; }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      await supabase.auth.signOut();
      setComplete(true);
    } catch {
      setError("KitchenOps could not update your password. Request a new reset link and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (checking) return <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4"><Loader2 className="animate-spin text-violet-800" size={28} /></main>;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-7 shadow-xl shadow-slate-900/5 sm:p-9">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-950 text-xl font-bold text-white">K</div>
        {complete ? (
          <>
            <div className="mt-7 rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><div className="flex gap-3"><CheckCircle2 className="mt-0.5 shrink-0 text-emerald-700" size={20} /><div><h1 className="text-xl font-bold text-emerald-950">Password updated</h1><p className="mt-1 text-sm leading-6 text-emerald-800">Your KitchenOps password has been changed successfully.</p></div></div></div>
            <Link href="/login" className="mt-6 flex w-full items-center justify-center rounded-xl bg-violet-800 px-5 py-3 font-semibold text-white hover:bg-violet-900">Sign in</Link>
          </>
        ) : !validSession ? (
          <>
            <h1 className="mt-5 text-3xl font-bold text-slate-950">Reset link expired</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">This password reset link is invalid or has expired. Request a new one to continue.</p>
            <Link href="/forgot-password" className="mt-6 flex w-full items-center justify-center rounded-xl bg-violet-800 px-5 py-3 font-semibold text-white hover:bg-violet-900">Request a new link</Link>
          </>
        ) : (
          <>
            <p className="mt-5 font-semibold text-violet-800">KitchenOps Cloud</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-950">Choose a new password</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">Your new password must contain at least 8 characters.</p>
            <form onSubmit={submit} className="mt-7 space-y-5">
              <label className="block"><span className="text-sm font-semibold text-slate-700">New password</span><div className="relative mt-2"><LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type={showPassword ? "text" : "password"} autoComplete="new-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-slate-300 py-3 pl-11 pr-12 outline-none focus:border-violet-800" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>
              <label className="block"><span className="text-sm font-semibold text-slate-700">Confirm new password</span><div className="relative mt-2"><LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type={showPassword ? "text" : "password"} autoComplete="new-password" required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full rounded-xl border border-slate-300 py-3 pl-11 pr-4 outline-none focus:border-violet-800" /></div></label>
              {error && <p className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>}
              <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-800 px-5 py-3 font-semibold text-white hover:bg-violet-900 disabled:opacity-60">{loading && <Loader2 size={18} className="animate-spin" />}Update password</button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}