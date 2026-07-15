"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { setCurrentUser } from "@/lib/currentUser";

export default function CloudOnboardingPage() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [businessCode, setBusinessCode] = useState("");
  const [siteName, setSiteName] = useState("");
  const [operationsName, setOperationsName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function createBusiness() {
    if (loading) return;
    if (!businessName.trim() || !businessCode.trim() || !siteName.trim() || !operationsName.trim() || !email.trim() || password.length < 8) {
      setError("Complete every field. Password must contain at least 8 characters.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { data: signup, error: signupError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { display_name: operationsName.trim() } },
      });
      if (signupError) throw signupError;
      if (!signup.user) throw new Error("The Operations account could not be created.");
      if (!signup.session) throw new Error("Email confirmation is enabled. Confirm the email, then sign in to finish setup.");

      const { error: businessError } = await supabase.rpc("create_kitchenops_business", {
        business_name: businessName.trim(),
        business_code: businessCode.trim().toUpperCase(),
        operations_name: operationsName.trim(),
        first_site_name: siteName.trim(),
      });
      if (businessError) throw businessError;

      setCurrentUser({ name: operationsName.trim(), role: "operations", site: "All Sites" });
      router.replace("/home");
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "KitchenOps could not create the business.");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <section className="w-full max-w-2xl rounded-3xl bg-white p-7 shadow-sm sm:p-9">
        <p className="font-semibold text-green-800">Fresh installation</p>
        <h1 className="mt-2 text-3xl font-bold text-gray-950">Create your KitchenOps business</h1>
        <p className="mt-2 text-gray-500">Create the Operations account, business and first site together.</p>
        <div className="mt-7 grid gap-5 sm:grid-cols-2">
          <label><span className="text-sm font-semibold text-gray-700">Business Name</span><input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="The Pudding Pantry" className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-800" /></label>
          <label><span className="text-sm font-semibold text-gray-700">Business Code</span><input value={businessCode} onChange={(e) => setBusinessCode(e.target.value.toUpperCase().replace(/\s/g, ""))} placeholder="PUDDING" className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 uppercase outline-none focus:border-green-800" /></label>
          <label><span className="text-sm font-semibold text-gray-700">First Site</span><input value={siteName} onChange={(e) => setSiteName(e.target.value)} placeholder="Beeston" className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-800" /></label>
          <label><span className="text-sm font-semibold text-gray-700">Your Name</span><input value={operationsName} onChange={(e) => setOperationsName(e.target.value)} placeholder="Stephen" className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-800" /></label>
          <label><span className="text-sm font-semibold text-gray-700">Operations Email</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-800" /></label>
          <label><span className="text-sm font-semibold text-gray-700">Password</span><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-800" /></label>
        </div>
        {error && <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>}
        <button type="button" disabled={loading} onClick={createBusiness} className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-green-800 px-5 py-3 font-semibold text-white hover:bg-green-900 disabled:opacity-60">
          {loading && <Loader2 size={18} className="animate-spin" />}
          {loading ? "Creating Business..." : "Create Business"}
        </button>
        <p className="mt-5 text-center text-sm text-gray-500">Already set up? <Link href="/login" className="font-semibold text-green-800">Sign in</Link></p>
      </section>
    </main>
  );
}
