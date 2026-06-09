import type { DietType, Ingredient, Meal, MealType } from "./types";

export type AdminMealTemplate = Meal & {
  active: boolean;
  source: "database" | "static";
  updatedAt?: string;
};

export type AdminMealTemplateInput = {
  id?: string;
  name?: string;
  mealType?: MealType;
  dietTypes?: DietType[];
  ingredients?: Ingredient[];
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  tags?: string[];
  active?: boolean;
};

const mealTypes = new Set<MealType>(["breakfast", "lunch", "dinner", "snack"]);
const dietTypes = new Set<DietType>(["ketogenic", "mediterranean", "lowCarb", "balanced", "vegetarian"]);

export function slugifyTemplateId(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function parseCsvList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseIngredientsText(value: string): Ingredient[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, grams] = line.split(":").map((item) => item.trim());
      return { name, grams: Number(grams) };
    })
    .filter((ingredient) => ingredient.name && Number.isFinite(ingredient.grams) && ingredient.grams > 0);
}

export function validateAdminMealTemplate(input: AdminMealTemplateInput) {
  const id = slugifyTemplateId(input.id || input.name || "");
  const errors: string[] = [];

  if (!id) errors.push("ID richiesto.");
  if (!input.name?.trim()) errors.push("Nome richiesto.");
  if (!input.mealType || !mealTypes.has(input.mealType)) errors.push("Tipo pasto non valido.");
  if (!input.dietTypes?.length || input.dietTypes.some((dietType) => !dietTypes.has(dietType))) {
    errors.push("Almeno una dieta valida e' richiesta.");
  }
  if (!input.ingredients?.length) errors.push("Almeno un ingrediente valido e' richiesto.");
  if (!input.calories || input.calories <= 0) errors.push("Calorie richieste.");

  if (errors.length) {
    return { ok: false as const, errors };
  }

  const name = input.name || "";
  const calories = input.calories || 0;

  return {
    ok: true as const,
    template: {
      id,
      name: name.trim(),
      mealType: input.mealType,
      dietTypes: input.dietTypes,
      ingredients: input.ingredients,
      calories: Math.round(calories),
      protein: Math.max(0, Math.round(input.protein || 0)),
      carbs: Math.max(0, Math.round(input.carbs || 0)),
      fats: Math.max(0, Math.round(input.fats || 0)),
      tags: input.tags || [],
      active: input.active ?? true,
    },
  };
}
