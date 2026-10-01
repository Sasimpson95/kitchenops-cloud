"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Building2,
  Check,
  ChevronLeft,
  Loader2,
  MapPin,
  Sparkles,
  Store,
} from "lucide-react";

import ProtectedPage from "@/components/ProtectedPage";
import SupplierModal from "@/components/suppliers/SupplierModal";
import ProductImportWizard from "@/components/products/ProductImportWizard";
import { getCurrentUser } from "@/lib/currentUser";
import { getCloudSession } from "@/lib/cloudSession";
import { createClient } from "@/lib/supabase/client";
import { getSuppliers } from "@/lib/supplierStore";
import { getProducts } from "@/lib/productStore";
import {
  createStorageArea,
  getStorageAreasForSite,
} from "@/lib/storageAreaStore";
import { useBusinessSites } from "@/lib/useBusinessSites";

type WizardStep =
  | "welcome"
  | "site"
  | "supplier"
  | "products"
  | "storage"
  | "team"
  | "ready";

type SetupTeamMember = {
  id: string;
  name: string;
  role: "manager" | "foh_manager" | "chef";
  site_id: string;
  active: boolean;
};

export default function GettingStartedPage() {
  const router = useRouter();
  const { sites, loading: sitesLoading, refresh: refreshSites } = useBusinessSites();

  const [businessId, setBusinessId] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [step, setStep] = useState<WizardStep>("welcome");

  const [siteName, setSiteName] = useState("");
  const [frequency, setFrequency] = useState("weekly");
  const [savingSite, setSavingSite] = useState(false);

  const [showSupplier, setShowSupplier] = useState(false);

  const [storageName, setStorageName] = useState("");
  const [storageRefresh, setStorageRefresh] = useState(0);

  const [teamMembers, setTeamMembers] =
    useState<SetupTeamMember[]>([]);

  const [teamName, setTeamName] =
    useState("");

  const [teamRole, setTeamRole] =
    useState<"manager" | "foh_manager" | "chef">("chef");

  const [teamSiteId, setTeamSiteId] =
    useState("");

  const [teamPin, setTeamPin] =
    useState("");

  const [savingTeam, setSavingTeam] =
    useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (sitesLoading) return;

    setLoading(true);
    setError("");

    try {
      const user = getCurrentUser();

      if (!user || user.role !== "operations") {
        throw new Error(
          "Operations access is required to set up KitchenOps."
        );
      }

      const session = await getCloudSession();

      if (!session.authenticated || !session.business) {
        throw new Error(
          "Your KitchenOps business could not be loaded."
        );
      }

      setBusinessId(session.business.id);
      setBusinessName(session.business.name);

      const activeSites = sites.filter(
        (site) => site.active !== false
      );

      const activeSuppliers = getSuppliers().filter(
        (supplier) => supplier.active
      );

      if (activeSites.length === 0) {
        setStep("welcome");
      } else if (activeSuppliers.length === 0) {
        setStep("supplier");
      } else {
        setStep("products");
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "KitchenOps setup could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }, [sites, sitesLoading]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createSite(): Promise<void> {
    if (savingSite) return;

    if (!siteName.trim()) {
      setError("Enter a name for your first site.");
      return;
    }

    if (!businessId) {
      setError("Your business could not be loaded.");
      return;
    }

    setSavingSite(true);
    setError("");

    try {
      const supabase = createClient();

      const { error: rpcError } = await supabase.rpc(
        "create_kitchenops_site",
        {
          requested_business_id: businessId,
          site_name: siteName.trim(),
          frequency,
        }
      );

      if (rpcError) {
        throw rpcError;
      }

      // Refresh the shared site list before opening the next step.
      // Supplier and Storage Area setup both depend on this list.
      await refreshSites();

      setStep("supplier");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Your site could not be created."
      );
    } finally {
      setSavingSite(false);
    }
  }

  async function loadTeamMembers(): Promise<void> {
    if (!businessId) return;

    const supabase = createClient();

    const { data, error: staffError } =
      await supabase
        .from("staff_members")
        .select("id,name,role,site_id,active")
        .eq("business_id", businessId)
        .eq("active", true)
        .order("name");

    if (staffError) {
      setError(staffError.message);
      return;
    }

    setTeamMembers(
      (data ?? []) as SetupTeamMember[]
    );
  }

  async function createTeamMember(): Promise<void> {
    if (savingTeam) return;

    const selectedSiteId =
      teamSiteId ||
      sites.find(
        (site) => site.active !== false
      )?.id ||
      "";

    if (!teamName.trim()) {
      setError("Enter the team member's name.");
      return;
    }

    if (!selectedSiteId) {
      setError("Choose a site.");
      return;
    }

    if (!/^\d{4}$/.test(teamPin)) {
      setError("Enter a four-digit temporary PIN.");
      return;
    }

    if (!businessId) {
      setError("Your business could not be loaded.");
      return;
    }

    setSavingTeam(true);
    setError("");

    try {
      const supabase = createClient();

      const { error: rpcError } =
        await supabase.rpc(
          "create_staff_member",
          {
            requested_business_id: businessId,
            requested_site_id: selectedSiteId,
            staff_name: teamName.trim(),
            staff_role: teamRole,
            temporary_pin: teamPin,
          }
        );

      if (rpcError) {
        throw rpcError;
      }

      setTeamName("");
      setTeamPin("");

      await loadTeamMembers();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The team member could not be created."
      );
    } finally {
      setSavingTeam(false);
    }
  }

  if (loading || sitesLoading) {
    return (
      <ProtectedPage>
        <main className="flex min-h-screen items-center justify-center bg-slate-100">
          <div className="flex items-center gap-3 font-semibold text-gray-600">
            <Loader2
              className="animate-spin"
              size={20}
            />
            Preparing your KitchenOps setup...
          </div>
        </main>
      </ProtectedPage>
    );
  }

  const stepNumber =
    step === "welcome"
      ? 1
      : step === "site"
        ? 2
        : step === "supplier"
          ? 3
          : step === "products"
            ? 4
            : step === "storage"
              ? 5
              : step === "team"
                ? 6
                : 7;

  const activeSite =
    sites.find(
      (site) => site.active !== false
    ) ?? null;

  const storageAreas =
    activeSite
      ? getStorageAreasForSite(
          activeSite.id
        )
      : [];

  const activeSuppliers =
    getSuppliers().filter(
      (supplier) => supplier.active
    );

  const activeProducts =
    getProducts().filter(
      (product) => product.active
    );

  void storageRefresh;

  function addStorageArea(
    suggestedName?: string
  ): void {
    if (!activeSite) {
      setError(
        "Your site could not be loaded."
      );
      return;
    }

    const name =
      (suggestedName ?? storageName).trim();

    if (!name) {
      setError(
        "Enter a storage area name."
      );
      return;
    }

    try {
      createStorageArea({
        siteId: activeSite.id,
        siteName: activeSite.name,
        name,
      });

      setStorageName("");
      setStorageRefresh(
        (current) => current + 1
      );
      setError("");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The storage area could not be created."
      );
    }
  }

  return (
    <ProtectedPage>
      <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 sm:py-12">
        <div className="mx-auto w-full max-w-4xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-violet-800">
                KitchenOps setup
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Step {stepNumber} of 7
              </p>
            </div>

            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7].map(
                (number) => (
                  <span
                    key={number}
                    className={`h-2 rounded-full transition-all ${
                      number <= stepNumber
                        ? "w-8 bg-violet-800"
                        : "w-2 bg-slate-300"
                    }`}
                  />
                )
              )}
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl bg-red-50 p-4 font-semibold text-red-700">
              {error}
            </div>
          )}

          {step === "welcome" && (
            <section className="overflow-hidden rounded-[2rem] bg-white shadow-sm">
              <div className="bg-violet-950 p-8 text-white sm:p-10">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                  <Sparkles size={27} />
                </span>

                <p className="mt-7 text-sm font-bold uppercase tracking-[0.18em] text-violet-300">
                  Welcome to KitchenOps
                </p>

                <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                  Let's get {businessName || "your business"} ready.
                </h1>

                <p className="mt-4 max-w-2xl text-base leading-7 text-violet-200">
                  We'll guide you through the important setup in
                  the right order. You won't need to hunt around
                  KitchenOps trying to work out what to configure
                  first.
                </p>
              </div>

              <div className="p-8 sm:p-10">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 p-5">
                    <MapPin
                      className="text-violet-800"
                      size={22}
                    />
                    <p className="mt-3 font-bold text-gray-950">
                      Your sites
                    </p>
                    <p className="mt-1 text-sm leading-6 text-gray-600">
                      Tell KitchenOps where your business operates.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-5">
                    <Store
                      className="text-violet-800"
                      size={22}
                    />
                    <p className="mt-3 font-bold text-gray-950">
                      Your suppliers
                    </p>
                    <p className="mt-1 text-sm leading-6 text-gray-600">
                      Connect the businesses you purchase from.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-5">
                    <Building2
                      className="text-violet-800"
                      size={22}
                    />
                    <p className="mt-3 font-bold text-gray-950">
                      Your information
                    </p>
                    <p className="mt-1 text-sm leading-6 text-gray-600">
                      We'll help bring your existing product data across.
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setStep("site")}
                    className="inline-flex items-center gap-2 rounded-xl bg-violet-800 px-6 py-3 font-semibold text-white hover:bg-violet-900"
                  >
                    Start setup
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            </section>
          )}

          {step === "site" && (
            <section className="rounded-[2rem] bg-white p-7 shadow-sm sm:p-10">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-800">
                <MapPin size={27} />
              </span>

              <p className="mt-7 text-sm font-bold uppercase tracking-[0.18em] text-violet-700">
                Step 2 - Your first site
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-950">
                Where does your business operate?
              </h1>

              <p className="mt-3 max-w-2xl leading-7 text-gray-600">
                A site is one of your trading locations. Stock,
                prep, handovers, storage areas and team members
                will all be connected to a site.
              </p>

              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                <label>
                  <span className="text-sm font-semibold text-gray-700">
                    Site name
                  </span>

                  <input
                    value={siteName}
                    onChange={(event) => {
                      setSiteName(event.target.value);
                      setError("");
                    }}
                    placeholder="Example: Nottingham City"
                    className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-violet-800"
                    autoFocus
                  />
                </label>

                <label>
                  <span className="text-sm font-semibold text-gray-700">
                    How often do you normally stocktake?
                  </span>

                  <select
                    value={frequency}
                    onChange={(event) =>
                      setFrequency(event.target.value)
                    }
                    className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-violet-800"
                  >
                    <option value="weekly">
                      Weekly
                    </option>
                    <option value="fortnightly">
                      Fortnightly
                    </option>
                    <option value="monthly">
                      Monthly
                    </option>
                  </select>
                </label>
              </div>

              <div className="mt-8 flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={() => setStep("welcome")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-slate-50"
                >
                  <ChevronLeft size={18} />
                  Back
                </button>

                <button
                  type="button"
                  onClick={createSite}
                  disabled={savingSite}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-800 px-6 py-3 font-semibold text-white hover:bg-violet-900 disabled:opacity-60"
                >
                  {savingSite ? (
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                  ) : (
                    <Check size={18} />
                  )}

                  {savingSite
                    ? "Creating site..."
                    : "Create site & continue"}
                </button>
              </div>
            </section>
          )}

          {step === "supplier" && (
            <section className="rounded-[2rem] bg-white p-7 shadow-sm sm:p-10">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-800">
                <Store size={27} />
              </span>

              <p className="mt-7 text-sm font-bold uppercase tracking-[0.18em] text-violet-700">
                Step 3 - Suppliers
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-950">
                Who do you order from?
              </h1>

              <p className="mt-3 max-w-2xl leading-7 text-gray-600">
                Suppliers connect your products to purchasing,
                  deliveries and costs. Start with one of your main
                  suppliers - you can add the rest later.
              </p>

              <div className="mt-8 rounded-2xl border border-violet-200 bg-violet-50 p-6">
                <p className="font-bold text-violet-950">
                  Add your first supplier
                </p>

                <p className="mt-2 text-sm leading-6 text-violet-800">
                  This could be a wholesaler such as Brakes, a local
                  supplier, or another KitchenOps site that supplies
                  your location.
                </p>

                <button
                  type="button"
                  onClick={() => setShowSupplier(true)}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-800 px-6 py-3 font-semibold text-white hover:bg-violet-900"
                >
                  <Store size={18} />
                  Add supplier
                </button>
              </div>

              <div className="mt-8 flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={() => setStep("site")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-slate-50"
                >
                  <ChevronLeft size={18} />
                  Back
                </button>

                <button
                  type="button"
                  onClick={() => setStep("storage")}
                  className="px-5 py-3 text-sm font-semibold text-gray-500 hover:text-gray-900"
                >
                  Skip supplier and products for now
                </button>
              </div>
            </section>
          )}
          {step === "products" && (
            <section className="rounded-[2rem] bg-white p-7 shadow-sm sm:p-10">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-violet-700">
                Step 4 - Products
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-950">
                Bring in your products.
              </h1>

              <p className="mt-3 max-w-2xl leading-7 text-gray-600">
                Upload your existing catalogue and KitchenOps will help map,
                check and import the information safely.
              </p>

              <div className="mt-8">
                <ProductImportWizard
                  onImported={() => undefined}
                  onCancel={() => setStep("storage")}
                  onBack={() => setStep("supplier")}
                />
              </div>


            </section>
          )}
          {step === "storage" && (
            <section className="rounded-[2rem] bg-white p-7 shadow-sm sm:p-10">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-violet-700">
                Step 5 - Storage Areas
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-950">
                Where do you keep your stock?
              </h1>

              <p className="mt-3 max-w-2xl leading-7 text-gray-600">
                Storage areas help your team know where products belong and
                make stocktakes easier to organise.
              </p>

              {activeSite && (
                <div className="mt-6 rounded-2xl bg-violet-50 p-5">
                  <p className="text-sm font-semibold text-violet-700">
                    Setting up storage for
                  </p>

                  <p className="mt-1 text-lg font-bold text-violet-950">
                    {activeSite.name}
                  </p>
                </div>
              )}

              <div className="mt-8">
                <p className="font-bold text-gray-950">
                  Quick add
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Add any that match your site. You can rename or add more later.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    "Fridge",
                    "Freezer",
                    "Dry Store",
                    "Bar",
                    "Cleaning Cupboard",
                  ].map((name) => {
                    const alreadyExists =
                      storageAreas.some(
                        (area) =>
                          area.name.toLowerCase() ===
                          name.toLowerCase()
                      );

                    return (
                      <button
                        key={name}
                        type="button"
                        disabled={alreadyExists}
                        onClick={() =>
                          addStorageArea(name)
                        }
                        className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-violet-400 hover:bg-violet-50 disabled:cursor-default disabled:border-emerald-200 disabled:bg-emerald-50 disabled:text-emerald-700"
                      >
                        {alreadyExists
                          ? `Added: ${name}`
                          : `+ ${name}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-8 rounded-2xl border border-gray-200 p-5">
                <p className="font-bold text-gray-950">
                  Add your own
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Use the name your team already uses, such as Walk-in Fridge,
                  Upstairs Store or Front Counter.
                </p>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <input
                    value={storageName}
                    onChange={(event) => {
                      setStorageName(
                        event.target.value
                      );
                      setError("");
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addStorageArea();
                      }
                    }}
                    placeholder="Example: Walk-in Fridge"
                    className="min-w-0 flex-1 rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-violet-800"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      addStorageArea()
                    }
                    className="rounded-xl bg-violet-800 px-5 py-3 font-semibold text-white hover:bg-violet-900"
                  >
                    Add storage area
                  </button>
                </div>
              </div>

              {storageAreas.length > 0 && (
                <div className="mt-8">
                  <p className="font-bold text-gray-950">
                    Your storage areas
                  </p>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {storageAreas.map(
                      (area) => (
                        <div
                          key={area.id}
                          className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4"
                        >
                          <Check
                            size={18}
                            className="shrink-0 text-emerald-700"
                          />

                          <span className="font-semibold text-emerald-950">
                            {area.name}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              <div className="mt-8 flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={() =>
                    setStep("products")
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-slate-50"
                >
                  <ChevronLeft size={18} />
                  Back
                </button>

                <button
                  type="button"
                  disabled={
                    storageAreas.length === 0
                  }
                  onClick={() => {
                    setTeamSiteId(
                      activeSite?.id ?? ""
                    );
                    setStep("team");
                    void loadTeamMembers();
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-800 px-6 py-3 font-semibold text-white hover:bg-violet-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Continue setup
                  <ArrowRight size={18} />
                </button>
              </div>
            </section>
          )}
          {step === "team" && (
            <section className="rounded-[2rem] bg-white p-7 shadow-sm sm:p-10">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-violet-700">
                Step 6 - Team
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-950">
                Add your team.
              </h1>

              <p className="mt-3 max-w-2xl leading-7 text-gray-600">
                Create the PIN accounts your managers, FOH managers and chefs
                will use on shared KitchenOps devices.
              </p>

              <div className="mt-8 rounded-2xl border border-gray-200 p-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <label>
                    <span className="font-bold text-gray-950">
                      Name
                    </span>

                    <p className="mt-1 text-sm text-gray-500">
                      The team member's real name so actions can be attributed correctly.
                    </p>

                    <input
                      value={teamName}
                      onChange={(event) => {
                        setTeamName(
                          event.target.value
                        );
                        setError("");
                      }}
                      placeholder="Example: Alex"
                      className="mt-3 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-violet-800"
                    />
                  </label>

                  <label>
                    <span className="font-bold text-gray-950">
                      Role
                    </span>

                    <p className="mt-1 text-sm text-gray-500">
                      Controls what this person can access.
                    </p>

                    <select
                      value={teamRole}
                      onChange={(event) =>
                        setTeamRole(
                          event.target.value as
                            | "manager"
                            | "foh_manager"
                            | "chef"
                        )
                      }
                      className="mt-3 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-violet-800"
                    >
                      <option value="manager">
                        BOH Manager
                      </option>

                      <option value="foh_manager">
                        FOH Manager
                      </option>

                      <option value="chef">
                        Chef
                      </option>
                    </select>
                  </label>

                  <label>
                    <span className="font-bold text-gray-950">
                      Site
                    </span>

                    <p className="mt-1 text-sm text-gray-500">
                      The site this team member belongs to.
                    </p>

                    <select
                      value={
                        teamSiteId ||
                        activeSite?.id ||
                        ""
                      }
                      onChange={(event) =>
                        setTeamSiteId(
                          event.target.value
                        )
                      }
                      className="mt-3 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-violet-800"
                    >
                      {sites
                        .filter(
                          (site) =>
                            site.active !== false
                        )
                        .map((site) => (
                          <option
                            key={site.id}
                            value={site.id}
                          >
                            {site.name}
                          </option>
                        ))}
                    </select>
                  </label>

                  <label>
                    <span className="font-bold text-gray-950">
                      Temporary PIN
                    </span>

                    <p className="mt-1 text-sm text-gray-500">
                      Give them a temporary four-digit PIN. They will choose
                      their own PIN when they first sign in.
                    </p>

                    <input
                      value={teamPin}
                      onChange={(event) =>
                        setTeamPin(
                          event.target.value
                            .replace(/\D/g, "")
                            .slice(0, 4)
                        )
                      }
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="0000"
                      className="mt-3 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-violet-800"
                    />
                  </label>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      void createTeamMember()
                    }
                    disabled={savingTeam}
                    className="inline-flex items-center gap-2 rounded-xl bg-violet-800 px-6 py-3 font-semibold text-white hover:bg-violet-900 disabled:opacity-50"
                  >
                    {savingTeam && (
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />
                    )}

                    {savingTeam
                      ? "Adding team member..."
                      : "Add team member"}
                  </button>
                </div>
              </div>

              {teamMembers.length > 0 && (
                <div className="mt-8">
                  <p className="font-bold text-gray-950">
                    Your team
                  </p>

                  <div className="mt-3 space-y-3">
                    {teamMembers.map(
                      (member) => {
                        const site =
                          sites.find(
                            (item) =>
                              item.id ===
                              member.site_id
                          );

                        const roleLabel =
                          member.role === "manager"
                            ? "BOH Manager"
                            : member.role ===
                                "foh_manager"
                              ? "FOH Manager"
                              : "Chef";

                        return (
                          <div
                            key={member.id}
                            className="flex flex-col justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center"
                          >
                            <div>
                              <p className="font-bold text-emerald-950">
                                {member.name}
                              </p>

                              <p className="mt-1 text-sm text-emerald-800">
                                {roleLabel}
                                {site
                                  ? ` - ${site.name}`
                                  : ""}
                              </p>
                            </div>

                            <span className="text-sm font-semibold text-emerald-700">
                              Added
                            </span>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              )}

              <div className="mt-8 flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={() =>
                    setStep("storage")
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-slate-50"
                >
                  <ChevronLeft size={18} />
                  Back
                </button>

                <button
                  type="button"
                  disabled={
                    teamMembers.length === 0
                  }
                  onClick={() =>
                    setStep("ready")
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-800 px-6 py-3 font-semibold text-white hover:bg-violet-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Continue setup
                  <ArrowRight size={18} />
                </button>
              </div>
            </section>
          )}
          {step === "ready" && (
            <section className="overflow-hidden rounded-[2rem] bg-white shadow-sm">
              <div className="bg-violet-950 p-8 text-white sm:p-10">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
                  <Check size={31} />
                </span>

                <p className="mt-7 text-sm font-bold uppercase tracking-[0.18em] text-violet-300">
                  Step 7 - Ready
                </p>

                <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                  KitchenOps is ready to use.
                </h1>

                <p className="mt-3 max-w-2xl leading-7 text-violet-100">
                  You have completed the core setup. Your team can now start
                  using KitchenOps, and you can continue adding more products,
                  suppliers, sites and team members whenever you need them.
                </p>
              </div>

              <div className="p-7 sm:p-10">
                <p className="font-bold text-gray-950">
                  Your setup
                </p>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-gray-200 p-5">
                    <p className="text-sm text-gray-500">
                      Business
                    </p>

                    <p className="mt-1 text-lg font-bold text-gray-950">
                      {businessName}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-gray-200 p-5">
                    <p className="text-sm text-gray-500">
                      First site
                    </p>

                    <p className="mt-1 text-lg font-bold text-gray-950">
                      {activeSite?.name ?? "Not set"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-gray-200 p-5">
                    <p className="text-sm text-gray-500">
                      Suppliers
                    </p>

                    <p className="mt-1 text-2xl font-bold text-gray-950">
                      {activeSuppliers.length}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-gray-200 p-5">
                    <p className="text-sm text-gray-500">
                      Products
                    </p>

                    <p className="mt-1 text-2xl font-bold text-gray-950">
                      {activeProducts.length}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-gray-200 p-5">
                    <p className="text-sm text-gray-500">
                      Storage areas
                    </p>

                    <p className="mt-1 text-2xl font-bold text-gray-950">
                      {storageAreas.length}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-gray-200 p-5">
                    <p className="text-sm text-gray-500">
                      Team members
                    </p>

                    <p className="mt-1 text-2xl font-bold text-gray-950">
                      {teamMembers.length}
                    </p>
                  </div>
                </div>

                <div className="mt-8 rounded-2xl bg-violet-50 p-5">
                  <p className="font-bold text-violet-950">
                    You can change any of this later
                  </p>

                  <p className="mt-2 text-sm leading-6 text-violet-800">
                    Nothing here is locked in. KitchenOps settings let you add
                    more sites, suppliers, products, storage areas and team
                    members as your business changes.
                  </p>
                </div>

                <div className="mt-8 flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-between">
                  <button
                    type="button"
                    onClick={() =>
                      setStep("team")
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-slate-50"
                  >
                    <ChevronLeft size={18} />
                    Back
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      router.push("/home")
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-800 px-7 py-3 font-semibold text-white hover:bg-violet-900"
                  >
                    Open KitchenOps
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            </section>
          )}
          {showSupplier && (
            <SupplierModal
              onClose={() => setShowSupplier(false)}
              onSaved={() => {
                setShowSupplier(false);
                setStep("products");
              }}
            />
          )}
        </div>
      </main>
    </ProtectedPage>
  );
}