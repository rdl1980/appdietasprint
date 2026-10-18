import type { MedicalScreeningFlag } from "./types";

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

export function getMedicalReviewWarning(flags: MedicalScreeningFlag[] = []) {
  if (!flags.length) {
    return null;
  }

  const selectedLabels = flags
    .map((flag) => medicalScreeningOptions.find((option) => option.value === flag)?.label)
    .filter(Boolean)
    .join(", ");

  return `Review medica necessaria prima di seguire questo piano. Hai indicato: ${selectedLabels}. Diet Sprint AI puo' generare una bozza orientativa, ma deve essere rivista da medico, dietista o nutrizionista prima dell'uso.`;
}
