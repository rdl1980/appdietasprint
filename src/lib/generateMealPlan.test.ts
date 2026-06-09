import { describe, expect, it } from "vitest";
import { generateMealPlan, getMealSubstitutions, regenerateMeal } from "./generateMealPlan";
import type { UserProfile } from "./types";

const profile: UserProfile = {
  sex: "female",
  age: 35,
  heightCm: 165,
  weightKg: 70,
  activityLevel: "moderate",
  goal: "standard",
  dietType: "balanced",
  targetCalories: 1800,
  mealsPerDay: 3,
  excludedFoods: [],
  simplicityLevel: "standard",
  budgetMode: false,
};

describe("generateMealPlan", () => {
  it("generates a complete seven-day plan", () => {
    const plan = generateMealPlan(profile);

    expect(plan.days).toHaveLength(7);
    expect(plan.days.map((day) => day.label)).toEqual([
      "Lunedi",
      "Martedi",
      "Mercoledi",
      "Giovedi",
      "Venerdi",
      "Sabato",
      "Domenica",
    ]);
    expect(plan.days.every((day) => day.meals.length === 3)).toBe(true);
    expect(plan.dailyCalories).toBe(1800);
    expect(plan.groceryList.length).toBeGreaterThan(0);
    expect(plan.macroTarget.proteinGrams[0]).toBeGreaterThan(0);
  });

  it("supports expected meal counts and falls back to three meals", () => {
    expect(generateMealPlan({ ...profile, mealsPerDay: 2 }).days[0].meals).toHaveLength(2);
    expect(generateMealPlan({ ...profile, mealsPerDay: 4 }).days[0].meals).toHaveLength(4);
    expect(generateMealPlan({ ...profile, mealsPerDay: 5 }).days[0].meals).toHaveLength(5);
    expect(generateMealPlan({ ...profile, mealsPerDay: 99 }).days[0].meals).toHaveLength(3);
  });

  it("can generate a single-day plan for Free users", () => {
    const plan = generateMealPlan(profile, { days: 1 });

    expect(plan.days).toHaveLength(1);
    expect(plan.groceryList.length).toBeGreaterThan(0);
  });

  it("keeps day totals equal to the sum of planned meals", () => {
    const plan = generateMealPlan(profile);

    for (const day of plan.days) {
      expect(day.calories).toBe(day.meals.reduce((sum, meal) => sum + meal.calories, 0));
      expect(day.protein).toBe(day.meals.reduce((sum, meal) => sum + meal.protein, 0));
      expect(day.carbs).toBe(day.meals.reduce((sum, meal) => sum + meal.carbs, 0));
      expect(day.fats).toBe(day.meals.reduce((sum, meal) => sum + meal.fats, 0));
    }
  });

  it("adds ketogenic and calorie safety warnings", () => {
    const plan = generateMealPlan({
      ...profile,
      dietType: "ketogenic",
      targetCalories: 900,
    });

    expect(plan.warnings.some((warning) => warning.includes("chetogenica"))).toBe(true);
    expect(plan.warnings.some((warning) => warning.includes("sotto 1000"))).toBe(true);
  });

  it("aggregates grocery items by ingredient name", () => {
    const plan = generateMealPlan(profile);
    const names = plan.groceryList.map((item) => item.name);

    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, "it")));
    expect(new Set(names).size).toBe(names.length);
  });

  it("applies structured allergy exclusions", () => {
    const plan = generateMealPlan({
      ...profile,
      dietType: "mediterranean",
      allergyFlags: ["fish"],
    });
    const ingredientNames = plan.groceryList.map((item) => item.name.toLowerCase()).join(" ");

    expect(ingredientNames).not.toContain("salmone");
    expect(ingredientNames).not.toContain("tonno");
    expect(ingredientNames).not.toContain("orata");
  });

  it("returns compatible substitutions for a meal", () => {
    const plan = generateMealPlan(profile);
    const meal = plan.days[0].meals[0];
    const substitutions = getMealSubstitutions(meal, profile);

    expect(substitutions.length).toBeGreaterThan(0);
    expect(substitutions.every((substitution) => substitution.mealType === meal.mealType)).toBe(true);
    expect(substitutions.some((substitution) => substitution.id === meal.id)).toBe(false);
  });

  it("regenerates a single meal and refreshes totals", () => {
    const plan = generateMealPlan(profile);
    const nextPlan = regenerateMeal(plan, profile, plan.days[0].day, 0);

    expect(nextPlan.days[0].meals[0].id).not.toBe(plan.days[0].meals[0].id);
    expect(nextPlan.days[0].calories).toBe(nextPlan.days[0].meals.reduce((sum, meal) => sum + meal.calories, 0));
    expect(nextPlan.groceryList.length).toBeGreaterThan(0);
  });
});
