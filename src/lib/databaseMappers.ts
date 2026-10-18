import { AllergyFlag, CookingTimePreference, MealPlan, MedicalScreeningFlag, UserProfile } from "./types";

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
    target_calories: profile.targetCalories ?? null,
    meals_per_day: profile.mealsPerDay,
    excluded_foods: profile.excludedFoods,
    simplicity_level: profile.simplicityLevel,
    budget_mode: profile.budgetMode,
    medical_flags: profile.medicalFlags || [],
    allergy_flags: profile.allergyFlags || [],
    cooking_time: profile.cookingTime || "standard",
  };
}

export type ProfileRow = {
  sex: UserProfile["sex"];
  age: number;
  height_cm: number;
  weight_kg: number | string;
  activity_level: UserProfile["activityLevel"];
  goal: UserProfile["goal"];
  diet_type: UserProfile["dietType"];
  target_calories: number | null;
  meals_per_day: number;
  excluded_foods: string[] | null;
  simplicity_level: UserProfile["simplicityLevel"];
  budget_mode: boolean;
  medical_flags?: MedicalScreeningFlag[] | null;
  allergy_flags?: AllergyFlag[] | null;
  cooking_time?: CookingTimePreference | null;
};

export const profileRowColumns =
  "id,sex,age,height_cm,weight_kg,activity_level,goal,diet_type,target_calories,meals_per_day,excluded_foods,simplicity_level,budget_mode,medical_flags,allergy_flags,cooking_time,created_at";

export function profileFromRow(row: ProfileRow): UserProfile {
  return {
    sex: row.sex,
    age: row.age,
    heightCm: row.height_cm,
    weightKg: Number(row.weight_kg),
    activityLevel: row.activity_level,
    goal: row.goal,
    dietType: row.diet_type,
    targetCalories: row.target_calories ?? undefined,
    mealsPerDay: row.meals_per_day,
    excludedFoods: row.excluded_foods || [],
    simplicityLevel: row.simplicity_level,
    budgetMode: row.budget_mode,
    medicalFlags: row.medical_flags || [],
    allergyFlags: row.allergy_flags || [],
    cookingTime: row.cooking_time || "standard",
  };
}

export function mealPlanToRow(plan: MealPlan, userId: string, profileId: string, profile?: UserProfile) {
  return {
    user_id: userId,
    profile_id: profileId,
    daily_calories: plan.dailyCalories,
    plan: {
      days: plan.days,
      calorieResult: plan.calorieResult,
      macroTarget: plan.macroTarget,
      profile,
    },
    grocery_list: plan.groceryList,
    warnings: plan.warnings,
  };
}

export function isValidProfile(profile: Partial<UserProfile> | null | undefined) {
  return Boolean(
    profile &&
      profile.sex &&
      profile.age &&
      profile.heightCm &&
      profile.weightKg &&
      profile.activityLevel &&
      profile.goal &&
      profile.dietType &&
      profile.mealsPerDay &&
      profile.simplicityLevel,
  );
}
