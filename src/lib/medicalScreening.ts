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

export function getMedicalScreeningBlock(flags: MedicalScreeningFlag[] = []) {
  if (!flags.length) {
    return null;
  }

  return "Per i casi selezionati DietaSprint AI non genera un piano automatico: serve una valutazione personalizzata di medico, dietista o nutrizionista.";
}
