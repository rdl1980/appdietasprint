import { describe, expect, it } from "vitest";
import { enforceHealthResponse, evaluateHealthPrompt } from "./healthGuardrails";

describe("health guardrails", () => {
  it("allows ordinary adherence questions", () => {
    expect(evaluateHealthPrompt("Come organizzo la spesa della settimana?").allowed).toBe(true);
  });

  it("blocks medical and restrictive calorie prompts", () => {
    const result = evaluateHealthPrompt("Sono diabetico e voglio una dieta da 900 kcal");

    expect(result.allowed).toBe(false);
    expect(result.reasons.length).toBeGreaterThan(0);
    expect(result.message).toContain("nutrizionista");
  });

  it("blocks profiles with medical flags", () => {
    const result = evaluateHealthPrompt("Fammi un piano", { medicalFlags: ["pregnancy"] });

    expect(result.allowed).toBe(false);
    expect(result.reasons).toContain("gravidanza");
  });

  it("blocks unsafe AI responses", () => {
    const result = enforceHealthResponse("Questa dieta sostituisce il medico e cura il diabete.");

    expect(result.allowed).toBe(false);
    expect(result.message).toContain("bloccata");
  });
});
