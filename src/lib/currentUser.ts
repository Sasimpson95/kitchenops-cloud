import { User } from "@/config/roles";

const STORAGE_KEY = "kitchenops-current-user";

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") {
    return null;
  }

  const savedUser = window.localStorage.getItem(STORAGE_KEY);

  if (!savedUser) {
    return null;
  }

  try {
    return JSON.parse(savedUser) as User;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: User) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function clearCurrentUser() {
  window.localStorage.removeItem(STORAGE_KEY);
}