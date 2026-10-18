import { afterEach, describe, expect, it, vi } from "vitest";
import { buildMealPlanPrompt, generateAiMealPlan, mealPlanSystemPrompt, parseAiMealPlanResponse } from "./mealPlanGeneration";
import { setAiTextGeneratorForTests } from "./provider";
import { baseProfile } from "../../../tests/fixtures/profiles";
import type { UserProfile } from "../types";

const profile: UserProfile = { ...baseProfile, mealsPerDay: 3, targetCalories: 1800 };

function makeMeal(mealType: string, calories: number, name = `${mealType} ok`) {
  return {
    name,
    mealType,
    ingredients: [{ name: "Riso integrale", grams: 80 }, { name: "Zucchine", grams: 150 }],
    calories,
    protein: 25,
    carbs: 50,
    fats: 15,
    tags: ["semplice"],
  };
}

function makeDay(calories = 1800) {
  return { meals: [makeMeal("breakfast", Math.round(calories * 0.25)), makeMeal("lunch", Math.round(calories * 0.4)), makeMeal("dinner", Math.round(calories * 0.35))] };
}

function makePlan(days = 7, calories = 1800) {
  return { days: Array.from({ length: days }, () => makeDay(calories)) };
}

afterEach(() => {
  setAiTextGeneratorForTests(null);
});

describe("parseAiMealPlanResponse", () => {
  it("accepts a well-formed plan and recomputes totals", () => {
    const parsed = parseAiMealPlanResponse(makePlan(2), profile, 1800, 2);

    expect(parsed.reasons).toEqual([]);
    expect(parsed.days).toHaveLength(2);
    expect(parsed.days[0].label).toBe("Lunedi");
    expect(parsed.days[1].label).toBe("Martedi");
    expect(parsed.days[0].calories).toBe(450 + 720 + 630);
    expect(parsed.days[0].protein).toBe(75);
    expect(parsed.days[0].meals.every((meal) => meal.day === 1 && meal.id.startsWith("ai-1-"))).toBe(true);
    expect(parsed.days[0].meals[0].dietTypes).toEqual(["balanced"]);
  });

  it("rejects non-plan payloads", () => {
    expect(parseAiMealPlanResponse(null, profile, 1800, 1).days).toEqual([]);
    expect(parseAiMealPlanResponse({ meals: [] }, profile, 1800, 1).reasons).toEqual(["risposta non in formato piano"]);
  });

  it("rejects days with the wrong number of valid meals", () => {
    const plan = { days: [{ meals: [makeMeal("lunch", 900), makeMeal("dinner", 900)] }] };
    const parsed = parseAiMealPlanResponse(plan, profile, 1800, 1);

    expect(parsed.days).toEqual([]);
    expect(parsed.reasons[0]).toContain("2 pasti validi invece di 3");
  });

  it("drops meals with invalid structure", () => {
    const day = makeDay();
    day.meals[0] = { ...day.meals[0], ingredients: [] };
    const parsed = parseAiMealPlanResponse({ days: [day] }, profile, 1800, 1);

    expect(parsed.days).toEqual([]);
    expect(parsed.reasons[0]).toContain("pasti validi");
  });

  it("rejects meals containing excluded or allergy ingredients", () => {
    const day = makeDay();
    day.meals[1].ingredients.push({ name: "Salmone", grams: 120 });
    const parsed = parseAiMealPlanResponse({ days: [day] }, { ...profile, allergyFlags: ["fish"] }, 1800, 1);

    expect(parsed.days).toEqual([]);
    expect(parsed.reasons[0]).toContain("ingredienti esclusi");
  });

  it("rejects days far from the calorie target", () => {
    const parsed = parseAiMealPlanResponse(makePlan(1, 1200), profile, 1800, 1);

    expect(parsed.days).toEqual([]);
    expect(parsed.reasons[0]).toContain("fuori tolleranza");
  });

  it("rejects days with unsafe medical claims in meal names", () => {
    const day = makeDay();
    day.meals[0].name = "Colazione che cura il diabete";
    const parsed = parseAiMealPlanResponse({ days: [day] }, profile, 1800, 1);

    expect(parsed.days).toEqual([]);
    expect(parsed.reasons[0]).toContain("claim medico");
  });

  it("requires every expected day", () => {
    const parsed = parseAiMealPlanResponse(makePlan(3), profile, 1800, 7);

    expect(parsed.days).toEqual([]);
    expect(parsed.reasons).toContain("3 giorni validi invece di 7");
  });
});

describe("buildMealPlanPrompt", () => {
  it("includes calories, slots, macros and merged exclusions", () => {
    const prompt = JSON.parse(buildMealPlanPrompt({ ...profile, excludedFoods: ["tonno"], allergyFlags: ["nuts"] }, 1800, 7));

    expect(prompt.days).toBe(7);
    expect(prompt.dailyCalories).toBe(1800);
    expect(prompt.mealSlotsPerDay).toEqual(["breakfast", "lunch", "dinner"]);
    expect(prompt.excludedFoods).toContain("tonno");
    expect(prompt.excludedFoods).toContain("mandorle");
    expect(prompt.macroTargetGrams.protein[0]).toBeGreaterThan(0);
  });

  it("never leaks medical details into the generation prompt", () => {
    const prompt = buildMealPlanPrompt({ ...profile, medicalFlags: ["diabetes"] }, 1800, 7);

    expect(prompt).not.toContain("diabetes");
    expect(mealPlanSystemPrompt).toContain("Nessuna diagnosi");
  });
});

describe("generateAiMealPlan", () => {
  it("falls back to the deterministic generator without a provider", async () => {
    const result = await generateAiMealPlan(profile, { days: 2 });

    expect(result.source).toBe("fallback");
    expect(result.reasons).toEqual(["provider AI non configurato"]);
    expect(result.plan.days).toHaveLength(2);
  });

  it("uses the model answer when it validates", async () => {
    const generator = vi.fn().mockResolvedValue({ text: "```json\n" + JSON.stringify(makePlan(2)) + "\n```", provider: "anthropic", model: "t" });
    setAiTextGeneratorForTests(generator);

    const result = await generateAiMealPlan(profile, { days: 2 });

    expect(result.source).toBe("ai");
    expect(result.plan.days).toHaveLength(2);
    expect(result.plan.dailyCalories).toBe(1800);
    expect(result.plan.groceryList.length).toBeGreaterThan(0);
    expect(result.plan.macroTarget.note.length).toBeGreaterThan(0);
    expect(generator.mock.calls[0][0].json).toBe(true);
    expect(generator.mock.calls[0][0].system).toBe(mealPlanSystemPrompt);
  });

  it("adds safety warnings to AI plans", async () => {
    setAiTextGeneratorForTests(async () => ({ text: JSON.stringify(makePlan(1)), provider: "anthropic", model: "t" }));

    const result = await generateAiMealPlan({ ...profile, dietType: "ketogenic", medicalFlags: ["diabetes"] }, { days: 1 });

    expect(result.source).toBe("ai");
    expect(result.plan.warnings[0]).toContain("Review medica necessaria");
    expect(result.plan.warnings.some((warning) => warning.includes("chetogenica"))).toBe(true);
  });

  it("falls back when the model answer is invalid", async () => {
    setAiTextGeneratorForTests(async () => ({ text: "non so", provider: "anthropic", model: "t" }));

    const result = await generateAiMealPlan(profile, { days: 1 });

    expect(result.source).toBe("fallback");
    expect(result.reasons).toEqual(["risposta non in formato piano"]);
    expect(result.plan.days).toHaveLength(1);
  });

  it("falls back when the provider throws", async () => {
    setAiTextGeneratorForTests(async () => {
      throw new Error("timeout");
    });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const result = await generateAiMealPlan(profile, { days: 1 });

    expect(result.source).toBe("fallback");
    expect(result.reasons).toEqual(["errore provider AI"]);
    expect(errorSpy).toHaveBeenCalled();
  });
});
