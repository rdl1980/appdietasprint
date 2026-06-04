import { calculateCalories } from "./calories";
import { getMacroTarget } from "./macroTargets";
import { mealTemplates } from "./mealTemplates";
import { excludedFoodsFromAllergies } from "./plannerPreferences";
import { GroceryItem, Meal, MealPlan, MealType, PlannedMeal, UserProfile } from "./types";

const dayNames = ["Lunedi", "Martedi", "Mercoledi", "Giovedi", "Venerdi", "Sabato", "Domenica"];

const slotByMealsPerDay: Record<number, MealType[]> = {
  2: ["lunch", "dinner"],
  3: ["breakfast", "lunch", "dinner"],
  4: ["breakfast", "lunch", "snack", "dinner"],
  5: ["breakfast", "snack", "lunch", "snack", "dinner"],
};

function hasExcludedIngredient(meal: Meal, excludedFoods: string[]) {
  const normalizedExcluded = excludedFoods.map((food) => food.trim().toLowerCase()).filter(Boolean);
  return meal.ingredients.some((ingredient) =>
    normalizedExcluded.some((excluded) => ingredient.name.toLowerCase().includes(excluded))
  );
}

function scoreMeal(meal: Meal, targetCalories: number, profile: UserProfile, index: number) {
  let score = Math.abs(meal.calories - targetCalories) + index * 2;
  if (profile.budgetMode && meal.tags.includes("budget")) score -= 80;
  if (profile.simplicityLevel === "zeroSbatti" && meal.tags.includes("zeroSbatti")) score -= 70;
  if (profile.simplicityLevel === "mealPrep" && meal.tags.includes("meal prep")) score -= 70;
  if (profile.cookingTime === "ready" && meal.tags.includes("zeroSbatti")) score -= 80;
  if (profile.cookingTime === "quick" && meal.tags.includes("semplice")) score -= 60;
  if (profile.cookingTime === "batch" && meal.tags.includes("meal prep")) score -= 80;
  return score;
}

function getMealPool(slot: MealType, profile: UserProfile) {
  const compatible = mealTemplates.filter(
    (meal) =>
      meal.mealType === slot &&
      meal.dietTypes.includes(profile.dietType) &&
      !hasExcludedIngredient(meal, profile.excludedFoods)
  );

  const fallback = mealTemplates.filter(
    (meal) => meal.mealType === slot && !hasExcludedIngredient(meal, profile.excludedFoods)
  );

  const unrestricted = mealTemplates.filter((meal) => meal.mealType === slot);
  return compatible.length > 0 ? compatible : fallback.length > 0 ? fallback : unrestricted;
}

function selectMeal(slot: MealType, targetCalories: number, profile: UserProfile, day: number, slotIndex: number) {
  const pool = getMealPool(slot, profile);
  const offset = day + slotIndex;

  return [...pool]
    .sort((a, b) => scoreMeal(a, targetCalories, profile, offset) - scoreMeal(b, targetCalories, profile, offset))
    [offset % pool.length];
}

function distributeCalories(dailyCalories: number, slots: MealType[]) {
  const ratios: Record<MealType, number> = {
    breakfast: 0.24,
    lunch: 0.35,
    dinner: 0.33,
    snack: slots.filter((slot) => slot === "snack").length > 1 ? 0.08 : 0.12,
  };

  const totalRatio = slots.reduce((sum, slot) => sum + ratios[slot], 0);
  return slots.map((slot) => Math.round((dailyCalories * ratios[slot]) / totalRatio));
}

export function buildGroceryList(meals: PlannedMeal[]): GroceryItem[] {
  const groceryMap = new Map<string, number>();

  meals.forEach((meal) => {
    meal.ingredients.forEach((ingredient) => {
      groceryMap.set(ingredient.name, (groceryMap.get(ingredient.name) || 0) + ingredient.grams);
    });
  });

  return [...groceryMap.entries()]
    .map(([name, grams]) => ({ name, grams }))
    .sort((a, b) => a.name.localeCompare(b.name, "it"));
}

function refreshDayTotals(day: MealPlan["days"][number]) {
  return {
    ...day,
    calories: day.meals.reduce((sum, meal) => sum + meal.calories, 0),
    protein: day.meals.reduce((sum, meal) => sum + meal.protein, 0),
    carbs: day.meals.reduce((sum, meal) => sum + meal.carbs, 0),
    fats: day.meals.reduce((sum, meal) => sum + meal.fats, 0),
  };
}

function normalizeProfile(profile: UserProfile): UserProfile {
  return {
    ...profile,
    excludedFoods: [...profile.excludedFoods, ...excludedFoodsFromAllergies(profile.allergyFlags)],
  };
}

export function getMealSubstitutions(meal: Meal, profile: UserProfile, limit = 3) {
  const normalizedProfile = normalizeProfile(profile);

  return getMealPool(meal.mealType, normalizedProfile)
    .filter((candidate) => candidate.id !== meal.id)
    .sort((a, b) => Math.abs(a.calories - meal.calories) - Math.abs(b.calories - meal.calories))
    .slice(0, limit);
}

export function regenerateMeal(plan: MealPlan, profile: UserProfile, dayNumber: number, mealIndex: number): MealPlan {
  const dayIndex = plan.days.findIndex((day) => day.day === dayNumber);

  if (dayIndex < 0) {
    return plan;
  }

  const day = plan.days[dayIndex];
  const currentMeal = day.meals[mealIndex];

  if (!currentMeal) {
    return plan;
  }

  const replacements = getMealSubstitutions(currentMeal, profile, 8);
  const replacement = replacements[(dayNumber + mealIndex) % Math.max(replacements.length, 1)];

  if (!replacement) {
    return plan;
  }

  const nextMeals = day.meals.map((meal, index) =>
    index === mealIndex ? { ...replacement, day: day.day } : meal,
  );
  const nextDays = plan.days.map((currentDay, index) =>
    index === dayIndex ? refreshDayTotals({ ...currentDay, meals: nextMeals }) : currentDay,
  );

  return {
    ...plan,
    days: nextDays,
    groceryList: buildGroceryList(nextDays.flatMap((nextDay) => nextDay.meals)),
  };
}

export function generateMealPlan(profile: UserProfile): MealPlan {
  const normalizedProfile = normalizeProfile(profile);
  const calorieResult = calculateCalories(normalizedProfile);
  const dailyCalories = normalizedProfile.targetCalories ?? calorieResult.suggestedCalories;
  const slots = slotByMealsPerDay[normalizedProfile.mealsPerDay] || slotByMealsPerDay[3];
  const slotTargets = distributeCalories(dailyCalories, slots);
  const warnings = [...calorieResult.warnings];

  if (normalizedProfile.dietType === "ketogenic") {
    warnings.push("La chetogenica e' molto restrittiva: valuta il percorso con un professionista, soprattutto se assumi farmaci o hai patologie.");
  }

  const days = Array.from({ length: 7 }, (_, dayIndex) => {
    const meals = slots.map((slot, slotIndex) => ({
      ...selectMeal(slot, slotTargets[slotIndex], normalizedProfile, dayIndex, slotIndex),
      day: dayIndex + 1,
    }));

    return {
      day: dayIndex + 1,
      label: dayNames[dayIndex],
      meals,
      calories: meals.reduce((sum, meal) => sum + meal.calories, 0),
      protein: meals.reduce((sum, meal) => sum + meal.protein, 0),
      carbs: meals.reduce((sum, meal) => sum + meal.carbs, 0),
      fats: meals.reduce((sum, meal) => sum + meal.fats, 0),
    };
  });

  return {
    days,
    dailyCalories,
    groceryList: buildGroceryList(days.flatMap((day) => day.meals)),
    warnings,
    calorieResult,
    macroTarget: getMacroTarget(normalizedProfile.dietType, dailyCalories),
  };
}
