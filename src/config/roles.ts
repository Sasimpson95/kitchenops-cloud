export type UserRole = "chef" | "manager" | "operations";

export type User = {
  name: string;
  role: UserRole;
  site: string | "All Sites";
};
