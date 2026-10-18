import type {
  ActivityLevel,
  AllergyFlag,
  CookingTimePreference,
  DietType,
  Goal,
  MedicalScreeningFlag,
  Sex,
  SimplicityLevel,
  UserProfile,
} from "./types";

/**
 * Server-side profile validation. Mirrors the database CHECK constraints in
 * supabase/migrations so that invalid input returns a 400 instead of a 500.
 */

export const profileLimits = {
  age: { min: 18, max: 100 },
  heightCm: { min: 120, max: 230 },
  weightKg: { min: 35, max: 250 },
  mealsPerDay: { min: 2, max: 5 },
  targetCalories: { min: 800, max: 6000 },
  excludedFoodsMax: 40,
  excludedFoodLengthMax: 40,
} as const;

const sexValues = new Set<Sex>(["male", "female"]);
const activityValues = new Set<ActivityLevel>(["sedentary", "light", "moderate", "active"]);
const goalValues = new Set<Goal>(["mild", "standard", "aggressive", "maintain"]);
const dietValues = new Set<DietType>(["ketogenic", "mediterranean", "lowCarb", "balanced", "vegetarian"]);
const simplicityValues = new Set<SimplicityLevel>(["zeroSbatti", "standard", "mealPrep"]);
const medicalValues = new Set<MedicalScreeningFlag>([
  "pregnancy",
  "breastfeeding",
  "diabetes",
  "eatingDisorder",
  "kidneyDisease",
  "heartDisease",
  "bariatricSurgery",
  "medications",
]);
const allergyValues = new Set<AllergyFlag>(["gluten", "lactose", "eggs", "fish", "soy", "nuts"]);
const cookingTimeValues = new Set<CookingTimePreference>(["ready", "quick", "standard", "batch"]);

export type ProfileValidationResult =
  | { ok: true; profile: UserProfile }
  | { ok: false; errors: string[] };

function isInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function inRange(value: number, range: { min: number; max: number }) {
  return value >= range.min && value <= range.max;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function validateProfile(input: unknown): ProfileValidationResult {
  const errors: string[] = [];

  if (!input || typeof input !== "object") {
    return { ok: false, errors: ["Profilo mancante."] };
  }

  const candidate = input as Record<string, unknown>;

  if (!sexValues.has(candidate.sex as Sex)) errors.push("Sesso non valido.");
  if (!isInteger(candidate.age) || !inRange(candidate.age, profileLimits.age)) {
    errors.push(`Eta' fuori range (${profileLimits.age.min}-${profileLimits.age.max}).`);
  }
  if (!isInteger(candidate.heightCm) || !inRange(candidate.heightCm, profileLimits.heightCm)) {
    errors.push(`Altezza fuori range (${profileLimits.heightCm.min}-${profileLimits.heightCm.max} cm).`);
  }
  if (!isFiniteNumber(candidate.weightKg) || !inRange(candidate.weightKg, profileLimits.weightKg)) {
    errors.push(`Peso fuori range (${profileLimits.weightKg.min}-${profileLimits.weightKg.max} kg).`);
  }
  if (!activityValues.has(candidate.activityLevel as ActivityLevel)) errors.push("Livello attivita' non valido.");
  if (!goalValues.has(candidate.goal as Goal)) errors.push("Obiettivo non valido.");
  if (!dietValues.has(candidate.dietType as DietType)) errors.push("Tipo dieta non valido.");
  if (!isInteger(candidate.mealsPerDay) || !inRange(candidate.mealsPerDay, profileLimits.mealsPerDay)) {
    errors.push(`Pasti al giorno fuori range (${profileLimits.mealsPerDay.min}-${profileLimits.mealsPerDay.max}).`);
  }
  if (!simplicityValues.has(candidate.simplicityLevel as SimplicityLevel)) errors.push("Livello semplicita' non valido.");
  if (typeof candidate.budgetMode !== "boolean") errors.push("Modalita' budget non valida.");

  if (candidate.targetCalories !== undefined && candidate.targetCalories !== null) {
    if (!isInteger(candidate.targetCalories) || !inRange(candidate.targetCalories, profileLimits.targetCalories)) {
      errors.push(`Target calorie fuori range (${profileLimits.targetCalories.min}-${profileLimits.targetCalories.max}).`);
    }
  }

  if (!isStringArray(candidate.excludedFoods)) {
    errors.push("Cibi esclusi non validi.");
  } else if (
    candidate.excludedFoods.length > profileLimits.excludedFoodsMax ||
    candidate.excludedFoods.some((food) => food.length > profileLimits.excludedFoodLengthMax)
  ) {
    errors.push("Troppi cibi esclusi o voci troppo lunghe.");
  }

  if (candidate.medicalFlags !== undefined) {
    if (!isStringArray(candidate.medicalFlags) || candidate.medicalFlags.some((flag) => !medicalValues.has(flag as MedicalScreeningFlag))) {
      errors.push("Screening salute non valido.");
    }
  }

  if (candidate.allergyFlags !== undefined) {
    if (!isStringArray(candidate.allergyFlags) || candidate.allergyFlags.some((flag) => !allergyValues.has(flag as AllergyFlag))) {
      errors.push("Allergie non valide.");
    }
  }

  if (candidate.cookingTime !== undefined && !cookingTimeValues.has(candidate.cookingTime as CookingTimePreference)) {
    errors.push("Tempo cucina non valido.");
  }

  if (errors.length) {
    return { ok: false, errors };
  }

  const profile: UserProfile = {
    sex: candidate.sex as Sex,
    age: candidate.age as number,
    heightCm: candidate.heightCm as number,
    weightKg: candidate.weightKg as number,
    activityLevel: candidate.activityLevel as ActivityLevel,
    goal: candidate.goal as Goal,
    dietType: candidate.dietType as DietType,
    targetCalories: candidate.targetCalories == null ? undefined : (candidate.targetCalories as number),
    mealsPerDay: candidate.mealsPerDay as number,
    excludedFoods: (candidate.excludedFoods as string[]).map((food) => food.trim()).filter(Boolean),
    simplicityLevel: candidate.simplicityLevel as SimplicityLevel,
    budgetMode: candidate.budgetMode as boolean,
    medicalFlags: [...new Set((candidate.medicalFlags as MedicalScreeningFlag[] | undefined) || [])],
    allergyFlags: [...new Set((candidate.allergyFlags as AllergyFlag[] | undefined) || [])],
    cookingTime: (candidate.cookingTime as CookingTimePreference | undefined) || "standard",
  };

  return { ok: true, profile };
}
