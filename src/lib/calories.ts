import { ActivityLevel, CalorieResult, Goal, Sex, UserProfile } from "./types";

export const activityMultipliers: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
};

const deficitByGoal: Record<Goal, number> = {
  maintain: 0,
  mild: 0.15,
  standard: 0.2,
  aggressive: 0.25,
};

export function calculateBmr(profile: Pick<UserProfile, "sex" | "weightKg" | "heightCm" | "age">) {
  const base = 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age;
  return Math.round(profile.sex === "male" ? base + 5 : base - 161);
}

export function calculateCalories(profile: UserProfile): CalorieResult {
  const bmr = calculateBmr(profile);
  const tdee = Math.round(bmr * activityMultipliers[profile.activityLevel]);
  const deficit = deficitByGoal[profile.goal];
  const suggestedCalories = Math.round(tdee * (1 - deficit));
  const selectedCalories = profile.targetCalories || suggestedCalories;
  const rangeMin = Math.round(suggestedCalories * 0.95);
  const rangeMax = Math.round(suggestedCalories * 1.05);
  const warnings: string[] = [];

  if (selectedCalories < 1000) {
    warnings.push(
      "Attenzione forte: un target sotto 1000 kcal e' una dieta molto restrittiva e richiede supervisione professionale."
    );
  }

  if (profile.sex === "female" && selectedCalories < 1200) {
    warnings.push(
      "Il target e' sotto 1200 kcal: per molte donne puo' essere troppo basso senza valutazione di un professionista."
    );
  }

  if (profile.sex === "male" && selectedCalories < 1500) {
    warnings.push(
      "Il target e' sotto 1500 kcal: per molti uomini puo' essere troppo basso senza valutazione di un professionista."
    );
  }

  if (selectedCalories < 1000) {
    warnings.push(
      "DietaSprint AI non presenta piani da 800-900 kcal come raccomandazione generale."
    );
  }

  return {
    bmr,
    tdee,
    suggestedCalories,
    suggestedRange: [rangeMin, rangeMax],
    warnings,
  };
}
