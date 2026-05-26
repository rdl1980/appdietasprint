import { GroceryItem } from "@/lib/types";
import { ShoppingBasket } from "lucide-react";
import { Card } from "./Card";

type GroceryListProps = {
  items: GroceryItem[];
};

export function GroceryList({ items }: GroceryListProps) {
  return (
    <Card>
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-mint text-leaf">
          <ShoppingBasket size={20} aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-xl font-bold text-ink">Lista spesa 7 giorni</h2>
          <p className="text-sm text-ink/60">Ingredienti sommati dalle ricette generate.</p>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between rounded-[8px] border border-ink/10 bg-cream px-3 py-2 text-sm"
          >
            <span className="font-medium text-ink">{item.name}</span>
            <span className="text-ink/60">{item.grams} g</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
