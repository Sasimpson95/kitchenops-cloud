import type { CsvRow, CsvValue } from "@/components/reports/types";

export const REPORT_SITES: Array<{ id: string; name: string }> = [];

export function toDateKey(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDefaultReportDates(): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 29);
  return { startDate: toDateKey(start), endDate: toDateKey(end) };
}

export function isWithinDateRange(
  value: string | undefined,
  startDate: string,
  endDate: string
): boolean {
  if (!value) return false;
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return false;

  const start = startDate ? new Date(`${startDate}T00:00:00`).getTime() : -Infinity;
  const end = endDate ? new Date(`${endDate}T23:59:59.999`).getTime() : Infinity;
  return timestamp >= start && timestamp <= end;
}

export function money(value: number, digits = 2): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: digits,
  }).format(Number.isFinite(value) ? value : 0);
}

export function number(value: number, digits = 2): string {
  return new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: digits,
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatDate(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function escapeCsv(value: CsvValue): string {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function downloadCsv(filename: string, rows: CsvRow[]): void {
  if (typeof window === "undefined") return;
  if (rows.length === 0) {
    window.alert("There is no report data to export.");
    return;
  }

  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const csv = [
    headers.map(escapeCsv).join(","),
    ...rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(",")),
  ].join("\n");

  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function printReport(): void {
  if (typeof window !== "undefined") window.print();
}

export function siteName(siteId: string): string {
  return REPORT_SITES.find((site) => site.id === siteId)?.name ?? siteId;
}
