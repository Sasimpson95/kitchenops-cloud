"use client";

import {
  Boxes,
  ClipboardCheck,
  FileText,
  Package,
  Search,
  Settings,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import type { User } from "@/config/roles";

import { getProducts } from "@/lib/productStore";
import { getRecipes } from "@/data/recipes";

type CommandPaletteProps = {
  currentUser: User;
};

type CommandItem = {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: React.ReactNode;
};

export default function CommandPalette({
  currentUser,
}: CommandPaletteProps) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }

      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const items = useMemo<CommandItem[]>(() => {
    const navigation: CommandItem[] = [
      {
        id: "mission-control",
        label: "Mission Control",
        description: "Today’s operations overview",
        href: "/home",
        icon: <Boxes size={18} />,
      },
      {
        id: "inventory",
        label: "Inventory",
        description: "Stock, value and movements",
        href: "/inventory",
        icon: <Package size={18} />,
      },
      {
        id: "purchasing",
        label: "Purchasing",
        description: "Orders and deliveries",
        href: "/purchasing",
        icon: <ShoppingCart size={18} />,
      },
      {
        id: "waste",
        label: "Record Waste",
        description: "Record or review waste",
        href: "/waste",
        icon: <Trash2 size={18} />,
      },
      {
        id: "stocktakes",
        label: "Stocktakes",
        description: "Start or resume a stocktake",
        href: "/stocktakes",
        icon: <ClipboardCheck size={18} />,
      },
      {
        id: "reports",
        label: "Reports",
        description: "Operations reporting centre",
        href: "/reports",
        icon: <FileText size={18} />,
      },
    ];

    if (currentUser.role === "operations") {
      navigation.push({
        id: "settings",
        label: "Settings",
        description: "Business and integration settings",
        href: "/settings",
        icon: <Settings size={18} />,
      });
    }

    const productItems = getProducts()
      .filter((product) => product.active)
      .map<CommandItem>((product) => ({
        id: `product-${product.id}`,
        label: product.name,
        description: `Product • ${product.category}`,
        href: `/products/${product.id}`,
        icon: <Package size={18} />,
      }));

    const recipeItems = getRecipes().map<CommandItem>((recipe) => ({
      id: `recipe-${recipe.name}`,
      label: recipe.name,
      description: `Recipe • ${recipe.yield}`,
      href: `/recipes?recipe=${encodeURIComponent(recipe.name)}`,
      icon: <FileText size={18} />,
    }));

    return [...navigation, ...productItems, ...recipeItems];
  }, [currentUser.role, open]);

  const filtered = items.filter((item) => {
    const query = search.trim().toLowerCase();

    return (
      !query ||
      `${item.label} ${item.description}`.toLowerCase().includes(query)
    );
  });

  function openItem(item: CommandItem): void {
    setOpen(false);
    setSearch("");
    router.push(item.href);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/45 px-4 pt-[10vh] backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b px-5">
          <Search size={21} className="text-gray-400" />

          <input
            autoFocus
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search KitchenOps..."
            className="min-w-0 flex-1 py-5 text-lg outline-none"
          />

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-3">
          {filtered.length === 0 ? (
            <p className="p-8 text-center text-gray-500">
              No results found.
            </p>
          ) : (
            filtered.slice(0, 30).map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => openItem(item)}
                className="flex w-full items-center gap-4 rounded-2xl p-4 text-left transition hover:bg-violet-50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-violet-800">
                  {item.icon}
                </div>

                <div>
                  <p className="font-bold text-gray-950">{item.label}</p>
                  <p className="mt-1 text-sm text-gray-500">
                    {item.description}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="border-t bg-slate-50 px-5 py-3 text-xs text-gray-500">
          Press Ctrl + K to open anywhere • Esc to close
        </div>
      </div>
    </div>
  );
}
