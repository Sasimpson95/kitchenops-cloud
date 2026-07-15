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

export const startingProduction: ProductionItem[] = [
  {
    id: 1,

    site: "Beeston",

    name: "Wet Mix",
    emoji: "🥣",

    planned: 5,
    produced: 0,

    status: "planned",
    day: "today",

    createdAt: "2026-07-12T08:00:00.000Z",
    updatedAt: "2026-07-12T08:00:00.000Z",
  },
  {
    id: 2,

    site: "Beeston",

    name: "Salted Caramel",
    emoji: "🍮",

    planned: 1,
    produced: 0,

    status: "planned",
    day: "today",

    createdAt: "2026-07-12T08:00:00.000Z",
    updatedAt: "2026-07-12T08:00:00.000Z",
  },
];