import { describe, expect, it } from "vitest";
import { isValidProfile, mealPlanToRow, profileFromRow, profileRowColumns, profileToRow } from "./databaseMappers";
import { maleProfile as profile } from "../../tests/fixtures/profiles";
import type { MealPlan } from "./types";

describe("profileToRow", () => {
  it("maps profile fields to the database shape", () => {
    expect(profileToRow({ ...profile, allergyFlags: ["fish"], cookingTime: "quick" }, "user-1")).toEqual({
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
      medical_flags: [],
      allergy_flags: ["fish"],
      cooking_time: "quick",
    });
  });

  it("stores missing target calories as null and defaults optional preferences", () => {
    const row = profileToRow({ ...profile, targetCalories: undefined, allergyFlags: undefined, medicalFlags: undefined, cookingTime: undefined }, "user-1");

    expect(row.target_calories).toBeNull();
    expect(row.allergy_flags).toEqual([]);
    expect(row.medical_flags).toEqual([]);
    expect(row.cooking_time).toBe("standard");
  });
});

describe("profileFromRow", () => {
  it("maps database rows back to planner profile shape", () => {
    expect(
      profileFromRow({
        sex: "male",
        age: 42,
        height_cm: 178,
        weight_kg: "84.5",
        activity_level: "light",
        goal: "mild",
        diet_type: "mediterranean",
        target_calories: null,
        meals_per_day: 4,
        excluded_foods: ["tonno"],
        simplicity_level: "mealPrep",
        budget_mode: true,
        medical_flags: ["diabetes"],
        allergy_flags: ["nuts"],
        cooking_time: "batch",
      }),
    ).toEqual({
      ...profile,
      weightKg: 84.5,
      targetCalories: undefined,
      budgetMode: true,
      medicalFlags: ["diabetes"],
      allergyFlags: ["nuts"],
      cookingTime: "batch",
    });
  });

  it("tolerates legacy rows without the preference columns", () => {
    const mapped = profileFromRow({
      sex: "female",
      age: 30,
      height_cm: 160,
      weight_kg: 60,
      activity_level: "sedentary",
      goal: "maintain",
      diet_type: "balanced",
      target_calories: 1500,
      meals_per_day: 3,
      excluded_foods: null,
      simplicity_level: "standard",
      budget_mode: false,
    });

    expect(mapped.excludedFoods).toEqual([]);
    expect(mapped.medicalFlags).toEqual([]);
    expect(mapped.allergyFlags).toEqual([]);
    expect(mapped.cookingTime).toBe("standard");
  });

  it("round-trips a profile through row and back", () => {
    const row = profileToRow(profile, "user-1");
    const { user_id: _userId, ...columns } = row;
    void _userId;
    expect(profileFromRow(columns)).toEqual(profile);
  });

  it("exposes a column list covering every mapped field", () => {
    for (const column of ["medical_flags", "allergy_flags", "cooking_time", "excluded_foods", "target_calories"]) {
      expect(profileRowColumns).toContain(column);
    }
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
      macroTarget: {
        proteinPercent: [20, 25],
        carbsPercent: [40, 50],
        fatsPercent: [25, 35],
        proteinGrams: [90, 113],
        carbsGrams: [180, 225],
        fatsGrams: [50, 70],
        note: "Macro note",
      },
    };

    expect(mealPlanToRow(plan, "user-1", "profile-1", profile)).toEqual({
      user_id: "user-1",
      profile_id: "profile-1",
      daily_calories: 1800,
      plan: {
        days: [],
        calorieResult: plan.calorieResult,
        macroTarget: plan.macroTarget,
        profile,
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
    expect(isValidProfile(null)).toBe(false);
    expect(isValidProfile(undefined)).toBe(false);
    expect(isValidProfile({ ...profile, age: 0 })).toBe(false);
    expect(isValidProfile({ ...profile, heightCm: 0 })).toBe(false);
    expect(isValidProfile({ ...profile, weightKg: 0 })).toBe(false);
    expect(isValidProfile({ ...profile, mealsPerDay: 0 })).toBe(false);
    expect(isValidProfile({ ...profile, dietType: undefined })).toBe(false);
  });
});
