"use client";

import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  XCircle,
} from "lucide-react";

import type { WasteRecord } from "@/lib/wasteStore";

type WasteComplianceCalendarProps = {
  records: WasteRecord[];
  sites: string[];
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onSelectSiteDate?: (site: string, date: string) => void;
};

type SiteCompletion = {
  site: string;
  completedDates: Set<string>;
  completedCount: number;
  applicableCount: number;
  percentage: number;
};

function toDateKey(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateKey(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function formatDateHeading(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(parseDateKey(value));
}

function getDatesInRange(startDate: string, endDate: string): string[] {
  if (!startDate || !endDate) return [];

  const start = parseDateKey(startDate);
  const end = parseDateKey(endDate);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    start > end
  ) {
    return [];
  }

  const dates: string[] = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    dates.push(toDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

function getRecordDate(record: WasteRecord): string {
  return toDateKey(new Date(record.createdAt));
}

function getWeekStart(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  const difference = day === 0 ? -6 : 1 - day;

  result.setDate(result.getDate() + difference);
  result.setHours(0, 0, 0, 0);

  return result;
}

function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date);
  const end = new Date(start);

  end.setDate(start.getDate() + 6);

  return end;
}

export default function WasteComplianceCalendar({
  records,
  sites,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onSelectSiteDate,
}: WasteComplianceCalendarProps) {
  const dates = getDatesInRange(startDate, endDate);
  const todayKey = toDateKey(new Date());

  const siteCompletion: SiteCompletion[] = sites.map((site) => {
    const completedDates = new Set(
      records
        .filter((record) => record.siteName === site)
        .map(getRecordDate)
    );

    const applicableDates = dates.filter((date) => date <= todayKey);
    const completedCount = applicableDates.filter((date) =>
      completedDates.has(date)
    ).length;

    return {
      site,
      completedDates,
      completedCount,
      applicableCount: applicableDates.length,
      percentage:
        applicableDates.length === 0
          ? 0
          : Math.round((completedCount / applicableDates.length) * 100),
    };
  });

  function setThisWeek(): void {
    const now = new Date();

    onStartDateChange(toDateKey(getWeekStart(now)));
    onEndDateChange(toDateKey(getWeekEnd(now)));
  }

  function setLastWeek(): void {
    const now = new Date();
    const thisWeekStart = getWeekStart(now);
    const lastWeekStart = new Date(thisWeekStart);
    const lastWeekEnd = new Date(thisWeekStart);

    lastWeekStart.setDate(thisWeekStart.getDate() - 7);
    lastWeekEnd.setDate(thisWeekStart.getDate() - 1);

    onStartDateChange(toDateKey(lastWeekStart));
    onEndDateChange(toDateKey(lastWeekEnd));
  }

  function setThisMonth(): void {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    onStartDateChange(toDateKey(monthStart));
    onEndDateChange(toDateKey(monthEnd));
  }

  function moveRange(direction: -1 | 1): void {
    if (!startDate || !endDate) return;

    const currentDates = getDatesInRange(startDate, endDate);
    const dayCount = Math.max(currentDates.length, 1);

    const nextStart = parseDateKey(startDate);
    const nextEnd = parseDateKey(endDate);

    nextStart.setDate(nextStart.getDate() + direction * dayCount);
    nextEnd.setDate(nextEnd.getDate() + direction * dayCount);

    onStartDateChange(toDateKey(nextStart));
    onEndDateChange(toDateKey(nextEnd));
  }

  const rangeInvalid =
    !startDate ||
    !endDate ||
    parseDateKey(startDate) > parseDateKey(endDate);

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-950">
            Waste Completion Calendar
          </h2>

          <p className="mt-2 text-gray-600">
            A date is complete when at least one waste record has been saved for
            that site. No record means not completed.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={setThisWeek}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-slate-50"
          >
            This Week
          </button>

          <button
            type="button"
            onClick={setLastWeek}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-slate-50"
          >
            Last Week
          </button>

          <button
            type="button"
            onClick={setThisMonth}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-slate-50"
          >
            This Month
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Start Date
          </label>

          <input
            type="date"
            value={startDate}
            onChange={(event) => onStartDateChange(event.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-red-600"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            End Date
          </label>

          <input
            type="date"
            value={endDate}
            onChange={(event) => onEndDateChange(event.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-red-600"
          />
        </div>

        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => moveRange(-1)}
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-300 bg-white text-gray-700 transition hover:bg-slate-50"
            aria-label="Previous date range"
          >
            <ChevronLeft size={20} />
          </button>

          <button
            type="button"
            onClick={() => moveRange(1)}
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-300 bg-white text-gray-700 transition hover:bg-slate-50"
            aria-label="Next date range"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {rangeInvalid ? (
        <div className="mt-6 rounded-2xl bg-red-50 p-5 font-semibold text-red-800">
          Choose a valid date range.
        </div>
      ) : (
        <>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-gray-200">
            <table className="min-w-max w-full border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="sticky left-0 z-10 min-w-40 border-b border-r border-gray-200 bg-slate-50 px-4 py-4 text-left text-sm font-bold text-gray-700">
                    Site
                  </th>

                  {dates.map((date) => (
                    <th
                      key={date}
                      className="min-w-28 border-b border-r border-gray-200 px-3 py-4 text-center text-xs font-bold text-gray-600"
                    >
                      {formatDateHeading(date)}
                    </th>
                  ))}

                  <th className="min-w-32 border-b border-gray-200 px-4 py-4 text-center text-sm font-bold text-gray-700">
                    Completion
                  </th>
                </tr>
              </thead>

              <tbody>
                {siteCompletion.map((summary) => (
                  <tr key={summary.site}>
                    <th className="sticky left-0 z-10 border-b border-r border-gray-200 bg-white px-4 py-4 text-left font-bold text-gray-950">
                      {summary.site}
                    </th>

                    {dates.map((date) => {
                      const isFuture = date > todayKey;
                      const completed = summary.completedDates.has(date);

                      return (
                        <td
                          key={`${summary.site}-${date}`}
                          className="border-b border-r border-gray-200 p-2 text-center"
                        >
                          {isFuture ? (
                            <div className="rounded-xl bg-slate-100 px-3 py-3 text-xs font-semibold text-gray-500">
                              Future
                            </div>
                          ) : completed ? (
                            <button
                              type="button"
                              onClick={() => onSelectSiteDate?.(summary.site, date)}
                              className="flex w-full flex-col items-center justify-center rounded-xl bg-violet-50 px-3 py-3 text-violet-800 transition hover:bg-violet-100"
                              title={`View ${summary.site} waste for ${date}`}
                            >
                              <CheckCircle2 size={20} />
                              <span className="mt-1 text-xs font-semibold">
                                Complete
                              </span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onSelectSiteDate?.(summary.site, date)}
                              className="flex w-full flex-col items-center justify-center rounded-xl bg-red-50 px-3 py-3 text-red-800 transition hover:bg-red-100"
                              title={`View ${summary.site} waste for ${date}`}
                            >
                              <XCircle size={20} />
                              <span className="mt-1 text-xs font-semibold">
                                Missing
                              </span>
                            </button>
                          )}
                        </td>
                      );
                    })}

                    <td className="border-b border-gray-200 px-4 py-4 text-center">
                      <div
                        className={`rounded-xl px-4 py-3 font-bold ${
                          summary.percentage === 100
                            ? "bg-violet-100 text-violet-900"
                            : summary.percentage >= 80
                              ? "bg-orange-100 text-orange-900"
                              : "bg-red-100 text-red-900"
                        }`}
                      >
                        {summary.percentage}%
                      </div>

                      <p className="mt-2 text-xs text-gray-500">
                        {summary.completedCount}/{summary.applicableCount} days
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2 text-violet-800">
              <CheckCircle2 size={18} />
              <span className="font-semibold">Waste recorded</span>
            </div>

            <div className="flex items-center gap-2 text-red-800">
              <XCircle size={18} />
              <span className="font-semibold">No waste record</span>
            </div>

            <div className="rounded-lg bg-slate-100 px-3 py-1 font-semibold text-gray-600">
              Future dates are not included in completion
            </div>
          </div>
        </>
      )}
    </div>
  );
}
