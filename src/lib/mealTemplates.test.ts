import { describe, expect, it } from "vitest";
import { mealTemplates } from "./mealTemplates";
import { allDietTypes } from "../../tests/fixtures/profiles";
import type { MealType } from "./types";

const mealTypes: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

describe("meal templates catalogue", () => {
  it("has unique ids and non-empty names", () => {
    const ids = mealTemplates.map((meal) => meal.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(mealTemplates.every((meal) => meal.name.trim().length > 3)).toBe(true);
  });

  it("uses only known meal and diet types", () => {
    for (const meal of mealTemplates) {
      expect(mealTypes).toContain(meal.mealType);
      expect(meal.dietTypes.length).toBeGreaterThan(0);
      expect(meal.dietTypes.every((dietType) => allDietTypes.includes(dietType))).toBe(true);
    }
  });

  it("lists ingredients with positive gram amounts", () => {
    for (const meal of mealTemplates) {
      expect(meal.ingredients.length).toBeGreaterThan(0);
      expect(meal.ingredients.every((ingredient) => ingredient.grams > 0 && ingredient.name.trim().length > 1)).toBe(true);
    }
  });

  it("keeps declared calories roughly consistent with macros (Atwater 4/4/9)", () => {
    for (const meal of mealTemplates) {
      const computed = meal.protein * 4 + meal.carbs * 4 + meal.fats * 9;
      const tolerance = Math.max(60, meal.calories * 0.15);

      expect(Math.abs(computed - meal.calories), `${meal.id}: ${computed} vs ${meal.calories}`).toBeLessThanOrEqual(tolerance);
    }
  });

  it.each(allDietTypes)("offers at least four templates per meal type for %s so weeks do not repeat", (dietType) => {
    for (const mealType of mealTypes) {
      const matches = mealTemplates.filter((meal) => meal.mealType === mealType && meal.dietTypes.includes(dietType));

      expect(matches.length, `${dietType}/${mealType}`).toBeGreaterThanOrEqual(4);
    }
  });

  it("keeps ketogenic templates low in carbohydrates", () => {
    const keto = mealTemplates.filter((meal) => meal.dietTypes.includes("ketogenic"));

    expect(keto.length).toBeGreaterThan(0);
    expect(keto.every((meal) => meal.carbs <= 20)).toBe(true);
  });

  it("keeps vegetarian templates free of meat and fish", () => {
    const forbidden = ["pollo", "tacchino", "manzo", "salmone", "orata", "tonno", "merluzzo", "sgombro", "prosciutto"];
    const vegetarian = mealTemplates.filter((meal) => meal.dietTypes.includes("vegetarian"));

    for (const meal of vegetarian) {
      const names = meal.ingredients.map((ingredient) => ingredient.name.toLowerCase());
      expect(names.some((name) => forbidden.some((word) => name.includes(word))), meal.id).toBe(false);
    }
  });
});
