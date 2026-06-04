"use client";

import { useMemo, useState } from "react";
import { GroceryItem } from "@/lib/types";
import { ShoppingBasket } from "lucide-react";
import { Card } from "./Card";

type GroceryListProps = {
  items: GroceryItem[];
};

const categoryRules: Array<{ label: string; patterns: string[] }> = [
  { label: "Ortofrutta", patterns: ["verd", "insalata", "pomodor", "zucchin", "broccoli", "frutti", "mirtilli"] },
  { label: "Proteine", patterns: ["pollo", "tacchino", "salmone", "orata", "tonno", "uova", "tofu", "legumi", "ceci", "lenticchie", "skyr"] },
  { label: "Cereali e dispensa", patterns: ["riso", "farro", "pasta", "pane", "avena", "quinoa", "cous cous", "olio"] },
  { label: "Freschi", patterns: ["yogurt", "ricotta", "fiocchi", "latte", "feta"] },
];

function getCategory(item: GroceryItem) {
  const name = item.name.toLowerCase();
  return categoryRules.find((category) => category.patterns.some((pattern) => name.includes(pattern)))?.label || "Altro";
}

export function GroceryList({ items }: GroceryListProps) {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const groupedItems = useMemo(() => {
    const groups = new Map<string, GroceryItem[]>();

    for (const item of items) {
      const category = getCategory(item);
      groups.set(category, [...(groups.get(category) || []), item]);
    }

    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b, "it"));
  }, [items]);

  return (
    <Card>
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-mint text-leaf">
          <ShoppingBasket size={20} aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-xl font-bold text-ink">Lista spesa 7 giorni</h2>
          <p className="text-sm text-ink/60">Ingredienti sommati, categorizzati e spuntabili.</p>
        </div>
      </div>
      <div className="space-y-4">
        {groupedItems.map(([category, categoryItems]) => (
          <section key={category}>
            <h3 className="mb-2 text-sm font-black uppercase tracking-[0.12em] text-leaf">{category}</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {categoryItems.map((item) => {
                const checked = Boolean(checkedItems[item.name]);

                return (
                  <label
                    key={item.name}
                    className="flex min-h-12 items-center justify-between gap-3 rounded-[8px] border border-ink/10 bg-cream px-3 py-2 text-sm"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) =>
                          setCheckedItems((current) => ({ ...current, [item.name]: event.target.checked }))
                        }
                        className="h-4 w-4 shrink-0 accent-leaf"
                      />
                      <span className={`font-medium text-ink ${checked ? "line-through opacity-55" : ""}`}>
                        {item.name}
                      </span>
                    </span>
                    <span className="shrink-0 text-ink/60">{item.grams} g</span>
                  </label>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </Card>
  );
}
