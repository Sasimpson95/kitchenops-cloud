"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  Building2,
  CalendarDays,
  CheckCircle2,
  History,
  Minus,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import ProtectedPage from "@/components/ProtectedPage";
import RecipeModal from "@/components/recipes/RecipeModal";

import type { User } from "@/config/roles";

import { getCurrentUser } from "@/lib/currentUser";
import { useBusinessSites } from "@/lib/useBusinessSites";

import {
  type Recipe,
  getRecipes,
  subscribeToRecipeChanges,
} from "@/data/recipes";

import type {
  ProductionDay,
  ProductionItem,
} from "@/data/production";

import {
  addPrepItem,
  getPrepHistory,
  getPrepItems,
  removePrepItem,
  subscribeToPrepChanges,
  updatePrepQuantity,
  type PrepHistoryRecord,
} from "@/lib/prepStore";



function getRecipeTime(
  recipe: Recipe
): string {
  return (
    recipe.prepTime.trim() ||
    "Time not set"
  );
}

export default function PrepPlannerPage() {
  const router = useRouter();
  const {
    options: SITES,
    siteNames: businessSiteNames,
    loading: sitesLoading,
  } = useBusinessSites();

  const [
    currentUser,
    setCurrentUser,
  ] = useState<User | null>(null);

  const [loadingUser, setLoadingUser] =
    useState(true);

  const [items, setItems] =
    useState<ProductionItem[]>([]);

  const [recipeList, setRecipeList] =
    useState<Recipe[]>([]);

  const [history, setHistory] =
    useState<PrepHistoryRecord[]>([]);

  const [
    selectedSite,
    setSelectedSite,
  ] = useState("All Sites");

  const [search, setSearch] =
    useState("");

  const [
    addRecipeSearch,
    setAddRecipeSearch,
  ] = useState("");

  const [selectedDay, setSelectedDay] =
    useState<ProductionDay>("today");

  const [adding, setAdding] =
    useState(false);

  const [
    selectedRecipe,
    setSelectedRecipe,
  ] = useState<Recipe | null>(null);

  const [quantity, setQuantity] =
    useState(1);

  const [
    selectedRecipeCard,
    setSelectedRecipeCard,
  ] = useState<Recipe | null>(null);

  const [
    selectedRecipeBatches,
    setSelectedRecipeBatches,
  ] = useState(1);

  const [
    editingItem,
    setEditingItem,
  ] = useState<ProductionItem | null>(
    null
  );

  const [
    editingQuantity,
    setEditingQuantity,
  ] = useState(1);

  const [error, setError] =
    useState("");

  const refreshPrep =
    useCallback(() => {
      setItems(getPrepItems());
      setHistory(getPrepHistory());
    }, []);

  const refreshRecipes =
    useCallback(() => {
      setRecipeList(getRecipes());
    }, []);

  useEffect(() => {
    const user = getCurrentUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    setCurrentUser(user);

    if (user.role === "operations") {
      setSelectedSite("All Sites");
    }

    if (user.role === "manager") {
      setSelectedDay("tomorrow");
    }

    setLoadingUser(false);
  }, [router]);

  useEffect(() => {
    if (!currentUser || sitesLoading) return;

    if (currentUser.role === "operations") {
      if (selectedSite !== "All Sites" && !businessSiteNames.includes(selectedSite)) {
        setSelectedSite("All Sites");
      }
      return;
    }

    const assignedSite = currentUser.site?.trim();
    const nextSite =
      assignedSite && businessSiteNames.includes(assignedSite)
        ? assignedSite
        : businessSiteNames[0] ?? "";

    setSelectedSite(nextSite);
  }, [currentUser, sitesLoading, businessSiteNames, selectedSite]);

  useEffect(() => {
    refreshPrep();
    refreshRecipes();

    const unsubscribePrep =
      subscribeToPrepChanges(
        refreshPrep
      );

    const unsubscribeRecipes =
      subscribeToRecipeChanges(
        refreshRecipes
      );

    return () => {
      unsubscribePrep();
      unsubscribeRecipes();
    };
  }, [
    refreshPrep,
    refreshRecipes,
  ]);

  const isOperations =
    currentUser?.role === "operations";

  const isManager =
    currentUser?.role === "manager";

  const hasSelectedSpecificSite =
    selectedSite !== "All Sites";

  const canEdit =
    Boolean(currentUser) &&
    hasSelectedSpecificSite &&
    (isManager || isOperations);

  const selectedDayItems =
    useMemo(() => {
      if (
        selectedSite === "All Sites"
      ) {
        return [];
      }

      const normalisedSearch = search
        .trim()
        .toLowerCase();

      return items
        .filter(
          (item) =>
            item.site === selectedSite &&
            item.day === selectedDay
        )
        .filter(
          (item) =>
            !normalisedSearch ||
            item.name
              .toLowerCase()
              .includes(
                normalisedSearch
              )
        )
        .sort(
          (firstItem, secondItem) =>
            firstItem.name.localeCompare(
              secondItem.name
            )
        );
    }, [
      items,
      search,
      selectedDay,
      selectedSite,
    ]);

  const filteredAvailableRecipes =
    useMemo(() => {
      const normalisedSearch =
        addRecipeSearch
          .trim()
          .toLowerCase();

      return recipeList
        .filter(
          (recipe) =>
            !normalisedSearch ||
            recipe.name
              .toLowerCase()
              .includes(
                normalisedSearch
              )
        )
        .sort(
          (firstRecipe, secondRecipe) =>
            firstRecipe.name.localeCompare(
              secondRecipe.name
            )
        );
    }, [
      recipeList,
      addRecipeSearch,
    ]);

  const selectedSiteItems = useMemo(() => {
    if (
      selectedSite === "All Sites"
    ) {
      return [];
    }

    return items.filter(
      (item) =>
        item.site === selectedSite
    );
  }, [items, selectedSite]);

  const selectedSiteHistory = useMemo(() => {
    if (!hasSelectedSpecificSite) return [];
    return history
      .filter((record) => record.site === selectedSite)
      .slice(0, 20);
  }, [history, hasSelectedSpecificSite, selectedSite]);

  const todayItems =
    selectedSiteItems.filter(
      (item) =>
        item.day === "today"
    );

  const tomorrowItems =
    selectedSiteItems.filter(
      (item) =>
        item.day === "tomorrow"
    );

  const approvedTodayCount =
    todayItems.filter(
      (item) =>
        item.status === "approved"
    ).length;

  const siteSummaries = useMemo(() => {
    return SITES.filter(
      (site) => site !== "All Sites"
    ).map((site) => {
      const siteItems = items.filter(
        (item) => item.site === site
      );

      const today = siteItems.filter(
        (item) =>
          item.day === "today"
      );

      const tomorrow = siteItems.filter(
        (item) =>
          item.day === "tomorrow"
      );

      const awaitingApproval =
        today.filter(
          (item) =>
            item.status ===
            "awaitingApproval"
        );

      const approved =
        today.filter(
          (item) =>
            item.status === "approved"
        );

      return {
        site,
        todayCount: today.length,
        tomorrowCount:
          tomorrow.length,
        awaitingApprovalCount:
          awaitingApproval.length,
        approvedCount:
          approved.length,
      };
    });
  }, [items]);

  function changeSite(
    site: string
  ): void {
    if (!isOperations) {
      return;
    }

    closeAddPrep();
    closeEditQuantity();

    setSelectedSite(site);
    setSearch("");
    setError("");
  }

  function openAddPrep(): void {
    if (!canEdit) {
      setError(
        "Select a specific site before adding prep."
      );

      return;
    }

    const firstRecipe =
      recipeList[0] ?? null;

    setSelectedRecipe(firstRecipe);
    setQuantity(1);
    setAddRecipeSearch("");
    setError("");
    setAdding(true);
  }

  function closeAddPrep(): void {
    setAdding(false);
    setSelectedRecipe(null);
    setQuantity(1);
    setAddRecipeSearch("");
    setError("");
  }

  function addPrep(): void {
    if (!canEdit) {
      setError(
        "Select a specific site before adding prep."
      );

      return;
    }

    if (!selectedRecipe) {
      setError("Choose a recipe.");
      return;
    }

    try {
      addPrepItem({
        site: selectedSite,

        name: selectedRecipe.name,
        emoji:
          selectedRecipe.emoji,

        planned: quantity,
        day: selectedDay,
      });

      closeAddPrep();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Prep could not be added."
      );
    }
  }

  function openRecipe(
    item: ProductionItem
  ): void {
    const recipe =
      recipeList.find(
        (currentRecipe) =>
          currentRecipe.name
            .trim()
            .toLowerCase() ===
          item.name
            .trim()
            .toLowerCase()
      );

    if (!recipe) {
      window.alert(
        "The matching recipe could not be found."
      );

      return;
    }

    setSelectedRecipeCard(recipe);

    setSelectedRecipeBatches(
      item.status ===
        "awaitingApproval"
        ? Math.max(
            1,
            item.produced
          )
        : Math.max(
            1,
            item.planned
          )
    );
  }

  function openEditQuantity(
    item: ProductionItem
  ): void {
    if (!canEdit) {
      return;
    }

    if (
      item.site !== selectedSite ||
      item.status !== "planned"
    ) {
      return;
    }

    setEditingItem(item);
    setEditingQuantity(
      item.planned
    );

    setError("");
  }

  function closeEditQuantity(): void {
    setEditingItem(null);
    setEditingQuantity(1);
    setError("");
  }

  function saveEditedQuantity(): void {
    if (!editingItem) {
      return;
    }

    if (!canEdit) {
      setError(
        "Select a specific site before editing prep."
      );

      return;
    }

    if (
      editingItem.site !==
      selectedSite
    ) {
      setError(
        "This prep item belongs to another site."
      );

      return;
    }

    try {
      updatePrepQuantity({
        id: editingItem.id,
        planned: editingQuantity,
      });

      closeEditQuantity();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Prep quantity could not be changed."
      );
    }
  }

  function handleRemovePrep(
    item: ProductionItem
  ): void {
    if (!canEdit) {
      return;
    }

    if (
      item.site !== selectedSite
    ) {
      window.alert(
        "This prep item belongs to another site."
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Remove ${item.name} from ${selectedSite}'s ${item.day} prep?`
      );

    if (!confirmed) {
      return;
    }

    try {
      removePrepItem(item.id);
    } catch (caughtError) {
      window.alert(
        caughtError instanceof Error
          ? caughtError.message
          : "Prep could not be removed."
      );
    }
  }

  if (loadingUser || sitesLoading) {
    return (
      <ProtectedPage>
        <main className="flex min-h-screen items-center justify-center bg-slate-100">
          <p className="font-semibold text-gray-600">
            Loading Prep Planner...
          </p>
        </main>
      </ProtectedPage>
    );
  }

  if (businessSiteNames.length === 0) {
    return (
      <ProtectedPage>
        <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
          <div className="w-full max-w-lg rounded-3xl bg-white p-10 text-center shadow-sm">
            <Building2 className="mx-auto text-violet-800" size={44} />
            <h1 className="mt-5 text-2xl font-bold text-gray-950">No Sites Yet</h1>
            <p className="mt-3 text-gray-600">
              Prep plans belong to a site. Create your first site before planning production.
            </p>
            <button
              type="button"
              onClick={() => router.push("/settings/sites")}
              className="mt-7 rounded-xl bg-violet-800 px-6 py-3 font-semibold text-white hover:bg-violet-900"
            >
              Create First Site
            </button>
          </div>
        </main>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage>
      <main className="min-h-screen bg-slate-100 p-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <h1 className="text-4xl font-bold text-gray-950">
                Prep Planner
              </h1>

              <p className="mt-2 text-gray-600">
                Plan tomorrow, track today&apos;s production, and keep a clear prep history using the live Recipe Library.
              </p>
            </div>

            <button
              type="button"
              onClick={openAddPrep}
              disabled={!canEdit}
              className="rounded-xl bg-violet-800 px-6 py-3 font-semibold text-white transition hover:bg-violet-900 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600"
            >
              + Add Prep
            </button>
          </div>

          <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <label className="text-sm font-semibold text-gray-600">
                  Viewing Site
                </label>

                {isOperations ? (
                  <select
                    value={selectedSite}
                    onChange={(event) =>
                      changeSite(
                        event.target.value
                      )
                    }
                    className="mt-2 block w-full min-w-64 rounded-xl border border-gray-300 bg-white px-4 py-3 font-semibold text-gray-900 outline-none focus:border-violet-800"
                  >
                    {SITES.map((site) => (
                      <option
                        key={site}
                        value={site}
                      >
                        {site}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="mt-2 flex min-w-64 items-center gap-3 rounded-xl border border-gray-200 bg-slate-50 px-4 py-3">
                    <Building2
                      size={20}
                      className="text-violet-800"
                    />

                    <span className="font-semibold text-gray-900">
                      {selectedSite}
                    </span>

                    <span className="ml-auto text-xs font-semibold text-gray-500">
                      Assigned site
                    </span>
                  </div>
                )}
              </div>

              {selectedSite ===
                "All Sites" && (
                <div className="rounded-2xl bg-blue-50 px-5 py-4 text-sm text-blue-800">
                  <strong>
                    Overview only.
                  </strong>{" "}
                  Select a site to add or edit
                  prep.
                </div>
              )}

              {hasSelectedSpecificSite && (
                <div className="rounded-2xl bg-violet-50 px-5 py-4 text-sm text-violet-800">
                  Editing{" "}
                  <strong>
                    {selectedSite}
                  </strong>{" "}
                  prep.
                </div>
              )}
            </div>
          </div>

          {selectedSite ===
          "All Sites" ? (
            <div className="mt-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-950">
                  All Sites Prep Overview
                </h2>

                <p className="mt-2 text-gray-600">
                  Select a site card to view
                  and manage its prep plan.
                </p>
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                {siteSummaries.map(
                  (summary) => (
                    <button
                      type="button"
                      key={summary.site}
                      onClick={() =>
                        changeSite(
                          summary.site
                        )
                      }
                      className="rounded-3xl border border-gray-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-green-300 hover:shadow-md"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-800">
                            <Building2
                              size={24}
                            />
                          </div>

                          <h3 className="text-2xl font-bold text-gray-950">
                            {summary.site}
                          </h3>
                        </div>

                        <span className="text-2xl text-violet-800">
                          →
                        </span>
                      </div>

                      <div className="mt-6 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-sm text-gray-500">
                            Today
                          </p>

                          <p className="mt-1 text-2xl font-bold text-gray-950">
                            {
                              summary.todayCount
                            }
                          </p>
                        </div>

                        <div className="rounded-2xl bg-blue-50 p-4">
                          <p className="text-sm text-blue-700">
                            Tomorrow
                          </p>

                          <p className="mt-1 text-2xl font-bold text-blue-900">
                            {
                              summary.tomorrowCount
                            }
                          </p>
                        </div>

                        <div className="rounded-2xl bg-yellow-50 p-4">
                          <p className="text-sm text-yellow-700">
                            Awaiting Approval
                          </p>

                          <p className="mt-1 text-2xl font-bold text-yellow-900">
                            {
                              summary.awaitingApprovalCount
                            }
                          </p>
                        </div>

                        <div className="rounded-2xl bg-violet-50 p-4">
                          <p className="text-sm text-violet-700">
                            Approved Today
                          </p>

                          <p className="mt-1 text-2xl font-bold text-violet-900">
                            {
                              summary.approvedCount
                            }
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl bg-white p-5 shadow-sm">
                  <p className="text-sm text-gray-500">
                    Today&apos;s Prep
                  </p>

                  <p className="mt-1 text-3xl font-bold text-gray-950">
                    {todayItems.length}
                  </p>
                </div>

                <div className="rounded-3xl bg-violet-50 p-5 shadow-sm">
                  <p className="text-sm text-violet-700">
                    Approved Today
                  </p>

                  <p className="mt-1 text-3xl font-bold text-violet-900">
                    {approvedTodayCount}
                  </p>
                </div>

                <div className="rounded-3xl bg-blue-50 p-5 shadow-sm">
                  <p className="text-sm text-blue-700">
                    Tomorrow&apos;s Prep
                  </p>

                  <p className="mt-1 text-3xl font-bold text-blue-900">
                    {tomorrowItems.length}
                  </p>
                </div>
              </div>

              <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
                <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedDay(
                          "today"
                        )
                      }
                      className={`rounded-xl px-5 py-3 font-semibold transition ${
                        selectedDay ===
                        "today"
                          ? "bg-violet-800 text-white"
                          : "border border-gray-300 bg-white text-gray-700 hover:bg-slate-50"
                      }`}
                    >
                      Today
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedDay(
                          "tomorrow"
                        )
                      }
                      className={`rounded-xl px-5 py-3 font-semibold transition ${
                        selectedDay ===
                        "tomorrow"
                          ? "bg-blue-700 text-white"
                          : "border border-gray-300 bg-white text-gray-700 hover:bg-slate-50"
                      }`}
                    >
                      Tomorrow
                    </button>
                  </div>

                  <div className="relative w-full lg:w-96">
                    <Search
                      size={20}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type="search"
                      value={search}
                      onChange={(event) =>
                        setSearch(
                          event.target.value
                        )
                      }
                      placeholder={`Search ${selectedSite} ${selectedDay} prep...`}
                      className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-11 pr-11 outline-none transition focus:border-violet-800"
                    />

                    {search && (
                      <button
                        type="button"
                        onClick={() =>
                          setSearch("")
                        }
                        className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-gray-500 hover:bg-slate-100"
                        aria-label="Clear search"
                      >
                        <X size={17} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-3">
                  <CalendarDays
                    size={23}
                    className={
                      selectedDay ===
                      "today"
                        ? "text-violet-800"
                        : "text-blue-700"
                    }
                  />

                  <div>
                    <h2 className="text-2xl font-bold text-gray-950">
                      {selectedSite} —{" "}
                      {selectedDay ===
                      "today"
                        ? "Today's Prep"
                        : "Tomorrow's Prep"}
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      {selectedDay ===
                      "today"
                        ? "Prep being completed by the kitchen today."
                        : "Plan tomorrow before finishing today's shift."}
                    </p>
                  </div>
                </div>

                {selectedDayItems.length ===
                0 ? (
                  <div className="mt-6 rounded-2xl bg-slate-50 p-10 text-center">
                    <h3 className="text-xl font-bold text-gray-950">
                      No prep planned
                    </h3>

                    <p className="mt-2 text-gray-500">
                      Add a recipe to{" "}
                      {selectedSite}&apos;s{" "}
                      {selectedDay} prep.
                    </p>

                    {canEdit && (
                      <button
                        type="button"
                        onClick={openAddPrep}
                        className="mt-5 rounded-xl bg-violet-800 px-5 py-3 font-semibold text-white transition hover:bg-violet-900"
                      >
                        + Add Prep
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="mt-6 grid gap-5 lg:grid-cols-2">
                    {selectedDayItems.map(
                      (item) => {
                        const recipe =
                          recipeList.find(
                            (
                              currentRecipe
                            ) =>
                              currentRecipe.name
                                .trim()
                                .toLowerCase() ===
                              item.name
                                .trim()
                                .toLowerCase()
                          );

                        const time = recipe
                          ? getRecipeTime(
                              recipe
                            )
                          : "Recipe unavailable";

                        return (
                          <div
                            key={item.id}
                            className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                          >
                            <div
                              className={`h-2 ${
                                item.status ===
                                "approved"
                                  ? "bg-violet-700"
                                  : item.status ===
                                    "awaitingApproval"
                                  ? "bg-yellow-500"
                                  : selectedDay ===
                                    "tomorrow"
                                  ? "bg-blue-600"
                                  : "bg-blue-500"
                              }`}
                            />

                            <div className="p-6">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <h3 className="text-2xl font-bold text-gray-950">
                                    {item.emoji}{" "}
                                    {item.name}
                                  </h3>

                                  <p className="mt-2 text-gray-500">
                                    Planned:{" "}
                                    {
                                      item.planned
                                    }{" "}
                                    {item.planned ===
                                    1
                                      ? "batch"
                                      : "batches"}
                                  </p>

                                  <p className="mt-1 text-gray-500">
                                    Estimated
                                    time: {time}
                                  </p>

                                  {item.status ===
                                    "awaitingApproval" && (
                                    <p className="mt-2 font-semibold text-yellow-700">
                                      Chef
                                      submitted{" "}
                                      {
                                        item.produced
                                      }
                                    </p>
                                  )}

                                  {item.status ===
                                    "approved" && (
                                    <p className="mt-2 font-semibold text-violet-700">
                                      Approved:{" "}
                                      {
                                        item.produced
                                      }
                                    </p>
                                  )}
                                </div>

                                <span
                                  className={`rounded-full px-3 py-1 text-sm font-semibold ${
                                    item.status ===
                                    "approved"
                                      ? "bg-violet-100 text-violet-800"
                                      : item.status ===
                                        "awaitingApproval"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-blue-100 text-blue-800"
                                  }`}
                                >
                                  {item.status ===
                                  "approved"
                                    ? "Approved"
                                    : item.status ===
                                      "awaitingApproval"
                                    ? "Awaiting Approval"
                                    : "Planned"}
                                </span>
                              </div>

                              <div className="mt-6 flex flex-wrap gap-3">
                                <button
                                  type="button"
                                  onClick={() =>
                                    openRecipe(
                                      item
                                    )
                                  }
                                  className="rounded-xl border border-gray-300 px-4 py-3 font-semibold transition hover:bg-slate-50"
                                >
                                  📖 Recipe
                                </button>

                                {canEdit &&
                                  item.status ===
                                    "planned" && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          openEditQuantity(
                                            item
                                          )
                                        }
                                        className="flex-1 rounded-xl border border-violet-800 px-4 py-3 font-semibold text-violet-800 transition hover:bg-violet-50"
                                      >
                                        Change
                                        Quantity
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleRemovePrep(
                                            item
                                          )
                                        }
                                        className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-700 transition hover:bg-red-100"
                                        aria-label="Remove prep"
                                      >
                                        <Trash2
                                          size={
                                            19
                                          }
                                        />
                                      </button>
                                    </>
                                  )}

                                {item.status ===
                                  "approved" && (
                                  <div className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-50 px-4 py-3 font-semibold text-violet-800">
                                    <CheckCircle2
                                      size={19}
                                    />
                                    Prep complete
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </div>

              <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <History size={22} className="text-violet-800" />
                  <div>
                    <h2 className="text-xl font-bold text-gray-950">Prep History</h2>
                    <p className="mt-1 text-sm text-gray-500">Past prep days are archived automatically when tomorrow becomes today.</p>
                  </div>
                </div>

                {selectedSiteHistory.length === 0 ? (
                  <div className="mt-5 rounded-2xl bg-slate-50 p-8 text-center text-gray-500">
                    No previous prep days yet.
                  </div>
                ) : (
                  <div className="mt-5 overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 text-gray-500">
                          <th className="px-3 py-3 font-semibold">Date</th>
                          <th className="px-3 py-3 font-semibold">Prep</th>
                          <th className="px-3 py-3 font-semibold">Planned</th>
                          <th className="px-3 py-3 font-semibold">Produced</th>
                          <th className="px-3 py-3 font-semibold">Status</th>
                          <th className="px-3 py-3 font-semibold">Chef</th>
                          <th className="px-3 py-3 font-semibold">Approved By</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedSiteHistory.map((record) => (
                          <tr key={record.id} className="border-b border-gray-100">
                            <td className="px-3 py-4 font-semibold text-gray-700">{record.scheduledDate}</td>
                            <td className="px-3 py-4 font-semibold text-gray-950">{record.emoji} {record.name}</td>
                            <td className="px-3 py-4 text-gray-700">{record.planned}</td>
                            <td className="px-3 py-4 text-gray-700">{record.produced || "—"}</td>
                            <td className="px-3 py-4">
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                record.status === "approved"
                                  ? "bg-violet-100 text-violet-800"
                                  : record.status === "awaitingApproval"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-slate-100 text-gray-700"
                              }`}>
                                {record.status === "approved" ? "Complete" : record.status === "awaitingApproval" ? "Awaiting approval" : "Not completed"}
                              </span>
                            </td>
                            <td className="px-3 py-4 text-gray-700">{record.chef || "—"}</td>
                            <td className="px-3 py-4 text-gray-700">{record.approvedBy || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}
        </div>

        {adding && canEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm">
            <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-violet-800">
                    {selectedSite}
                  </p>

                  <h2 className="mt-1 text-2xl font-bold text-gray-950">
                    Add Prep
                  </h2>

                  <p className="mt-2 text-gray-600">
                    Add a Recipe Library item
                    to{" "}
                    <strong>
                      {selectedSite}
                    </strong>
                    &apos;s{" "}
                    <strong>
                      {selectedDay}
                    </strong>{" "}
                    prep.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeAddPrep}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-gray-600 transition hover:bg-slate-200"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="relative mt-6">
                <Search
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="search"
                  value={addRecipeSearch}
                  onChange={(event) =>
                    setAddRecipeSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search Recipe Library..."
                  className="w-full rounded-xl border border-gray-300 py-3 pl-11 pr-4 outline-none focus:border-violet-800"
                />
              </div>

              {filteredAvailableRecipes.length ===
              0 ? (
                <div className="mt-5 rounded-2xl bg-slate-50 p-7 text-center">
                  <p className="font-semibold text-gray-700">
                    No recipes found.
                  </p>

                  <p className="mt-2 text-sm text-gray-500">
                    Add the recipe in the
                    Recipe Library first.
                  </p>
                </div>
              ) : (
                <div className="mt-5 max-h-80 space-y-3 overflow-y-auto pr-1">
                  {filteredAvailableRecipes.map(
                    (recipe) => (
                      <button
                        type="button"
                        key={recipe.name}
                        onClick={() =>
                          setSelectedRecipe(
                            recipe
                          )
                        }
                        className={`w-full rounded-xl border p-4 text-left transition ${
                          selectedRecipe?.name ===
                          recipe.name
                            ? "border-violet-800 bg-violet-50"
                            : "border-gray-200 bg-white hover:bg-slate-50"
                        }`}
                      >
                        <p className="font-semibold text-gray-950">
                          {recipe.emoji}{" "}
                          {recipe.name}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          {recipe.prepTime} •{" "}
                          {recipe.yield}
                        </p>
                      </button>
                    )
                  )}
                </div>
              )}

              <div className="mt-6">
                <p className="mb-3 font-medium text-gray-700">
                  Planned Batches
                </p>

                <div className="flex items-center justify-center gap-8 rounded-2xl border border-gray-200 p-5">
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity(
                        Math.max(
                          1,
                          quantity - 1
                        )
                      )
                    }
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-gray-900 transition hover:bg-slate-200"
                  >
                    <Minus size={26} />
                  </button>

                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={quantity}
                    onChange={(event) =>
                      setQuantity(
                        Math.max(
                          1,
                          Number(
                            event.target.value
                          ) || 1
                        )
                      )
                    }
                    className="w-24 rounded-xl border border-gray-300 px-3 py-3 text-center text-3xl font-bold outline-none focus:border-violet-800"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setQuantity(
                        quantity + 1
                      )
                    }
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-800 text-white transition hover:bg-violet-900"
                  >
                    <Plus size={26} />
                  </button>
                </div>
              </div>

              {error && (
                <div className="mt-5 rounded-2xl bg-red-50 p-4 font-semibold text-red-800">
                  {error}
                </div>
              )}

              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  onClick={closeAddPrep}
                  className="flex-1 rounded-xl border border-gray-300 py-3 font-semibold transition hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={addPrep}
                  disabled={!selectedRecipe}
                  className="flex-1 rounded-xl bg-violet-800 py-3 font-semibold text-white transition hover:bg-violet-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Add to{" "}
                  {selectedDay === "today"
                    ? "Today"
                    : "Tomorrow"}
                </button>
              </div>
            </div>
          </div>
        )}

        {editingItem && canEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
              <p className="text-center text-sm font-semibold text-violet-800">
                {editingItem.site}
              </p>

              <h2 className="mt-1 text-center text-2xl font-bold text-gray-950">
                Change Prep Quantity
              </h2>

              <p className="mt-2 text-center text-gray-600">
                {editingItem.emoji}{" "}
                {editingItem.name}
              </p>

              <div className="mt-6 flex items-center justify-center gap-8 rounded-2xl border border-gray-200 p-5">
                <button
                  type="button"
                  onClick={() =>
                    setEditingQuantity(
                      Math.max(
                        1,
                        editingQuantity - 1
                      )
                    )
                  }
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 transition hover:bg-slate-200"
                >
                  <Minus size={26} />
                </button>

                <input
                  type="number"
                  min={1}
                  step={1}
                  value={editingQuantity}
                  onChange={(event) =>
                    setEditingQuantity(
                      Math.max(
                        1,
                        Number(
                          event.target.value
                        ) || 1
                      )
                    )
                  }
                  className="w-24 rounded-xl border border-gray-300 px-3 py-3 text-center text-3xl font-bold outline-none focus:border-violet-800"
                />

                <button
                  type="button"
                  onClick={() =>
                    setEditingQuantity(
                      editingQuantity + 1
                    )
                  }
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-800 text-white transition hover:bg-violet-900"
                >
                  <Plus size={26} />
                </button>
              </div>

              {error && (
                <div className="mt-5 rounded-2xl bg-red-50 p-4 font-semibold text-red-800">
                  {error}
                </div>
              )}

              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  onClick={closeEditQuantity}
                  className="flex-1 rounded-xl border border-gray-300 py-3 font-semibold transition hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={
                    saveEditedQuantity
                  }
                  className="flex-1 rounded-xl bg-violet-800 py-3 font-semibold text-white transition hover:bg-violet-900"
                >
                  Save Quantity
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedRecipeCard && (
          <RecipeModal
            recipe={selectedRecipeCard}
            initialBatches={
              selectedRecipeBatches
            }
            onClose={() =>
              setSelectedRecipeCard(null)
            }
          />
        )}
      </main>
    </ProtectedPage>
  );
}