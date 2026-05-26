import { MealPlan, UserProfile } from "./types";

export function profileToRow(profile: UserProfile, userId: string) {
  return {
    user_id: userId,
    sex: profile.sex,
    age: profile.age,
    height_cm: profile.heightCm,
    weight_kg: profile.weightKg,
    activity_level: profile.activityLevel,
    goal: profile.goal,
    diet_type: profile.dietType,
    target_calories: profile.targetCalories || null,
    meals_per_day: profile.mealsPerDay,
    excluded_foods: profile.excludedFoods,
    simplicity_level: profile.simplicityLevel,
    budget_mode: profile.budgetMode,
  };
}

export function mealPlanToRow(plan: MealPlan, userId: string, profileId: string) {
  return {
    user_id: userId,
    profile_id: profileId,
    daily_calories: plan.dailyCalories,
    plan: {
      days: plan.days,
      calorieResult: plan.calorieResult,
    },
    grocery_list: plan.groceryList,
    warnings: plan.warnings,
  };
}

export function isValidProfile(profile: Partial<UserProfile>) {
  return Boolean(
    profile.sex &&
      profile.age &&
      profile.heightCm &&
      profile.weightKg &&
      profile.activityLevel &&
      profile.goal &&
      profile.dietType &&
      profile.mealsPerDay &&
      profile.simplicityLevel
  );
}
