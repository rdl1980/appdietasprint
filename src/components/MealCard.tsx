import { Meal } from "@/lib/types";
import { RefreshCw } from "lucide-react";
import { Button } from "./Button";
import { MacroBadge } from "./MacroBadge";

type MealCardProps = {
  meal: Meal;
};

const mealTypeLabels: Record<Meal["mealType"], string> = {
  breakfast: "Colazione",
  lunch: "Pranzo",
  dinner: "Cena",
  snack: "Spuntino",
};

export function MealCard({ meal }: MealCardProps) {
  return (
    <article className="rounded-[8px] border border-ink/10 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-leaf">{mealTypeLabels[meal.mealType]}</p>
          <h3 className="mt-1 text-base font-bold text-ink">{meal.name}</h3>
        </div>
        <span className="shrink-0 rounded-full bg-lemon/45 px-3 py-1 text-xs font-bold text-ink">
          {meal.calories} kcal
        </span>
      </div>
      <ul className="mt-3 space-y-1 text-sm text-ink/70">
        {meal.ingredients.map((ingredient) => (
          <li key={`${meal.id}-${ingredient.name}`}>
            {ingredient.name} - {ingredient.grams} g
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        <MacroBadge label="P" value={`${meal.protein} g`} />
        <MacroBadge label="C" value={`${meal.carbs} g`} />
        <MacroBadge label="G" value={`${meal.fats} g`} />
      </div>
      <Button type="button" variant="ghost" size="sm" className="mt-4 w-full ring-1 ring-ink/10">
        <RefreshCw size={16} aria-hidden="true" />
        Rigenera pasto
      </Button>
    </article>
  );
}
