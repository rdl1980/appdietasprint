import { describe, expect, it } from "vitest";
import { enforceHealthResponse, evaluateHealthPrompt } from "./healthGuardrails";
import { medicalScreeningOptions } from "./medicalScreening";

describe("evaluateHealthPrompt", () => {
  it.each([
    "Come organizzo la spesa della settimana?",
    "Ho fame alle 23, come gestisco lo spuntino?",
    "Quale pasto del piano posso preparare in 10 minuti?",
  ])("allows ordinary adherence question: %s", (question) => {
    expect(evaluateHealthPrompt(question)).toEqual({ allowed: true, reasons: [] });
  });

  it.each([
    ["Sono diabetico e voglio una dieta da 900 kcal", 2],
    ["Posso sospendere la metformina?", 1],
    ["Sono in gravidanza, adattami il deficit", 1],
    ["Mi serve una diagnosi per la mia fame", 1],
    ["Ho avuto un intervento di chirurgia bariatrica", 1],
  ])("blocks medical prompt '%s' with %d reason(s)", (question, reasonCount) => {
    const result = evaluateHealthPrompt(question);

    expect(result.allowed).toBe(false);
    expect(result.reasons).toHaveLength(reasonCount);
    expect(result.message).toContain("nutrizionista");
  });

  it("dedupes reasons", () => {
    const result = evaluateHealthPrompt("Diabete, diabete e ancora diabete");

    expect(result.reasons).toEqual(["condizione clinica da valutare con professionista"]);
  });

  it.each(medicalScreeningOptions.map((option) => option.value))("blocks profiles flagged with %s", (flag) => {
    const result = evaluateHealthPrompt("Fammi un piano", { medicalFlags: [flag] });

    expect(result.allowed).toBe(false);
    expect(result.reasons.length).toBe(1);
  });

  it("blocks profiles with very low explicit calorie targets", () => {
    expect(evaluateHealthPrompt("Fammi un piano", { targetCalories: 950 }).allowed).toBe(false);
    expect(evaluateHealthPrompt("Fammi un piano", { targetCalories: 1000 }).allowed).toBe(true);
  });
});

describe("enforceHealthResponse", () => {
  it("allows cautious practical answers", () => {
    expect(enforceHealthResponse("Aggiungi verdure a cena e tieni una quota proteica.").allowed).toBe(true);
  });

  it.each([
    "Questa dieta sostituisce il medico e cura il diabete.",
    "Sospendi la terapia e segui il piano.",
    "Interrompi l'insulina per una settimana.",
    "Questo piano guarisce la tiroide.",
  ])("blocks unsafe claim: %s", (answer) => {
    const result = enforceHealthResponse(answer);

    expect(result.allowed).toBe(false);
    expect(result.reasons).toEqual(["claim medico non consentito"]);
    expect(result.message).toContain("bloccata");
  });
});
