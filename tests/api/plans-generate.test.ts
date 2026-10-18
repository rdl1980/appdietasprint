import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setAiTextGeneratorForTests } from "@/lib/ai/provider";
import { baseProfile } from "../fixtures/profiles";
import { freeUser, jsonRequest, premiumUser, type AuthScenario } from "./helpers";

const scenario: AuthScenario = {};

vi.mock("@/lib/supabase/data", () => ({
  createAuthenticatedSupabaseClient: vi.fn(async () => ({ supabase: null, user: scenario.user ?? null, mode: null, unavailableReason: null })),
  createSupabaseAdminClient: vi.fn(async () => null),
  getAuthenticatedUser: vi.fn(async () => scenario.user ?? null),
}));

const { POST } = await import("@/app/api/plans/generate/route");

beforeEach(() => {
  scenario.user = premiumUser;
});

afterEach(() => {
  setAiTextGeneratorForTests(null);
});

describe("POST /api/plans/generate", () => {
  it("requires login", async () => {
    scenario.user = null;

    expect((await POST(jsonRequest("/api/plans/generate", { profile: baseProfile }))).status).toBe(401);
  });

  it("requires premium", async () => {
    scenario.user = freeUser;

    expect((await POST(jsonRequest("/api/plans/generate", { profile: baseProfile }))).status).toBe(402);
  });

  it("validates the profile", async () => {
    const response = await POST(jsonRequest("/api/plans/generate", { profile: { ...baseProfile, dietType: "paleo" } }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: expect.stringContaining("dieta") });
  });

  it("returns a fallback plan when no provider is configured and clamps days", async () => {
    const response = await POST(jsonRequest("/api/plans/generate", { profile: baseProfile, days: 99 }));

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.source).toBe("fallback");
    expect(payload.plan.days).toHaveLength(7);
  });

  it("defaults to seven days when days is missing or invalid", async () => {
    const response = await POST(jsonRequest("/api/plans/generate", { profile: baseProfile, days: "due" }));
    const payload = await response.json();

    expect(payload.plan.days).toHaveLength(7);
  });

  it("returns the AI plan when the provider answer validates", async () => {
    const day = {
      meals: [
        { name: "Colazione", mealType: "breakfast", ingredients: [{ name: "Avena", grams: 60 }], calories: 450, protein: 20, carbs: 60, fats: 12, tags: [] },
        { name: "Pranzo", mealType: "lunch", ingredients: [{ name: "Riso", grams: 80 }], calories: 720, protein: 35, carbs: 90, fats: 20, tags: [] },
        { name: "Cena", mealType: "dinner", ingredients: [{ name: "Ceci", grams: 150 }], calories: 630, protein: 30, carbs: 70, fats: 18, tags: [] },
      ],
    };
    setAiTextGeneratorForTests(async () => ({ text: JSON.stringify({ days: [day] }), provider: "anthropic", model: "t" }));

    const response = await POST(jsonRequest("/api/plans/generate", { profile: baseProfile, days: 1 }));
    const payload = await response.json();

    expect(payload.source).toBe("ai");
    expect(payload.plan.days[0].meals[1].name).toBe("Pranzo");
  });
});
