"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Building2,
  CalendarClock,
  Check,
  Copy,
  Loader2,
  Save,
  ShieldCheck,
  Store,
  UsersRound,
} from "lucide-react";

import ProtectedPage from "@/components/ProtectedPage";
import {
  getBusinessSettings,
  saveBusinessSettings,
  type StocktakeFrequency,
  type WeekStartDay,
} from "@/lib/businessSettingsStore";
import {
  getCloudSession,
} from "@/lib/cloudSession";
import {
  createClient,
} from "@/lib/supabase/client";

type BusinessRow = {
  id: string;
  name: string;
  code: string;
  created_at: string;
};

type MembershipRow = {
  id: string;
  display_name: string;
  role: string;
  active: boolean;
};

const FREQUENCIES: Array<{
  value: StocktakeFrequency;
  label: string;
  description: string;
}> = [
  {
    value: "daily",
    label: "Daily",
    description: "One stocktake per site each day.",
  },
  {
    value: "weekly",
    label: "Weekly",
    description: "One stocktake per site each week.",
  },
  {
    value: "monthly",
    label: "Monthly",
    description: "One stocktake per site each calendar month.",
  },
  {
    value: "every-4-weeks",
    label: "Every 4 Weeks",
    description: "Four-week periods based on the selected start day.",
  },
  {
    value: "quarterly",
    label: "Quarterly",
    description: "One stocktake per site each calendar quarter.",
  },
  {
    value: "manual",
    label: "Manual",
    description: "Start stocktakes whenever required.",
  },
];

const WEEK_DAYS: WeekStartDay[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "long",
  }).format(date);
}

export default function SettingsPage() {
  const [business, setBusiness] =
    useState<BusinessRow | null>(null);
  const [businessName, setBusinessName] =
    useState("");
  const [operationsUsers, setOperationsUsers] =
    useState<MembershipRow[]>([]);
  const [siteCount, setSiteCount] =
    useState(0);
  const [staffCount, setStaffCount] =
    useState(0);
  const [loading, setLoading] =
    useState(true);
  const [savingBusiness, setSavingBusiness] =
    useState(false);
  const [copied, setCopied] =
    useState(false);
  const [error, setError] =
    useState("");
  const [success, setSuccess] =
    useState("");

  const localSettings = useMemo(
    () => getBusinessSettings(),
    []
  );

  const [frequency, setFrequency] =
    useState<StocktakeFrequency>(
      localSettings.stocktakeFrequency
    );
  const [weekStartsOn, setWeekStartsOn] =
    useState<WeekStartDay>(
      localSettings.weekStartsOn
    );
  const [scheduleSaved, setScheduleSaved] =
    useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const session = await getCloudSession();

      if (
        !session.authenticated ||
        !session.business ||
        session.user?.role !== "operations"
      ) {
        throw new Error(
          "Operations permission required."
        );
      }

      const supabase = createClient();
      const businessId = session.business.id;

      const [
        businessResult,
        membershipsResult,
        sitesResult,
        staffResult,
      ] = await Promise.all([
        supabase
          .from("businesses")
          .select("id,name,code,created_at")
          .eq("id", businessId)
          .single(),
        supabase
          .from("business_memberships")
          .select("id,display_name,role,active")
          .eq("business_id", businessId)
          .eq("active", true)
          .order("display_name"),
        supabase
          .from("sites")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("business_id", businessId)
          .eq("active", true),
        supabase
          .from("staff_members")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("business_id", businessId)
          .eq("active", true),
      ]);

      if (businessResult.error) {
        throw businessResult.error;
      }

      if (membershipsResult.error) {
        throw membershipsResult.error;
      }

      const nextBusiness =
        businessResult.data as BusinessRow;

      setBusiness(nextBusiness);
      setBusinessName(nextBusiness.name);
      setOperationsUsers(
        (membershipsResult.data ?? []) as MembershipRow[]
      );
      setSiteCount(sitesResult.count ?? 0);
      setStaffCount(staffResult.count ?? 0);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Business settings could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveBusiness(): Promise<void> {
    if (!business || !businessName.trim()) {
      setError("Enter a business name.");
      return;
    }

    setSavingBusiness(true);
    setError("");
    setSuccess("");

    const supabase = createClient();
    const { error: updateError } =
      await supabase
        .from("businesses")
        .update({
          name: businessName.trim(),
        })
        .eq("id", business.id);

    if (updateError) {
      setError(updateError.message);
      setSavingBusiness(false);
      return;
    }

    setSuccess("Business details saved.");
    setSavingBusiness(false);
    await load();
  }

  async function copyBusinessCode(): Promise<void> {
    if (!business?.code) return;

    try {
      await navigator.clipboard.writeText(
        business.code
      );
      setCopied(true);
      window.setTimeout(
        () => setCopied(false),
        1800
      );
    } catch {
      setError(
        "The business code could not be copied."
      );
    }
  }

  function saveSchedule(): void {
    saveBusinessSettings({
      stocktakeFrequency: frequency,
      weekStartsOn,
    });

    setScheduleSaved(true);
    window.setTimeout(
      () => setScheduleSaved(false),
      1800
    );
  }

  if (loading) {
    return (
      <ProtectedPage>
        <main className="flex min-h-screen items-center justify-center bg-slate-100">
          <div className="flex items-center gap-3 font-semibold text-gray-600">
            <Loader2 className="animate-spin" size={20} />
            Loading Settings...
          </div>
        </main>
      </ProtectedPage>
    );
  }

  const usesWeekStart =
    frequency === "weekly" ||
    frequency === "every-4-weeks";

  return (
    <ProtectedPage>
      <main className="min-h-screen bg-slate-100 p-4 sm:p-8">
        <div className="mx-auto max-w-6xl">
          <p className="font-semibold text-violet-800">
            Operations
          </p>

          <h1 className="mt-1 text-4xl font-bold text-gray-950">
            Settings
          </h1>

          <p className="mt-2 text-gray-600">
            Manage this business and its KitchenOps configuration.
          </p>

          {error && (
            <p className="mt-6 rounded-2xl bg-red-50 p-4 font-semibold text-red-700">
              {error}
            </p>
          )}

          {success && (
            <p className="mt-6 rounded-2xl bg-violet-50 p-4 font-semibold text-violet-800">
              {success}
            </p>
          )}

          {business && (
            <>
              <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-800">
                    <Building2 size={24} />
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-gray-950">
                      Business
                    </h2>
                    <p className="mt-1 text-gray-600">
                      Details shared across every site.
                    </p>
                  </div>
                </div>

                <div className="mt-7 grid gap-5 lg:grid-cols-2">
                  <label>
                    <span className="text-sm font-semibold text-gray-700">
                      Business Name
                    </span>
                    <input
                      value={businessName}
                      onChange={(event) =>
                        setBusinessName(event.target.value)
                      }
                      className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-violet-800"
                    />
                  </label>

                  <div>
                    <span className="text-sm font-semibold text-gray-700">
                      Business Code
                    </span>
                    <div className="mt-2 flex gap-2">
                      <div className="flex min-h-12 flex-1 items-center rounded-xl bg-slate-100 px-4 font-mono text-lg font-bold tracking-wider text-gray-950">
                        {business.code}
                      </div>
                      <button
                        type="button"
                        onClick={copyBusinessCode}
                        className="inline-flex items-center gap-2 rounded-xl border border-violet-800 px-4 py-3 font-semibold text-violet-800 hover:bg-violet-50"
                      >
                        {copied ? <Check size={18} /> : <Copy size={18} />}
                        {copied ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      Managers and chefs use this code on shared devices.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={saveBusiness}
                  disabled={savingBusiness}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-800 px-5 py-3 font-semibold text-white hover:bg-violet-900 disabled:opacity-60"
                >
                  {savingBusiness ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Save size={18} />
                  )}
                  Save Business
                </button>

                <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl bg-slate-50 p-5">
                    <Store className="text-violet-800" size={21} />
                    <p className="mt-3 text-2xl font-bold">{siteCount}</p>
                    <p className="mt-1 text-sm text-gray-500">Active sites</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-5">
                    <UsersRound className="text-violet-800" size={21} />
                    <p className="mt-3 text-2xl font-bold">{staffCount}</p>
                    <p className="mt-1 text-sm text-gray-500">Active staff</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-5">
                    <ShieldCheck className="text-violet-800" size={21} />
                    <p className="mt-3 text-2xl font-bold">{operationsUsers.length}</p>
                    <p className="mt-1 text-sm text-gray-500">Operations users</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-5">
                    <CalendarClock className="text-violet-800" size={21} />
                    <p className="mt-3 font-bold">{formatDate(business.created_at)}</p>
                    <p className="mt-1 text-sm text-gray-500">Business created</p>
                  </div>
                </div>
              </section>

              <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm sm:p-8">
                <h2 className="text-2xl font-bold text-gray-950">
                  Operations Users
                </h2>
                <p className="mt-1 text-gray-600">
                  Email/password users with business-wide access.
                </p>

                <div className="mt-5 space-y-3">
                  {operationsUsers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded-2xl bg-slate-50 p-4"
                    >
                      <div>
                        <p className="font-bold text-gray-950">
                          {member.display_name}
                        </p>
                        <p className="mt-1 text-sm capitalize text-gray-500">
                          {member.role}
                        </p>
                      </div>
                      <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-800">
                        Active
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-800">
                    <CalendarClock size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-950">
                      Stocktake Schedule
                    </h2>
                    <p className="mt-1 text-gray-600">
                      Current legacy schedule used by stocktake pages while that module is migrated to cloud.
                    </p>
                  </div>
                </div>

                <div className="mt-7 grid gap-3 md:grid-cols-2">
                  {FREQUENCIES.map((option) => (
                    <label
                      key={option.value}
                      className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-5 transition ${
                        frequency === option.value
                          ? "border-violet-700 bg-violet-50"
                          : "border-gray-200 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="stocktake-frequency"
                        checked={frequency === option.value}
                        onChange={() => setFrequency(option.value)}
                        className="mt-1 h-5 w-5 accent-violet-800"
                      />
                      <div>
                        <p className="font-bold text-gray-950">{option.label}</p>
                        <p className="mt-1 text-sm text-gray-600">{option.description}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {usesWeekStart && (
                  <label className="mt-6 block max-w-sm">
                    <span className="text-sm font-semibold text-gray-700">
                      Week Starts On
                    </span>
                    <select
                      value={weekStartsOn}
                      onChange={(event) =>
                        setWeekStartsOn(event.target.value as WeekStartDay)
                      }
                      className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3"
                    >
                      {WEEK_DAYS.map((day) => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                  </label>
                )}

                <button
                  type="button"
                  onClick={saveSchedule}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl border border-violet-800 px-5 py-3 font-semibold text-violet-800 hover:bg-violet-50"
                >
                  {scheduleSaved ? <Check size={18} /> : <Save size={18} />}
                  {scheduleSaved ? "Saved" : "Save Schedule"}
                </button>
              </section>
            </>
          )}
        </div>
      </main>
    </ProtectedPage>
  );
}
