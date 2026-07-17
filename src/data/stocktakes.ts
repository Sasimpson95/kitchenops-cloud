export type StocktakeSummary = {
  site: string;
  latestDate: string;
  latestValue: number;
  previousDate: string;
  previousValue: number;
  completion: number;
};

export const stocktakes: StocktakeSummary[] = [];
