"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type KitchenOpsTheme = "system" | "light" | "dark";
type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  theme: KitchenOpsTheme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: KitchenOpsTheme) => void;
};

const STORAGE_KEY = "kitchenops-theme";

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function readStoredTheme(): KitchenOpsTheme {
  if (typeof window === "undefined") return "system";

  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "dark" || stored === "system"
    ? stored
    : "system";
}

function applyTheme(theme: KitchenOpsTheme): ResolvedTheme {
  const resolved = theme === "system" ? getSystemTheme() : theme;
  const root = document.documentElement;

  root.classList.toggle("dark", resolved === "dark");
  root.dataset.theme = theme;
  root.style.colorScheme = resolved;

  return resolved;
}

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<KitchenOpsTheme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");

  useEffect(() => {
    const initialTheme = readStoredTheme();
    setThemeState(initialTheme);
    setResolvedTheme(applyTheme(initialTheme));
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const handleSystemThemeChange = () => {
      if (theme === "system") {
        setResolvedTheme(applyTheme("system"));
      }
    };

    media.addEventListener("change", handleSystemThemeChange);
    return () => media.removeEventListener("change", handleSystemThemeChange);
  }, [theme]);

  const setTheme = useCallback((nextTheme: KitchenOpsTheme) => {
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
    setThemeState(nextTheme);
    setResolvedTheme(applyTheme(nextTheme));
  }, []);

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }
  return context;
}
