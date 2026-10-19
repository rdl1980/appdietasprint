import { env } from "./env";
import type { MedicalScreeningFlag } from "./types";

export type MedicalScreeningMode = "warn" | "block";

export const medicalScreeningOptions: Array<{
  value: MedicalScreeningFlag;
  label: string;
}> = [
  { value: "pregnancy", label: "Gravidanza" },
  { value: "breastfeeding", label: "Allattamento" },
  { value: "diabetes", label: "Diabete o glicemia da monitorare" },
  { value: "eatingDisorder", label: "Storia di disturbi alimentari" },
  { value: "kidneyDisease", label: "Patologie renali" },
  { value: "heartDisease", label: "Patologie cardiache" },
  { value: "bariatricSurgery", label: "Chirurgia bariatrica" },
  { value: "medications", label: "Farmaci che influenzano peso o appetito" },
];

export const medicalScreeningBlockMessage =
  "Per i casi selezionati Diet Sprint AI non genera un piano automatico: serve una valutazione personalizzata di medico, dietista o nutrizionista.";

/**
 * Product decision pending legal/nutritionist review:
 * - "warn" (default): generate a draft plan with a prominent medical review warning.
 * - "block": refuse automatic generation and saving for profiles with screening flags.
 * Controlled by NEXT_PUBLIC_MEDICAL_SCREENING_MODE so it can be flipped without a code change.
 */
export function getMedicalScreeningMode(): MedicalScreeningMode {
  return env.medicalScreeningMode === "block" ? "block" : "warn";
}

export function selectedMedicalLabels(flags: MedicalScreeningFlag[] = []) {
  return flags
    .map((flag) => medicalScreeningOptions.find((option) => option.value === flag)?.label)
    .filter(Boolean)
    .join(", ");
}

/** Returns the blocking message when the mode is "block" and at least one flag is selected. */
export function getMedicalScreeningBlock(flags: MedicalScreeningFlag[] = []) {
  if (!flags.length || getMedicalScreeningMode() !== "block") {
    return null;
  }

  return `${medicalScreeningBlockMessage} Hai indicato: ${selectedMedicalLabels(flags)}.`;
}

/** Returns the review warning shown on generated drafts (any mode) when flags are selected. */
export function getMedicalReviewWarning(flags: MedicalScreeningFlag[] = []) {
  if (!flags.length) {
    return null;
  }

  return `Review medica necessaria prima di seguire questo piano. Hai indicato: ${selectedMedicalLabels(flags)}. Diet Sprint AI puo' generare una bozza orientativa, ma deve essere rivista da medico, dietista o nutrizionista prima dell'uso.`;
}
