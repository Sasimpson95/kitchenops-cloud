export type ReportTab =
  | "operations"
  | "inventory"
  | "purchasing"
  | "waste"
  | "transfers"
  | "stocktakes"
  | "products"
  | "sites"
  | "recipes"
  | "production";

export type ReportFiltersState = {
  startDate: string;
  endDate: string;
  site: string;
  supplier: string;
  category: string;
  search: string;
};

export type CsvValue = string | number | boolean | null | undefined;
export type CsvRow = Record<string, CsvValue>;
