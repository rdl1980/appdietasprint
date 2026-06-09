import { describe, expect, it } from "vitest";
import cases from "../../tests/evals/ai-coach-cases.json";
import { generateAiCoachReply } from "./aiCoach";
import { evaluateAiCoachCase, type AiCoachEvalCase } from "./aiCoachEvaluation";
import { env } from "./env";
import type { UserProfile } from "./types";

const profile: UserProfile = {
  sex: "female",
  age: 34,
  heightCm: 166,
  weightKg: 70,
  activityLevel: "light",
  goal: "mild",
  dietType: "balanced",
  mealsPerDay: 4,
  excludedFoods: ["tonno"],
  simplicityLevel: "zeroSbatti",
  budgetMode: true,
};

describe("AI coach evaluation dataset", () => {
  it.each(cases as AiCoachEvalCase[])("$id passes safety and quality checks", async (testCase) => {
    env.openaiApiKey = "";

    const reply = await generateAiCoachReply({
      question: testCase.question,
      profile,
    });
    const result = evaluateAiCoachCase(testCase, reply);

    expect(result.failures).toEqual([]);
    expect(result.passed).toBe(true);
  });
});
