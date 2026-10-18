import { extractJsonObject, generateAiText, isAiConfigured } from "./provider";
import { calculateCalories } from "../calories";
import { buildGroceryList, generateMealPlan } from "../generateMealPlan";
import { enforceHealthResponse } from "../healthGuardrails";
import { getMacroTarget } from "../macroTargets";
import { getMedicalReviewWarning } from "../medicalScreening";
import { excludedFoodsFromAllergies } from "../plannerPreferences";
import type { DietType, Ingredient, MealPlan, MealPlanDay, MealType, PlannedMeal, UserProfile } from "../types";

/**
 * AI-assisted meal plan generation.
 *
 * The model is asked for a compact JSON plan. Everything it returns is
 * validated against the planner schema, re-totalled locally and checked by the
 * health guardrails. When the provider is not configured, the answer is empty
 * or invalid, the deterministic template generator is used instead.
 */

export type AiMealPlanResult = {
  plan: MealPlan;
  source: "ai" | "fallback";
  reasons: string[];
};

type AiMealPlanOptions = {
  days?: number;
};

const dayNames = ["Lunedi", "Martedi", "Mercoledi", "Giovedi", "Venerdi", "Sabato", "Domenica"];
const mealTypes = new Set<MealType>(["breakfast", "lunch", "dinner", "snack"]);

const slotByMealsPerDay: Record<number, MealType[]> = {
  2: ["lunch", "dinner"],
  3: ["breakfast", "lunch", "dinner"],
  4: ["breakfast", "lunch", "snack", "dinner"],
  5: ["breakfast", "snack", "lunch", "snack", "dinner"],
};

export const mealPlanSystemPrompt = `
Sei il motore di pianificazione pasti di Diet Sprint AI. Produci piani alimentari realistici, italiani, pratici.
Regole obbligatorie:
- Rispetta il target calorico giornaliero con tolleranza del 5%.
- Rispetta il tipo di dieta e le tendenze macro indicate.
- Non usare mai gli ingredienti esclusi o legati alle allergie indicate.
- Nessuna diagnosi, nessun farmaco, nessun claim medico, nessun digiuno estremo.
- Ogni pasto ha nome breve, ingredienti con grammi, calorie e macro in grammi.
- Rispondi SOLO con JSON valido nel formato:
{"days":[{"meals":[{"name":"...","mealType":"breakfast|lunch|dinner|snack","ingredients":[{"name":"...","grams":120}],"calories":400,"protein":25,"carbs":40,"fats":12,"tags":["semplice"]}]}]}
`.trim();

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function parseIngredient(value: unknown): Ingredient | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;

  if (typeof candidate.name !== "string" || !candidate.name.trim() || !isNonNegativeNumber(candidate.grams) || candidate.grams <= 0) {
    return null;
  }

  return { name: candidate.name.trim().slice(0, 60), grams: Math.round(candidate.grams) };
}

function parseMeal(value: unknown, day: number, index: number, dietType: DietType): PlannedMeal | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const ingredients = Array.isArray(candidate.ingredients)
    ? candidate.ingredients.map(parseIngredient).filter((ingredient): ingredient is Ingredient => ingredient !== null)
    : [];

  if (
    typeof candidate.name !== "string" ||
    !candidate.name.trim() ||
    !mealTypes.has(candidate.mealType as MealType) ||
    !ingredients.length ||
    !isNonNegativeNumber(candidate.calories) ||
    candidate.calories <= 0 ||
    !isNonNegativeNumber(candidate.protein) ||
    !isNonNegativeNumber(candidate.carbs) ||
    !isNonNegativeNumber(candidate.fats)
  ) {
    return null;
  }

  const name = candidate.name.trim().slice(0, 80);
  const tags = Array.isArray(candidate.tags)
    ? candidate.tags.filter((tag): tag is string => typeof tag === "string").map((tag) => tag.slice(0, 24)).slice(0, 6)
    : [];

  return {
    id: `ai-${day}-${index}-${slugify(name)}`,
    name,
    mealType: candidate.mealType as MealType,
    dietTypes: [dietType],
    ingredients,
    calories: Math.round(candidate.calories),
    protein: Math.round(candidate.protein),
    carbs: Math.round(candidate.carbs),
    fats: Math.round(candidate.fats),
    tags,
    day,
  };
}

function hasExcludedIngredient(meal: PlannedMeal, excludedFoods: string[]) {
  const normalized = excludedFoods.map((food) => food.trim().toLowerCase()).filter(Boolean);
  return meal.ingredients.some((ingredient) => normalized.some((food) => ingredient.name.toLowerCase().includes(food)));
}

export type ParsedAiPlan = { days: MealPlanDay[]; reasons: string[] };

/**
 * Validates a raw model answer against the planner schema. Returns null days
 * when the answer cannot be trusted; `reasons` explains why.
 */
export function parseAiMealPlanResponse(
  raw: unknown,
  profile: UserProfile,
  dailyCalories: number,
  expectedDays: number,
): ParsedAiPlan {
  const reasons: string[] = [];

  if (!raw || typeof raw !== "object" || !Array.isArray((raw as { days?: unknown }).days)) {
    return { days: [], reasons: ["risposta non in formato piano"] };
  }

  const rawDays = (raw as { days: unknown[] }).days.slice(0, expectedDays);
  const expectedSlots = slotByMealsPerDay[profile.mealsPerDay] || slotByMealsPerDay[3];
  const excludedFoods = [...profile.excludedFoods, ...excludedFoodsFromAllergies(profile.allergyFlags)];
  const days: MealPlanDay[] = [];

  rawDays.forEach((rawDay, dayIndex) => {
    const dayNumber = dayIndex + 1;
    const rawMeals = rawDay && typeof rawDay === "object" ? (rawDay as { meals?: unknown }).meals : null;
    const meals = Array.isArray(rawMeals)
      ? rawMeals.map((meal, index) => parseMeal(meal, dayNumber, index, profile.dietType)).filter((meal): meal is PlannedMeal => meal !== null)
      : [];

    if (meals.length !== expectedSlots.length) {
      reasons.push(`giorno ${dayNumber}: ${meals.length} pasti validi invece di ${expectedSlots.length}`);
      return;
    }

    const excluded = meals.filter((meal) => hasExcludedIngredient(meal, excludedFoods));

    if (excluded.length) {
      reasons.push(`giorno ${dayNumber}: ingredienti esclusi presenti (${excluded.map((meal) => meal.name).join(", ")})`);
      return;
    }

    const calories = meals.reduce((sum, meal) => sum + meal.calories, 0);

    if (Math.abs(calories - dailyCalories) > dailyCalories * 0.12) {
      reasons.push(`giorno ${dayNumber}: ${calories} kcal fuori tolleranza rispetto a ${dailyCalories}`);
      return;
    }

    const text = meals.map((meal) => `${meal.name} ${meal.tags.join(" ")}`).join(" ");
    const guardrail = enforceHealthResponse(text);

    if (!guardrail.allowed) {
      reasons.push(`giorno ${dayNumber}: ${guardrail.reasons.join(", ")}`);
      return;
    }

    days.push({
      day: dayNumber,
      label: dayNames[dayIndex],
      meals,
      calories,
      protein: meals.reduce((sum, meal) => sum + meal.protein, 0),
      carbs: meals.reduce((sum, meal) => sum + meal.carbs, 0),
      fats: meals.reduce((sum, meal) => sum + meal.fats, 0),
    });
  });

  if (days.length !== expectedDays) {
    reasons.push(`${days.length} giorni validi invece di ${expectedDays}`);
    return { days: [], reasons };
  }

  return { days, reasons };
}

export function buildMealPlanPrompt(profile: UserProfile, dailyCalories: number, days: number) {
  const macroTarget = getMacroTarget(profile.dietType, dailyCalories);
  const slots = slotByMealsPerDay[profile.mealsPerDay] || slotByMealsPerDay[3];

  return JSON.stringify({
    days,
    dailyCalories,
    mealSlotsPerDay: slots,
    dietType: profile.dietType,
    macroTargetGrams: {
      protein: macroTarget.proteinGrams,
      carbs: macroTarget.carbsGrams,
      fats: macroTarget.fatsGrams,
    },
    excludedFoods: [...profile.excludedFoods, ...excludedFoodsFromAllergies(profile.allergyFlags)],
    allergyFlags: profile.allergyFlags || [],
    simplicityLevel: profile.simplicityLevel,
    cookingTime: profile.cookingTime || "standard",
    budgetMode: profile.budgetMode,
  });
}

export async function generateAiMealPlan(profile: UserProfile, options: AiMealPlanOptions = {}): Promise<AiMealPlanResult> {
  const dayCount = Math.min(Math.max(options.days ?? 7, 1), 7);
  const fallback = () => ({ plan: generateMealPlan(profile, { days: dayCount }), source: "fallback" as const });

  if (!isAiConfigured()) {
    return { ...fallback(), reasons: ["provider AI non configurato"] };
  }

  const calorieResult = calculateCalories(profile);
  const dailyCalories = profile.targetCalories ?? calorieResult.suggestedCalories;

  let text = "";

  try {
    const result = await generateAiText({
      system: mealPlanSystemPrompt,
      user: buildMealPlanPrompt(profile, dailyCalories, dayCount),
      maxOutputTokens: Math.min(16000, 900 * dayCount + 600),
      json: true,
    });
    text = result.text;
  } catch (error) {
    console.error("ai_meal_plan_failed", { error: error instanceof Error ? error.message : error });
    return { ...fallback(), reasons: ["errore provider AI"] };
  }

  const parsed = parseAiMealPlanResponse(extractJsonObject(text), profile, dailyCalories, dayCount);

  if (!parsed.days.length) {
    return { ...fallback(), reasons: parsed.reasons };
  }

  const warnings = [...calorieResult.warnings];

  if (profile.dietType === "ketogenic") {
    warnings.push("La chetogenica e' molto restrittiva: valuta il percorso con un professionista, soprattutto se assumi farmaci o hai patologie.");
  }

  const medicalReviewWarning = getMedicalReviewWarning(profile.medicalFlags);

  if (medicalReviewWarning) {
    warnings.unshift(medicalReviewWarning);
  }

  return {
    plan: {
      days: parsed.days,
      dailyCalories,
      groceryList: buildGroceryList(parsed.days.flatMap((day) => day.meals)),
      warnings,
      calorieResult,
      macroTarget: getMacroTarget(profile.dietType, dailyCalories),
    },
    source: "ai",
    reasons: parsed.reasons,
  };
}
