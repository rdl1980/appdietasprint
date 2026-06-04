import type { MedicalScreeningFlag, UserProfile } from "./types";

const blockedHealthTopics: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /\b(diagnos|diagnosi|cura|curare|terapia|farmac|insulina|metformina)\b/i, reason: "richiesta medica o farmacologica" },
  { pattern: /\b(diabet|gravid|allatt|rene|renale|cardiac|bariatr|disturbo alimentare|anoress|bulimi)\b/i, reason: "condizione clinica da valutare con professionista" },
  { pattern: /\b(800|900)\s*kcal\b/i, reason: "target calorico molto restrittivo" },
];

const medicalFlagLabels: Record<MedicalScreeningFlag, string> = {
  pregnancy: "gravidanza",
  breastfeeding: "allattamento",
  diabetes: "diabete",
  eatingDisorder: "disturbi alimentari",
  kidneyDisease: "patologie renali",
  heartDisease: "patologie cardiache",
  bariatricSurgery: "chirurgia bariatrica",
  medications: "farmaci che influenzano peso o appetito",
};

export type HealthGuardrailResult = {
  allowed: boolean;
  reasons: string[];
  message?: string;
};

export function evaluateHealthPrompt(input: string, profile?: Pick<UserProfile, "medicalFlags" | "targetCalories">): HealthGuardrailResult {
  const reasons = blockedHealthTopics
    .filter((topic) => topic.pattern.test(input))
    .map((topic) => topic.reason);

  if (profile?.medicalFlags?.length) {
    reasons.push(...profile.medicalFlags.map((flag) => medicalFlagLabels[flag]));
  }

  if (profile?.targetCalories && profile.targetCalories < 1000) {
    reasons.push("target calorico molto restrittivo");
  }

  const uniqueReasons = [...new Set(reasons)];

  if (!uniqueReasons.length) {
    return { allowed: true, reasons: [] };
  }

  return {
    allowed: false,
    reasons: uniqueReasons,
    message: "DietaSprint AI non puo' generare indicazioni automatiche per questo caso: serve un medico, dietista o nutrizionista.",
  };
}

export function enforceHealthResponse(output: string): HealthGuardrailResult {
  const unsafeClaims = [
    /\b(guarisce|cura|risolve definitivamente|sostituisce il medico)\b/i,
    /\b(sospendi|interrompi|modifica).{0,40}\b(farmaco|terapia|insulina|metformina)\b/i,
  ];
  const reasons = unsafeClaims
    .filter((pattern) => pattern.test(output))
    .map(() => "claim medico non consentito");

  if (!reasons.length) {
    return { allowed: true, reasons: [] };
  }

  return {
    allowed: false,
    reasons: [...new Set(reasons)],
    message: "Risposta bloccata: contiene claim o istruzioni mediche non consentite.",
  };
}
