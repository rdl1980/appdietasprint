import { describe, expect, it } from "vitest";
import { buildGroceryList, generateMealPlan, getMealSubstitutions, regenerateMeal } from "./generateMealPlan";
import { allDietTypes, allMealCounts, baseProfile as profile } from "../../tests/fixtures/profiles";
import { excludedFoodsFromAllergies } from "./plannerPreferences";

function ingredientNames(plan: ReturnType<typeof generateMealPlan>) {
  return plan.days.flatMap((day) => day.meals.flatMap((meal) => meal.ingredients.map((ingredient) => ingredient.name.toLowerCase())));
}

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

  it("is deterministic for the same profile", () => {
    const first = generateMealPlan(profile);
    const second = generateMealPlan(profile);

    expect(second).toEqual(first);
  });

  it("supports expected meal counts and falls back to three meals", () => {
    expect(generateMealPlan({ ...profile, mealsPerDay: 2 }).days[0].meals).toHaveLength(2);
    expect(generateMealPlan({ ...profile, mealsPerDay: 4 }).days[0].meals).toHaveLength(4);
    expect(generateMealPlan({ ...profile, mealsPerDay: 5 }).days[0].meals).toHaveLength(5);
    expect(generateMealPlan({ ...profile, mealsPerDay: 99 }).days[0].meals).toHaveLength(3);
  });

  it("assigns the expected meal slots in order", () => {
    expect(generateMealPlan({ ...profile, mealsPerDay: 2 }).days[0].meals.map((meal) => meal.mealType)).toEqual(["lunch", "dinner"]);
    expect(generateMealPlan({ ...profile, mealsPerDay: 5 }).days[0].meals.map((meal) => meal.mealType)).toEqual([
      "breakfast",
      "snack",
      "lunch",
      "snack",
      "dinner",
    ]);
  });

  it.each(allDietTypes.flatMap((dietType) => allMealCounts.map((mealsPerDay) => [dietType, mealsPerDay] as const)))(
    "produces a valid plan for %s with %d meals",
    (dietType, mealsPerDay) => {
      const plan = generateMealPlan({ ...profile, dietType, mealsPerDay });

      expect(plan.days).toHaveLength(7);

      for (const day of plan.days) {
        expect(day.meals).toHaveLength(mealsPerDay);
        expect(day.calories).toBeGreaterThan(0);
        expect(day.meals.every((meal) => meal.day === day.day)).toBe(true);
      }
    },
  );

  it("uses the suggested calories when no explicit target is set", () => {
    const plan = generateMealPlan({ ...profile, targetCalories: undefined });

    expect(plan.dailyCalories).toBe(plan.calorieResult.suggestedCalories);
  });

  it("clamps the requested day count between 1 and 7", () => {
    expect(generateMealPlan(profile, { days: 0 }).days).toHaveLength(1);
    expect(generateMealPlan(profile, { days: 30 }).days).toHaveLength(7);
    expect(generateMealPlan(profile, { days: 3 }).days).toHaveLength(3);
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

  it("stays reasonably close to the daily calorie target", () => {
    for (const dietType of allDietTypes) {
      const plan = generateMealPlan({ ...profile, dietType, targetCalories: 1800 });
      const average = plan.days.reduce((sum, day) => sum + day.calories, 0) / plan.days.length;

      expect(Math.abs(average - 1800), dietType).toBeLessThan(450);
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

  it("puts the medical review warning first when screening flags are selected", () => {
    const plan = generateMealPlan({
      ...profile,
      medicalFlags: ["diabetes"],
    });

    expect(plan.days.length).toBeGreaterThan(0);
    expect(plan.warnings[0]).toContain("Review medica necessaria");
    expect(plan.warnings[0]).toContain("Diabete");
  });

  it("aggregates grocery items by ingredient name", () => {
    const plan = generateMealPlan(profile);
    const names = plan.groceryList.map((item) => item.name);

    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, "it")));
    expect(new Set(names).size).toBe(names.length);
  });

  it("sums grocery grams across all meals", () => {
    const plan = generateMealPlan(profile);
    const expected = plan.days.flatMap((day) => day.meals).flatMap((meal) => meal.ingredients).reduce((sum, item) => sum + item.grams, 0);
    const actual = plan.groceryList.reduce((sum, item) => sum + item.grams, 0);

    expect(actual).toBe(expected);
  });

  it("excludes manually excluded foods (case-insensitive substring)", () => {
    const plan = generateMealPlan({ ...profile, dietType: "mediterranean", excludedFoods: ["POLLO", " salmone "] });
    const names = ingredientNames(plan);

    expect(names.some((name) => name.includes("pollo"))).toBe(false);
    expect(names.some((name) => name.includes("salmone"))).toBe(false);
  });

  it("applies structured allergy exclusions", () => {
    const plan = generateMealPlan({
      ...profile,
      dietType: "mediterranean",
      allergyFlags: ["fish"],
    });
    const names = ingredientNames(plan).join(" ");

    for (const food of excludedFoodsFromAllergies(["fish"])) {
      expect(names).not.toContain(food);
    }
  });

  it("prefers budget templates when budget mode is on", () => {
    const standard = generateMealPlan({ ...profile, dietType: "mediterranean", budgetMode: false });
    const budget = generateMealPlan({ ...profile, dietType: "mediterranean", budgetMode: true });
    const count = (plan: typeof standard) => plan.days.flatMap((day) => day.meals).filter((meal) => meal.tags.includes("budget")).length;

    expect(count(budget)).toBeGreaterThanOrEqual(count(standard));
  });

  it("returns compatible substitutions for a meal", () => {
    const plan = generateMealPlan(profile);
    const meal = plan.days[0].meals[0];
    const substitutions = getMealSubstitutions(meal, profile);

    expect(substitutions.length).toBeGreaterThan(0);
    expect(substitutions.length).toBeLessThanOrEqual(3);
    expect(substitutions.every((substitution) => substitution.mealType === meal.mealType)).toBe(true);
    expect(substitutions.some((substitution) => substitution.id === meal.id)).toBe(false);
  });

  it("orders substitutions by calorie proximity and respects the limit", () => {
    const plan = generateMealPlan({ ...profile, dietType: "balanced" });
    const meal = plan.days[0].meals[1];
    const substitutions = getMealSubstitutions(meal, profile, 2);
    const distances = substitutions.map((substitution) => Math.abs(substitution.calories - meal.calories));

    expect(substitutions.length).toBeLessThanOrEqual(2);
    expect(distances).toEqual([...distances].sort((a, b) => a - b));
  });

  it("regenerates a single meal and refreshes totals", () => {
    const plan = generateMealPlan(profile);
    const nextPlan = regenerateMeal(plan, profile, plan.days[0].day, 0);

    expect(nextPlan.days[0].meals[0].id).not.toBe(plan.days[0].meals[0].id);
    expect(nextPlan.days[0].meals[0].day).toBe(plan.days[0].day);
    expect(nextPlan.days[0].calories).toBe(nextPlan.days[0].meals.reduce((sum, meal) => sum + meal.calories, 0));
    expect(nextPlan.days[1]).toEqual(plan.days[1]);
    expect(nextPlan.groceryList.length).toBeGreaterThan(0);
  });

  it("returns the same plan when regenerating an unknown day or meal", () => {
    const plan = generateMealPlan(profile);

    expect(regenerateMeal(plan, profile, 99, 0)).toBe(plan);
    expect(regenerateMeal(plan, profile, 1, 42)).toBe(plan);
  });
});

describe("buildGroceryList", () => {
  it("merges duplicate ingredients and sorts alphabetically", () => {
    const plan = generateMealPlan(profile, { days: 1 });
    const meal = plan.days[0].meals[0];
    const list = buildGroceryList([meal, meal]);

    for (const ingredient of meal.ingredients) {
      expect(list.find((item) => item.name === ingredient.name)?.grams).toBe(ingredient.grams * 2);
    }
  });

  it("returns an empty list without meals", () => {
    expect(buildGroceryList([])).toEqual([]);
  });
});
