export type UserRole = "chef" | "manager" | "operations";

export type User = {
  name: string;
  role: UserRole;
  site: string | "All Sites";
};

export const demoUsers: User[] = [
  {
    name: "Harry",
    role: "chef",
    site: "Beeston",
  },
  {
    name: "Stephen",
    role: "manager",
    site: "Beeston",
  },
  {
    name: "Operations",
    role: "operations",
    site: "All Sites",
  },
];

export const defaultUser: User = demoUsers[0];