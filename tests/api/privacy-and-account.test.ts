import { beforeEach, describe, expect, it, vi } from "vitest";
import { env } from "@/lib/env";
import { baseProfile } from "../fixtures/profiles";
import { createFakeSupabase, freeUser, jsonRequest, type AuthScenario } from "./helpers";

const scenario: AuthScenario = {};
const notifyPrivacyRequest = vi.fn(async () => ({ sent: true }));
const notifySecurityEvent = vi.fn(async () => ({ sent: true }));

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

vi.mock("@/lib/email", () => ({
  isEmailConfigured: () => false,
  notifyPrivacyRequest: (...args: unknown[]) => notifyPrivacyRequest(...(args as [])),
  notifySecurityEvent: (...args: unknown[]) => notifySecurityEvent(...(args as [])),
  sendEmail: vi.fn(),
}));

const { POST: privacyRequests } = await import("@/app/api/privacy-requests/route");
const { GET: privacyExport } = await import("@/app/api/privacy/export/route");
const { DELETE: deleteAccount } = await import("@/app/api/account/route");
const { POST: updatePassword } = await import("@/app/api/account/password/route");
const { PATCH: updateProfile } = await import("@/app/api/profile/route");

function configureSupabase() {
  env.supabaseUrl = "https://test.supabase.co";
  env.supabaseAnonKey = "anon";
}

beforeEach(() => {
  scenario.user = null;
  scenario.supabase = null;
  scenario.unavailableReason = null;
});

describe("POST /api/privacy-requests", () => {
  it("returns 503 without Supabase", async () => {
    expect((await privacyRequests(jsonRequest("/api/privacy-requests", { requestType: "access" }))).status).toBe(503);
  });

  it("rejects unknown request types", async () => {
    configureSupabase();

    const response = await privacyRequests(jsonRequest("/api/privacy-requests", { requestType: "delete-everything" }));

    expect(response.status).toBe(400);
  });

  it("requires login", async () => {
    configureSupabase();

    expect((await privacyRequests(jsonRequest("/api/privacy-requests", { requestType: "access" }))).status).toBe(401);
  });

  it("stores the request and notifies the privacy inbox", async () => {
    configureSupabase();
    scenario.user = freeUser;
    scenario.supabase = createFakeSupabase({ data_subject_requests: { data: { id: "req-1" }, error: null } });

    const response = await privacyRequests(jsonRequest("/api/privacy-requests", { requestType: "export", notes: "grazie" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ requestId: "req-1", emailSent: true });
    expect(notifyPrivacyRequest).toHaveBeenCalledWith({ requestId: "req-1", email: freeUser.email, requestType: "export", notes: "grazie" });
  });
});

describe("GET /api/privacy/export", () => {
  it("requires login", async () => {
    expect((await privacyExport(jsonRequest("/api/privacy/export"))).status).toBe(401);
  });

  it("returns a downloadable JSON export", async () => {
    scenario.user = freeUser;
    scenario.supabase = createFakeSupabase({
      user_profiles: { data: [{ id: "p1" }], error: null },
      meal_plans: { data: [], error: null },
      privacy_consents: { data: [{ id: "c1" }], error: null },
      data_subject_requests: { data: [], error: null },
    });

    const response = await privacyExport(jsonRequest("/api/privacy/export"));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-disposition")).toContain(`dietsprint-export-${freeUser.id}.json`);
    await expect(response.json()).resolves.toMatchObject({ user: { id: freeUser.id }, profiles: [{ id: "p1" }], consents: [{ id: "c1" }] });
  });

  it("returns 500 when any query fails", async () => {
    scenario.user = freeUser;
    scenario.supabase = createFakeSupabase({ meal_plans: { data: null, error: { message: "boom" } } });
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    expect((await privacyExport(jsonRequest("/api/privacy/export"))).status).toBe(500);
  });
});

describe("DELETE /api/account", () => {
  it("requires the textual confirmation", async () => {
    const response = await deleteAccount(jsonRequest("/api/account", { confirmation: "ok" }, { method: "DELETE" }));

    expect(response.status).toBe(400);
  });

  it("requires login", async () => {
    expect((await deleteAccount(jsonRequest("/api/account", { confirmation: "ELIMINA" }, { method: "DELETE" }))).status).toBe(401);
  });

  it("records the erasure request, notifies the user and deletes the auth user", async () => {
    scenario.user = freeUser;
    scenario.supabase = createFakeSupabase();

    const response = await deleteAccount(jsonRequest("/api/account", { confirmation: "ELIMINA" }, { method: "DELETE" }));

    expect(response.status).toBe(200);
    expect(scenario.supabase.calls.find((call) => call.table === "data_subject_requests")?.args[0]).toMatchObject({ request_type: "erasure", status: "completed" });
    expect(notifySecurityEvent).toHaveBeenCalledWith({ email: freeUser.email, event: "account_deleted" });
    expect(scenario.supabase.auth.admin.deleteUser).toHaveBeenCalledWith(freeUser.id);
  });
});

describe("POST /api/account/password", () => {
  it("returns 503 without Supabase", async () => {
    expect((await updatePassword(jsonRequest("/api/account/password", { password: "longenough" }))).status).toBe(503);
  });

  it("rejects short passwords", async () => {
    configureSupabase();

    expect((await updatePassword(jsonRequest("/api/account/password", { password: "short" }))).status).toBe(400);
  });
});

describe("PATCH /api/profile", () => {
  it("rejects missing profile ids and invalid profiles", async () => {
    expect((await updateProfile(jsonRequest("/api/profile", { profile: baseProfile }, { method: "PATCH" }))).status).toBe(400);
    expect((await updateProfile(jsonRequest("/api/profile", { profileId: "p1", profile: { ...baseProfile, weightKg: 1 } }, { method: "PATCH" }))).status).toBe(400);
  });

  it("requires login", async () => {
    expect((await updateProfile(jsonRequest("/api/profile", { profileId: "p1", profile: baseProfile }, { method: "PATCH" }))).status).toBe(401);
  });

  it("updates the caller's own profile row", async () => {
    scenario.user = freeUser;
    scenario.supabase = createFakeSupabase({ user_profiles: { data: { id: "p1" }, error: null } });

    const response = await updateProfile(jsonRequest("/api/profile", { profileId: "p1", profile: { ...baseProfile, cookingTime: "quick" } }, { method: "PATCH" }));

    expect(response.status).toBe(200);
    const update = scenario.supabase.calls.find((call) => call.op === "update");
    expect(update?.args[0]).toMatchObject({ cooking_time: "quick", user_id: freeUser.id });
    expect(scenario.supabase.calls.filter((call) => call.op === "eq").map((call) => call.args)).toEqual([
      ["id", "p1"],
      ["user_id", freeUser.id],
    ]);
  });
});
