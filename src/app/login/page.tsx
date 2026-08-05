"use client";

import Image from "next/image";
import Link from "next/link";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  CheckCircle2,
  ChevronDown,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  Users,
} from "lucide-react";

import type {
  User,
} from "@/config/roles";

import {
  getCloudSession,
} from "@/lib/cloudSession";

import {
  setCurrentUser,
} from "@/lib/currentUser";

import {
  createClient,
} from "@/lib/supabase/client";

import {
  clearRememberedStaffDevice,
  consumeStaffSwitchRequest,
  getRememberedStaffDevice,
  rememberStaffDevice,
} from "@/lib/sharedDevice";

type LoginMode =
  | "operations"
  | "staff";

type StaffSite = {
  id: string;
  name: string;
  staff: Array<{
    id: string;
    name: string;
    role: "manager" | "chef";
  }>;
};

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] =
    useState<LoginMode>(
      "operations"
    );

  const [email, setEmail] =
    useState("");
  const [password, setPassword] =
    useState("");
  const [showPassword, setShowPassword] =
    useState(false);

  const [businessCode, setBusinessCode] =
    useState("");
  const [businessName, setBusinessName] =
    useState("");
  const [sites, setSites] =
    useState<StaffSite[]>([]);
  const [siteId, setSiteId] =
    useState("");
  const [staffId, setStaffId] =
    useState("");
  const [pin, setPin] =
    useState("");

  const [loading, setLoading] =
    useState(false);
  const [checkingSession, setCheckingSession] =
    useState(true);
  const [error, setError] =
    useState("");
  const [rememberedStaffName, setRememberedStaffName] =
    useState("");
  const [rememberedStaffRole, setRememberedStaffRole] =
    useState<"manager" | "chef" | "">("");
  const [rememberedSiteName, setRememberedSiteName] =
    useState("");


  const selectedSite = useMemo(
    () =>
      sites.find(
        (site) => site.id === siteId
      ) ?? null,
    [siteId, sites]
  );

  async function loadRememberedStaff(): Promise<void> {
    const remembered =
      getRememberedStaffDevice();

    if (!remembered) {
      return;
    }

    setMode("staff");
    setBusinessCode(
      remembered.businessCode
    );
    setRememberedStaffName(
      remembered.staffName
    );
    setRememberedStaffRole(
      remembered.staffRole
    );
    setRememberedSiteName(
      remembered.siteName
    );

    try {
      const response = await fetch(
        "/api/staff/lookup",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            businessCode:
              remembered.businessCode,
          }),
        }
      );

      const data = await response.json() as {
        error?: string;
        businessName?: string;
        sites?: StaffSite[];
      };

      if (!response.ok) {
        throw new Error(
          data.error ??
            "Business not found."
        );
      }

      const nextSites =
        data.sites ?? [];

      setBusinessName(
        data.businessName ??
          remembered.businessName
      );
      setSites(nextSites);

      const matchingSite =
        nextSites.find(
          (site) =>
            site.id ===
            remembered.siteId
        ) ?? nextSites[0];

      setSiteId(
        matchingSite?.id ?? ""
      );

      const matchingStaff =
        matchingSite?.staff.find(
          (staff) =>
            staff.id ===
            remembered.staffId
        );

      setStaffId(
        matchingStaff?.id ?? ""
      );
    } catch {
      clearRememberedStaffDevice();
      setRememberedStaffName("");
      setRememberedStaffRole("");
      setRememberedSiteName("");
    }
  }


  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const session =
          await getCloudSession();

        if (
          !cancelled &&
          session.authenticated &&
          session.user
        ) {
          setCurrentUser(session.user);
          router.replace("/home");
          router.refresh();
        }
      } finally {
        if (!cancelled) {
          setCheckingSession(false);
        }
      }
    }

    const switchingUser =
      consumeStaffSwitchRequest();

    if (switchingUser) {
      setCheckingSession(false);
      void loadRememberedStaff();
    } else {
      void check();
    }

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function operationsLogin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { error: loginError } =
        await supabase.auth
          .signInWithPassword({
            email: email.trim(),
            password,
          });

      if (loginError) throw loginError;

      const session =
        await getCloudSession();

      if (
        !session.authenticated ||
        !session.user
      ) {
        if (session.needsOnboarding) {
          router.replace(
            "/cloud-onboarding"
          );
          return;
        }

        throw new Error(
          "This account is not linked to an active KitchenOps business."
        );
      }

      setCurrentUser(session.user);
      router.replace("/home");
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "KitchenOps could not sign you in."
      );
      setLoading(false);
    }
  }

  async function findBusiness(): Promise<void> {
    if (!businessCode.trim()) {
      setError("Enter your business code.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/staff/lookup",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            businessCode,
          }),
        }
      );

      const data = await response.json() as {
        error?: string;
        businessName?: string;
        sites?: StaffSite[];
      };

      if (!response.ok) {
        throw new Error(
          data.error ??
            "Business not found."
        );
      }

      const nextSites = data.sites ?? [];
      setBusinessName(
        data.businessName ?? ""
      );
      setSites(nextSites);
      setSiteId(
        nextSites[0]?.id ?? ""
      );
      setStaffId("");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Business not found."
      );
    } finally {
      setLoading(false);
    }
  }

  async function staffLogin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/staff/login",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            businessCode,
            siteId,
            staffId,
            pin,
          }),
        }
      );

      const data = await response.json() as {
        error?: string;
        user?: User;
      };

      if (!response.ok || !data.user) {
        throw new Error(
          data.error ??
            "The PIN could not be verified."
        );
      }

      const selectedStaff =
        selectedSite?.staff.find(
          (staff) =>
            staff.id === staffId
        );

      if (
        selectedSite &&
        selectedStaff
      ) {
        rememberStaffDevice({
          businessCode:
            businessCode
              .trim()
              .toUpperCase(),
          businessName,
          siteId:
            selectedSite.id,
          siteName:
            selectedSite.name,
          staffId:
            selectedStaff.id,
          staffName:
            selectedStaff.name,
          staffRole:
            selectedStaff.role,
        });
      }

      setCurrentUser(data.user);
      router.replace("/home");
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The PIN could not be verified."
      );
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-950 text-2xl font-bold text-white shadow-lg shadow-violet-950/20">
            K
          </div>
          <p className="mt-5 text-lg font-bold text-slate-950">KitchenOps</p>
          <p className="mt-1 text-sm text-slate-500">Loading your workspace...</p>
          <Loader2 className="mx-auto mt-5 animate-spin text-violet-800" size={24} />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto grid min-h-screen max-w-[1440px] lg:grid-cols-[minmax(0,1.15fr)_minmax(440px,0.85fr)]">
        <section className="relative hidden overflow-hidden bg-gradient-to-br from-violet-950 via-violet-900 to-fuchsia-800 px-10 py-10 text-white lg:flex lg:flex-col xl:px-14 xl:py-12">
          <div className="pointer-events-none absolute -left-32 top-1/3 h-80 w-80 rounded-full bg-fuchsia-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violet-400/20 blur-3xl" />

          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl font-bold text-violet-950 shadow-lg shadow-black/10">
              K
            </div>
            <div>
              <p className="text-lg font-bold">KitchenOps</p>
              <p className="text-xs font-medium text-violet-200">by Simpson Software</p>
            </div>
          </div>

          <div className="relative z-10 mt-10 max-w-2xl">
            <h1 className="text-4xl font-bold leading-tight xl:text-5xl">
              Run your kitchen with confidence.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-violet-100 xl:text-lg xl:leading-8">
              Manage stock, recipes, prep, purchasing and daily operations from one connected workspace.
            </p>

            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-violet-100">
              {[
                "Multi-site ready",
                "Cloud synchronised",
                "Built for hospitality",
              ].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <CheckCircle2 size={17} className="text-fuchsia-200" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="relative z-10 mt-9 min-h-0 flex-1">
            <div className="h-full max-h-[580px] overflow-hidden rounded-[28px] border border-white/20 bg-white/10 p-2 shadow-2xl shadow-black/30 backdrop-blur-sm">
              <div className="flex items-center gap-2 rounded-t-[20px] border-b border-slate-200 bg-slate-50 px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <span className="ml-3 rounded-full bg-white px-4 py-1 text-[11px] font-medium text-slate-500 shadow-sm">
                  kitchenops.app/dashboard
                </span>
              </div>
              <div className="relative h-[calc(100%-48px)] overflow-hidden rounded-b-[20px] bg-slate-100">
                <Image
                  src="/kitchenops-dashboard-preview.svg"
                  alt="KitchenOps dashboard showing daily prep, stock attention, open orders and site performance"
                  fill
                  loading="eager"
                  fetchPriority="high"
                  unoptimized
                  sizes="(min-width: 1024px) 58vw, 0px"
                  className="object-cover object-top"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-100 to-transparent" />
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-4 py-8 sm:px-8 lg:bg-slate-50 xl:px-14">
          <div className="w-full max-w-md">
            <div className="mb-6 text-center lg:hidden">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-950 text-xl font-bold text-white shadow-lg shadow-violet-950/20">
                K
              </div>
              <p className="mt-3 text-xl font-bold text-slate-950">KitchenOps</p>
              <p className="mt-1 text-sm text-slate-500">Run your kitchen with confidence.</p>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-xl shadow-slate-900/5 sm:p-9">
              <p className="font-semibold text-violet-800">
                KitchenOps Cloud
              </p>
              <p className="mt-0.5 text-xs font-medium text-slate-400">by Simpson Software</p>
            <h2 className="mt-2 text-3xl font-bold text-gray-950">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Sign in to your KitchenOps account.
            </p>

            <div className="mt-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => {
                  setMode("operations");
                  setError("");
                }}
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                  mode === "operations"
                    ? "bg-white text-violet-900 shadow-sm"
                    : "text-gray-600"
                }`}
              >
                Operations
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("staff");
                  setError("");

                  if (
                    sites.length === 0
                  ) {
                    void loadRememberedStaff();
                  }
                }}
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                  mode === "staff"
                    ? "bg-white text-violet-900 shadow-sm"
                    : "text-gray-600"
                }`}
              >
                Manager / Chef
              </button>
            </div>

            {mode === "operations" ? (
              <form onSubmit={operationsLogin} className="mt-6 space-y-5">
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">Email</span>
                  <div className="relative mt-2">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-gray-300 py-3 pl-11 pr-4 outline-none focus:border-violet-800" />
                  </div>
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">Password</span>
                  <div className="relative mt-2">
                    <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-gray-300 py-3 pl-11 pr-12 outline-none focus:border-violet-800" />
                    <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-gray-500 hover:bg-slate-100">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </label>
                {error && <p className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>}
                <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-800 px-5 py-3 font-semibold text-white hover:bg-violet-900 disabled:opacity-60">
                  {loading && <Loader2 size={18} className="animate-spin" />}
                  Sign in
                </button>
                <div className="border-t pt-5 text-center">
                  <Link href="/cloud-onboarding" className="font-semibold text-violet-800 hover:underline">
                    Create a new business
                  </Link>
                </div>
              </form>
            ) : (
              <form onSubmit={staffLogin} className="mt-6 space-y-5">
                {rememberedStaffName && (
                  <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
                      Remembered on this device
                    </p>

                    <p className="mt-2 font-bold text-violet-950">
                      {rememberedStaffName}
                    </p>

                    <p className="mt-1 text-sm capitalize text-violet-800">
                      {rememberedStaffRole}
                      {" • "}
                      {rememberedSiteName}
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        clearRememberedStaffDevice();
                        setRememberedStaffName("");
                        setRememberedStaffRole("");
                        setRememberedSiteName("");
                        setBusinessCode("");
                        setBusinessName("");
                        setSites([]);
                        setSiteId("");
                        setStaffId("");
                        setPin("");
                      }}
                      className="mt-3 text-sm font-semibold text-violet-900 underline underline-offset-2"
                    >
                      Use a different business
                    </button>
                  </div>
                )}
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">Business Code</span>
                  <div className="mt-2 flex gap-2">
                    <input value={businessCode} onChange={(e) => setBusinessCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))} placeholder="MYCAFE" className="min-w-0 flex-1 rounded-xl border border-gray-300 px-4 py-3 uppercase outline-none focus:border-violet-800" />
                    <button type="button" onClick={findBusiness} className="rounded-xl border border-violet-800 px-4 font-semibold text-violet-800 hover:bg-violet-50">Find</button>
                  </div>
                </label>
                {businessName && (
                  <div className="rounded-xl bg-violet-50 p-4">
                    <p className="font-bold text-violet-950">{businessName}</p>
                  </div>
                )}
                {sites.length > 0 && (
                  <>
                    <label className="block">
                      <span className="text-sm font-semibold text-gray-700">Site</span>
                      <select value={siteId} onChange={(e) => { setSiteId(e.target.value); setStaffId(""); }} className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-violet-800">
                        {sites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-sm font-semibold text-gray-700">Name</span>
                      <div className="relative mt-2">
                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <select value={staffId} onChange={(e) => setStaffId(e.target.value)} className="w-full rounded-xl border border-gray-300 py-3 pl-11 pr-4 outline-none focus:border-violet-800">
                          <option value="">Choose your name</option>
                          {selectedSite?.staff.map((staff) => <option key={staff.id} value={staff.id}>{staff.name} — {staff.role}</option>)}
                        </select>
                      </div>
                    </label>
                    <label className="block">
                      <span className="text-sm font-semibold text-gray-700">PIN</span>
                      <input inputMode="numeric" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))} className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-center text-2xl tracking-[0.5em] outline-none focus:border-violet-800" />
                    </label>
                  </>
                )}
                {error && <p className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>}
                <button disabled={loading || !staffId || pin.length !== 4} className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-800 px-5 py-3 font-semibold text-white hover:bg-violet-900 disabled:opacity-60">
                  {loading && <Loader2 size={18} className="animate-spin" />}
                  Sign in with PIN
                </button>
              </form>
            )}
            </div>

            <details className="group mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white lg:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-semibold text-slate-800">
                See KitchenOps in action
                <ChevronDown size={18} className="transition-transform group-open:rotate-180" />
              </summary>
              <div className="border-t border-slate-200 p-3">
                <div className="relative aspect-[0.92] overflow-hidden rounded-xl bg-slate-100">
                  <Image
                    src="/kitchenops-dashboard-preview.svg"
                    alt="KitchenOps dashboard preview"
                    fill
                    loading="eager"
                    fetchPriority="high"
                    unoptimized
                    sizes="(max-width: 1023px) 100vw, 0px"
                    className="object-cover object-top"
                  />
                </div>
              </div>
            </details>

            <p className="mt-5 text-center text-xs text-slate-400">
              © 2026 Simpson Software
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
