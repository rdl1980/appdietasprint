import { describe, expect, it } from "vitest";
import { isValidProfile, mealPlanToRow, profileToRow } from "./databaseMappers";
import type { MealPlan, UserProfile } from "./types";

const profile: UserProfile = {
  sex: "male",
  age: 42,
  heightCm: 178,
  weightKg: 84,
  activityLevel: "light",
  goal: "mild",
  dietType: "mediterranean",
  targetCalories: 1900,
  mealsPerDay: 4,
  excludedFoods: ["tonno"],
  simplicityLevel: "mealPrep",
  budgetMode: false,
};

describe("profileToRow", () => {
  it("maps profile fields to the database shape", () => {
    expect(profileToRow(profile, "user-1")).toEqual({
      user_id: "user-1",
      sex: "male",
      age: 42,
      height_cm: 178,
      weight_kg: 84,
      activity_level: "light",
      goal: "mild",
      diet_type: "mediterranean",
      target_calories: 1900,
      meals_per_day: 4,
      excluded_foods: ["tonno"],
      simplicity_level: "mealPrep",
      budget_mode: false,
    });
  });

  it("stores missing target calories as null", () => {
    expect(profileToRow({ ...profile, targetCalories: undefined }, "user-1").target_calories).toBeNull();
  });
});

describe("mealPlanToRow", () => {
  it("keeps plan json and top-level grocery/warnings fields separate", () => {
    const plan: MealPlan = {
      dailyCalories: 1800,
      days: [],
      groceryList: [{ name: "riso", grams: 200 }],
      warnings: ["warning"],
      calorieResult: {
        bmr: 1500,
        tdee: 2000,
        suggestedCalories: 1800,
        suggestedRange: [1710, 1890],
        warnings: ["warning"],
      },
    };

    expect(mealPlanToRow(plan, "user-1", "profile-1")).toEqual({
      user_id: "user-1",
      profile_id: "profile-1",
      daily_calories: 1800,
      plan: {
        days: [],
        calorieResult: plan.calorieResult,
      },
      grocery_list: [{ name: "riso", grams: 200 }],
      warnings: ["warning"],
    });
  });
});

describe("isValidProfile", () => {
  it("accepts a complete profile", () => {
    expect(isValidProfile(profile)).toBe(true);
  });

  it("does not require excluded foods or budget mode", () => {
    expect(isValidProfile({ ...profile, excludedFoods: [], budgetMode: false })).toBe(true);
  });

  it("rejects missing or zero required numeric fields", () => {
    expect(isValidProfile({ ...profile, age: 0 })).toBe(false);
    expect(isValidProfile({ ...profile, heightCm: 0 })).toBe(false);
    expect(isValidProfile({ ...profile, weightKg: 0 })).toBe(false);
    expect(isValidProfile({ ...profile, mealsPerDay: 0 })).toBe(false);
    expect(isValidProfile({ ...profile, dietType: undefined })).toBe(false);
  });
});
