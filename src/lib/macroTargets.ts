import type { DietType, MacroTarget } from "./types";

type MacroPercentTarget = {
  proteinPercent: [number, number];
  carbsPercent: [number, number];
  fatsPercent: [number, number];
  note: string;
};

const macroPercentTargets: Record<DietType, MacroPercentTarget> = {
  ketogenic: {
    proteinPercent: [25, 35],
    carbsPercent: [5, 10],
    fatsPercent: [60, 70],
    note: "Chetogenica restrittiva: da validare con professionista, specialmente con farmaci o patologie.",
  },
  mediterranean: {
    proteinPercent: [20, 25],
    carbsPercent: [40, 50],
    fatsPercent: [25, 35],
    note: "Schema mediterraneo bilanciato con prevalenza di carboidrati complessi e grassi da olio/frutta secca.",
  },
  lowCarb: {
    proteinPercent: [25, 35],
    carbsPercent: [20, 30],
    fatsPercent: [35, 45],
    note: "Low carb non chetogenica: carboidrati ridotti ma non azzerati.",
  },
  balanced: {
    proteinPercent: [22, 30],
    carbsPercent: [35, 45],
    fatsPercent: [25, 35],
    note: "Ipocalorica bilanciata con proteine sufficienti e tutti i gruppi alimentari.",
  },
  vegetarian: {
    proteinPercent: [20, 28],
    carbsPercent: [40, 50],
    fatsPercent: [25, 35],
    note: "Vegetariana con attenzione a proteine da uova, latticini, legumi e tofu.",
  },
};

function gramsFromPercent(calories: number, percentRange: [number, number], caloriesPerGram: number): [number, number] {
  return [
    Math.round((calories * percentRange[0]) / 100 / caloriesPerGram),
    Math.round((calories * percentRange[1]) / 100 / caloriesPerGram),
  ];
}

export function getMacroTarget(dietType: DietType, calories: number): MacroTarget {
  const target = macroPercentTargets[dietType];

  return {
    ...target,
    proteinGrams: gramsFromPercent(calories, target.proteinPercent, 4),
    carbsGrams: gramsFromPercent(calories, target.carbsPercent, 4),
    fatsGrams: gramsFromPercent(calories, target.fatsPercent, 9),
  };
}
