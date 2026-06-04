import type { AllergyFlag, CookingTimePreference } from "./types";

export const allergyOptions: Array<{
  value: AllergyFlag;
  label: string;
  excludedFoods: string[];
}> = [
  { value: "gluten", label: "Glutine", excludedFoods: ["pane", "pasta", "farro", "cous cous"] },
  { value: "lactose", label: "Lattosio", excludedFoods: ["yogurt", "skyr", "ricotta", "fiocchi di latte"] },
  { value: "eggs", label: "Uova", excludedFoods: ["uova", "omelette"] },
  { value: "fish", label: "Pesce", excludedFoods: ["salmone", "orata", "tonno", "merluzzo", "sgombro"] },
  { value: "soy", label: "Soia", excludedFoods: ["tofu", "edamame", "soia"] },
  { value: "nuts", label: "Frutta a guscio", excludedFoods: ["mandorle", "noci", "nocciole"] },
];

export const cookingTimeOptions: Array<{
  value: CookingTimePreference;
  label: string;
}> = [
  { value: "ready", label: "Pronto o assemblato" },
  { value: "quick", label: "Entro 15 minuti" },
  { value: "standard", label: "Standard" },
  { value: "batch", label: "Batch cooking" },
];

export function excludedFoodsFromAllergies(flags: AllergyFlag[] = []) {
  return allergyOptions
    .filter((option) => flags.includes(option.value))
    .flatMap((option) => option.excludedFoods);
}
