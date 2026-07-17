export type ProductionStatus =
  | "planned"
  | "awaitingApproval"
  | "approved";

export type ProductionDay =
  | "today"
  | "tomorrow";

export type ProductionItem = {
  id: number;

  site: string;

  name: string;
  emoji: string;

  planned: number;
  produced: number;

  status: ProductionStatus;
  day: ProductionDay;

  chef?: string;
  readyTime?: string;

  createdAt: string;
  updatedAt: string;
};

export const startingProduction: ProductionItem[] = [];