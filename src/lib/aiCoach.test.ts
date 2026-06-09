import { describe, expect, it } from "vitest";
import { generateAiCoachReply } from "./aiCoach";
import { env } from "./env";
import type { UserProfile } from "./types";

const profile: UserProfile = {
  sex: "male",
  age: 38,
  heightCm: 178,
  weightKg: 82,
  activityLevel: "moderate",
  goal: "standard",
  dietType: "mediterranean",
  mealsPerDay: 3,
  excludedFoods: [],
  simplicityLevel: "standard",
  budgetMode: false,
};

describe("generateAiCoachReply", () => {
  it("uses the deterministic fallback when OpenAI is not configured", async () => {
    env.openaiApiKey = "";

    const reply = await generateAiCoachReply({
      question: "Come gestisco la fame dopo cena restando nel piano?",
      profile,
    });

    expect(reply.blocked).toBe(false);
    expect(reply.fallback).toBe(true);
    expect(reply.answer).toContain("professionista");
  });

  it("blocks medical or medication-related prompts before model generation", async () => {
    env.openaiApiKey = "";

    const reply = await generateAiCoachReply({
      question: "Posso sospendere la metformina se seguo questo piano?",
      profile,
    });

    expect(reply.blocked).toBe(true);
    expect(reply.fallback).toBe(false);
    expect(reply.reasons.length).toBeGreaterThan(0);
  });
});
