import { calculateCalories } from "./calories";
import { mealTemplates } from "./mealTemplates";
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
  return score;
}

function selectMeal(slot: MealType, targetCalories: number, profile: UserProfile, day: number, slotIndex: number) {
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
  const pool = compatible.length > 0 ? compatible : fallback.length > 0 ? fallback : unrestricted;
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

function buildGroceryList(meals: PlannedMeal[]): GroceryItem[] {
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

export function generateMealPlan(profile: UserProfile): MealPlan {
  const calorieResult = calculateCalories(profile);
  const dailyCalories = profile.targetCalories || calorieResult.suggestedCalories;
  const slots = slotByMealsPerDay[profile.mealsPerDay] || slotByMealsPerDay[3];
  const slotTargets = distributeCalories(dailyCalories, slots);
  const warnings = [...calorieResult.warnings];

  if (profile.dietType === "ketogenic") {
    warnings.push("La chetogenica e' molto restrittiva: valuta il percorso con un professionista, soprattutto se assumi farmaci o hai patologie.");
  }

  const days = Array.from({ length: 7 }, (_, dayIndex) => {
    const meals = slots.map((slot, slotIndex) => ({
      ...selectMeal(slot, slotTargets[slotIndex], profile, dayIndex, slotIndex),
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
  };
}
