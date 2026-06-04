import { describe, expect, it } from "vitest";
import { calculateBmr, calculateCalories } from "./calories";
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

  it("does not apply a deficit for maintenance", () => {
    const result = calculateCalories({ ...baseProfile, goal: "maintain" });

    expect(result.suggestedCalories).toBe(result.tdee);
  });

  it("uses explicit target calories for safety warnings", () => {
    const result = calculateCalories({ ...baseProfile, targetCalories: 900 });

    expect(result.suggestedCalories).toBe(1730);
    expect(result.warnings).toHaveLength(3);
  });

  it("does not warn at exact safety boundaries", () => {
    expect(calculateCalories({ ...baseProfile, targetCalories: 1200 }).warnings).toEqual([]);
    expect(calculateCalories({ ...baseProfile, sex: "male", targetCalories: 1500 }).warnings).toEqual([]);
    expect(calculateCalories({ ...baseProfile, targetCalories: 1000 }).warnings).toHaveLength(1);
  });
});
