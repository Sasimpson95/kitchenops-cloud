"use client";

import { Check, Laptop, Moon, Sun } from "lucide-react";

import ProtectedPage from "@/components/ProtectedPage";
import { useTheme, type KitchenOpsTheme } from "@/components/theme/ThemeProvider";

const options: Array<{
  value: KitchenOpsTheme;
  title: string;
  description: string;
  icon: typeof Sun;
}> = [
  {
    value: "system",
    title: "System",
    description: "Follow your device's light or dark appearance automatically.",
    icon: Laptop,
  },
  {
    value: "light",
    title: "Light",
    description: "Always use KitchenOps in light mode.",
    icon: Sun,
  },
  {
    value: "dark",
    title: "Dark",
    description: "Always use KitchenOps in dark mode.",
    icon: Moon,
  },
];

export default function AppearanceSettingsPage() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <ProtectedPage>
      <main className="ko-page ko-enter">
        <div className="mx-auto w-full max-w-4xl">
          <p className="font-semibold text-violet-800">Settings</p>
          <h1 className="mt-1 text-4xl font-bold text-gray-950">Appearance</h1>
          <p className="mt-2 max-w-2xl text-gray-600">
            Choose how KitchenOps looks on this device. Your preference is saved locally.
          </p>

          <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="grid gap-4 md:grid-cols-3">
              {options.map((option) => {
                const Icon = option.icon;
                const selected = theme === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTheme(option.value)}
                    aria-pressed={selected}
                    className={`relative min-h-44 rounded-2xl border p-5 text-left transition ${
                      selected
                        ? "border-violet-500 bg-violet-50 ring-4 ring-violet-100"
                        : "border-gray-200 bg-white hover:border-violet-200 hover:bg-violet-50/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-800">
                        <Icon size={22} />
                      </span>

                      {selected ? (
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-800 text-white">
                          <Check size={16} />
                        </span>
                      ) : null}
                    </div>

                    <h2 className="mt-5 text-lg font-bold text-gray-950">{option.title}</h2>
                    <p className="mt-1 text-sm leading-6 text-gray-600">{option.description}</p>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 rounded-xl border border-gray-200 bg-slate-50 px-4 py-3 text-sm text-gray-600">
              Current appearance: <strong className="text-gray-950">{resolvedTheme === "dark" ? "Dark" : "Light"}</strong>
              {theme === "system" ? " (following your device)" : ""}.
            </div>
          </section>
        </div>
      </main>
    </ProtectedPage>
  );
}
