import type { UserProfile } from "@/lib/types";

export const baseProfile: UserProfile = {
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
  medicalFlags: [],
  allergyFlags: [],
  cookingTime: "standard",
};

export const maleProfile: UserProfile = {
  ...baseProfile,
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
};

export const allDietTypes: UserProfile["dietType"][] = ["ketogenic", "mediterranean", "lowCarb", "balanced", "vegetarian"];
export const allMealCounts = [2, 3, 4, 5];
