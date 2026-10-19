import { beforeEach, describe, expect, it, vi } from "vitest";
import { env } from "@/lib/env";
import { generateMealPlan } from "@/lib/generateMealPlan";
import { baseProfile } from "../fixtures/profiles";
import { createFakeSupabase, freeUser, jsonRequest, premiumUser, type AuthScenario } from "./helpers";

const scenario: AuthScenario = {};

vi.mock("@/lib/supabase/data", () => ({
  createAuthenticatedSupabaseClient: vi.fn(async () => ({
    supabase: scenario.supabase ?? null,
    user: scenario.user ?? null,
    mode: scenario.supabase ? "service" : null,
    unavailableReason: scenario.unavailableReason ?? (scenario.user ? "data_service_not_configured" : "unauthenticated"),
  })),
  createSupabaseAdminClient: vi.fn(async () => scenario.supabase ?? null),
  getAuthenticatedUser: vi.fn(async () => scenario.user ?? null),
}));

const { GET, POST, isValidPlanPayload } = await import("@/app/api/plans/route");

const plan = generateMealPlan(baseProfile, { days: 1 });

function configureSupabase() {
  env.supabaseUrl = "https://test.supabase.co";
  env.supabaseAnonKey = "anon";
}

beforeEach(() => {
  scenario.user = null;
  scenario.supabase = null;
  scenario.unavailableReason = null;
});

describe("GET /api/plans", () => {
  it("returns 503 when Supabase is not configured", async () => {
    const response = await GET(jsonRequest("/api/plans"));

    expect(response.status).toBe(503);
  });

  it("returns 401 with a login url for anonymous users", async () => {
    configureSupabase();

    const response = await GET(jsonRequest("/api/plans"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ loginUrl: expect.stringContaining("/login?from=") });
  });

  it("returns 402 for free users", async () => {
    configureSupabase();
    scenario.user = freeUser;

    const response = await GET(jsonRequest("/api/plans"));

    expect(response.status).toBe(402);
  });

  it("returns 503 when the data service is unavailable for a premium user", async () => {
    configureSupabase();
    scenario.user = premiumUser;
    scenario.unavailableReason = "data_service_not_configured";

    const response = await GET(jsonRequest("/api/plans"));

    expect(response.status).toBe(503);
  });

  it("lists plans for premium users", async () => {
    configureSupabase();
    scenario.user = premiumUser;
    scenario.supabase = createFakeSupabase({ meal_plans: { data: [{ id: "p1", daily_calories: 1800 }], error: null } });

    const response = await GET(jsonRequest("/api/plans"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ plans: [{ id: "p1", daily_calories: 1800 }] });
    expect(scenario.supabase.calls.find((call) => call.op === "eq")?.args).toEqual(["user_id", premiumUser.id]);
  });

  it("returns 500 when the query fails", async () => {
    configureSupabase();
    scenario.user = premiumUser;
    scenario.supabase = createFakeSupabase({ meal_plans: { data: null, error: { message: "boom" } } });
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await GET(jsonRequest("/api/plans"));

    expect(response.status).toBe(500);
  });
});

describe("POST /api/plans", () => {
  it("returns 503 when Supabase is not configured", async () => {
    const response = await POST(jsonRequest("/api/plans", { profile: baseProfile, plan, privacyConsent: true }));

    expect(response.status).toBe(503);
  });

  it("rejects malformed bodies", async () => {
    configureSupabase();

    const response = await POST(jsonRequest("/api/plans", "{broken"));

    expect(response.status).toBe(400);
  });

  it("requires privacy consent", async () => {
    configureSupabase();

    const response = await POST(jsonRequest("/api/plans", { profile: baseProfile, plan, privacyConsent: false }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: expect.stringContaining("Consenso privacy") });
  });

  it("validates the profile ranges before touching auth", async () => {
    configureSupabase();

    const response = await POST(jsonRequest("/api/plans", { profile: { ...baseProfile, age: 12 }, plan, privacyConsent: true }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: expect.stringContaining("Eta'") });
  });

  it("validates the plan payload", async () => {
    configureSupabase();

    const response = await POST(jsonRequest("/api/plans", { profile: baseProfile, plan: { days: [] }, privacyConsent: true }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Piano non valido." });
  });

  it("refuses flagged profiles with 422 only in block mode", async () => {
    configureSupabase();
    scenario.user = premiumUser;
    scenario.supabase = createFakeSupabase({
      user_profiles: { data: { id: "profile-1" }, error: null },
      meal_plans: { data: { id: "plan-1" }, error: null },
    });
    const flagged = { ...baseProfile, medicalFlags: ["diabetes"] };

    const warnMode = await POST(jsonRequest("/api/plans", { profile: flagged, plan, privacyConsent: true }));
    expect(warnMode.status).toBe(200);

    env.medicalScreeningMode = "block";
    const blockMode = await POST(jsonRequest("/api/plans", { profile: flagged, plan, privacyConsent: true }));
    expect(blockMode.status).toBe(422);
    await expect(blockMode.json()).resolves.toMatchObject({ error: expect.stringContaining("non genera un piano automatico") });
  });

  it("returns 401 for anonymous users", async () => {
    configureSupabase();

    const response = await POST(jsonRequest("/api/plans", { profile: baseProfile, plan, privacyConsent: true }));

    expect(response.status).toBe(401);
  });

  it("returns 402 for free users even with a valid payload", async () => {
    configureSupabase();
    scenario.user = freeUser;
    scenario.supabase = createFakeSupabase();

    const response = await POST(jsonRequest("/api/plans", { profile: baseProfile, plan, privacyConsent: true }));

    expect(response.status).toBe(402);
    expect(scenario.supabase.from).not.toHaveBeenCalled();
  });

  it("saves profile, plan and consents for premium users", async () => {
    configureSupabase();
    scenario.user = premiumUser;
    scenario.supabase = createFakeSupabase({
      user_profiles: { data: { id: "profile-1" }, error: null },
      meal_plans: { data: { id: "plan-1" }, error: null },
      privacy_consents: { data: null, error: null },
    });

    const response = await POST(jsonRequest("/api/plans", { profile: { ...baseProfile, allergyFlags: ["fish"] }, plan, privacyConsent: true }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ profileId: "profile-1", planId: "plan-1" });

    const profileInsert = scenario.supabase.calls.find((call) => call.table === "user_profiles" && call.op === "insert");
    expect(profileInsert?.args[0]).toMatchObject({ user_id: premiumUser.id, allergy_flags: ["fish"], cooking_time: "standard" });

    const consentInsert = scenario.supabase.calls.find((call) => call.table === "privacy_consents" && call.op === "insert");
    expect(consentInsert?.args[0]).toHaveLength(3);
  });

  it("returns 500 when the profile insert fails", async () => {
    configureSupabase();
    scenario.user = premiumUser;
    scenario.supabase = createFakeSupabase({ user_profiles: { data: null, error: { message: "constraint" } } });
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await POST(jsonRequest("/api/plans", { profile: baseProfile, plan, privacyConsent: true }));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Profilo non salvato." });
  });
});

describe("isValidPlanPayload", () => {
  it("accepts generated plans and rejects malformed ones", () => {
    expect(isValidPlanPayload(plan)).toBe(true);
    expect(isValidPlanPayload(null)).toBe(false);
    expect(isValidPlanPayload({ ...plan, days: [] })).toBe(false);
    expect(isValidPlanPayload({ ...plan, dailyCalories: Number.NaN })).toBe(false);
    expect(isValidPlanPayload({ ...plan, days: [{ ...plan.days[0], meals: [] }] })).toBe(false);
    expect(isValidPlanPayload({ ...plan, days: Array.from({ length: 8 }, () => plan.days[0]) })).toBe(false);
  });
});
