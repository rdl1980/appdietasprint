import { describe, expect, it } from "vitest";
import { activityMultipliers, calculateBmr, calculateCalories } from "./calories";
import type { UserProfile } from "./types";

const baseProfile: UserProfile = {
  sex: "female",
  age: 35,
  heightCm: 165,
  weightKg: 70,
  activityLevel: "moderate",
  goal: "standard",
  dietType: "balanced",
  mealsPerDay: 3,
  excludedFoods: [],
  simplicityLevel: "standard",
  budgetMode: false,
};

describe("calculateBmr", () => {
  it("uses the Mifflin-St Jeor formula for women and men", () => {
    expect(calculateBmr({ sex: "female", age: 35, heightCm: 165, weightKg: 70 })).toBe(1395);
    expect(calculateBmr({ sex: "male", age: 35, heightCm: 180, weightKg: 85 })).toBe(1805);
  });

  it("rounds to the nearest kcal", () => {
    expect(Number.isInteger(calculateBmr({ sex: "female", age: 29, heightCm: 171, weightKg: 63.3 }))).toBe(true);
  });
});

describe("calculateCalories", () => {
  it("calculates tdee, deficit and suggested range", () => {
    const result = calculateCalories(baseProfile);

    expect(result.bmr).toBe(1395);
    expect(result.tdee).toBe(2162);
    expect(result.suggestedCalories).toBe(1730);
    expect(result.suggestedRange).toEqual([1644, 1817]);
    expect(result.warnings).toEqual([]);
  });

  it.each([
    ["sedentary", 1.2],
    ["light", 1.375],
    ["moderate", 1.55],
    ["active", 1.725],
  ] as const)("applies the %s activity multiplier (%d)", (activityLevel, multiplier) => {
    expect(activityMultipliers[activityLevel]).toBe(multiplier);
    expect(calculateCalories({ ...baseProfile, activityLevel }).tdee).toBe(Math.round(1395 * multiplier));
  });

  it.each([
    ["maintain", 0],
    ["mild", 0.15],
    ["standard", 0.2],
    ["aggressive", 0.25],
  ] as const)("applies the %s deficit (%d)", (goal, deficit) => {
    const result = calculateCalories({ ...baseProfile, goal });

    expect(result.suggestedCalories).toBe(Math.round(result.tdee * (1 - deficit)));
  });

  it("does not apply a deficit for maintenance", () => {
    const result = calculateCalories({ ...baseProfile, goal: "maintain" });

    expect(result.suggestedCalories).toBe(result.tdee);
  });

  it("uses explicit target calories for safety warnings", () => {
    const result = calculateCalories({ ...baseProfile, targetCalories: 900 });

    expect(result.suggestedCalories).toBe(1730);
    expect(result.warnings).toHaveLength(3);
    expect(result.warnings[0]).toContain("Attenzione forte");
  });

  it("warns men below 1500 and women below 1200", () => {
    expect(calculateCalories({ ...baseProfile, sex: "male", targetCalories: 1400 }).warnings).toHaveLength(1);
    expect(calculateCalories({ ...baseProfile, sex: "female", targetCalories: 1400 }).warnings).toHaveLength(0);
    expect(calculateCalories({ ...baseProfile, sex: "female", targetCalories: 1100 }).warnings).toHaveLength(1);
  });

  it("does not warn at exact safety boundaries", () => {
    expect(calculateCalories({ ...baseProfile, targetCalories: 1200 }).warnings).toEqual([]);
    expect(calculateCalories({ ...baseProfile, sex: "male", targetCalories: 1500 }).warnings).toEqual([]);
    expect(calculateCalories({ ...baseProfile, targetCalories: 1000 }).warnings).toHaveLength(1);
  });
});
