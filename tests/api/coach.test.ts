import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setAiTextGeneratorForTests } from "@/lib/ai/provider";
import { generateMealPlan } from "@/lib/generateMealPlan";
import { baseProfile } from "../fixtures/profiles";
import { freeUser, jsonRequest, premiumUser, type AuthScenario } from "./helpers";

const scenario: AuthScenario = {};

vi.mock("@/lib/supabase/data", () => ({
  createAuthenticatedSupabaseClient: vi.fn(async () => ({ supabase: null, user: scenario.user ?? null, mode: null, unavailableReason: null })),
  createSupabaseAdminClient: vi.fn(async () => null),
  getAuthenticatedUser: vi.fn(async () => scenario.user ?? null),
}));

const { POST, coachQuestionLimits } = await import("@/app/api/coach/route");

beforeEach(() => {
  scenario.user = premiumUser;
});

afterEach(() => {
  setAiTextGeneratorForTests(null);
});

describe("POST /api/coach", () => {
  it("requires login", async () => {
    scenario.user = null;

    const response = await POST(jsonRequest("/api/coach", { question: "Come gestisco la fame serale?" }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ loginUrl: expect.any(String) });
  });

  it("requires premium", async () => {
    scenario.user = freeUser;

    const response = await POST(jsonRequest("/api/coach", { question: "Come gestisco la fame serale?" }));

    expect(response.status).toBe(402);
  });

  it("rejects questions outside the length limits", async () => {
    const short = await POST(jsonRequest("/api/coach", { question: "ciao" }));
    const long = await POST(jsonRequest("/api/coach", { question: "x".repeat(coachQuestionLimits.max + 1) }));
    const missing = await POST(jsonRequest("/api/coach", {}));

    expect(short.status).toBe(400);
    expect(long.status).toBe(400);
    expect(missing.status).toBe(400);
  });

  it("rejects invalid profiles and plans", async () => {
    const badProfile = await POST(jsonRequest("/api/coach", { question: "Come gestisco la fame serale?", profile: { ...baseProfile, age: 3 } }));
    const badPlan = await POST(jsonRequest("/api/coach", { question: "Come gestisco la fame serale?", plan: { days: [] } }));

    expect(badProfile.status).toBe(400);
    await expect(badProfile.json()).resolves.toEqual({ error: "Profilo non valido." });
    expect(badPlan.status).toBe(400);
    await expect(badPlan.json()).resolves.toEqual({ error: "Piano non valido." });
  });

  it("answers with the deterministic fallback when no provider is configured", async () => {
    const response = await POST(jsonRequest("/api/coach", { question: "Come gestisco la fame serale?", profile: baseProfile, plan: generateMealPlan(baseProfile, { days: 1 }) }));

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toMatchObject({ blocked: false, fallback: true, answer: expect.stringContaining("professionista") });
  });

  it("blocks medical questions", async () => {
    const response = await POST(jsonRequest("/api/coach", { question: "Posso sospendere la metformina?" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ blocked: true, reasons: expect.arrayContaining([expect.any(String)]) });
  });

  it("returns the provider answer when configured", async () => {
    setAiTextGeneratorForTests(async () => ({ text: "Aggiungi verdure.", provider: "anthropic", model: "t" }));

    const response = await POST(jsonRequest("/api/coach", { question: "Come gestisco la fame serale?" }));

    await expect(response.json()).resolves.toEqual({ answer: "Aggiungi verdure.", blocked: false, fallback: false, reasons: [] });
  });

  it("returns 500 when the provider throws", async () => {
    setAiTextGeneratorForTests(async () => {
      throw new Error("down");
    });
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await POST(jsonRequest("/api/coach", { question: "Come gestisco la fame serale?" }));

    expect(response.status).toBe(500);
  });
});
