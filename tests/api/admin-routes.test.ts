import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminUser, createFakeSupabase, freeUser, jsonRequest, type AuthScenario } from "./helpers";

const scenario: AuthScenario = {};

vi.mock("@/lib/supabase/data", () => ({
  createAuthenticatedSupabaseClient: vi.fn(async () => ({ supabase: null, user: scenario.user ?? null, mode: null, unavailableReason: null })),
  createSupabaseAdminClient: vi.fn(async () => scenario.supabase ?? null),
  getAuthenticatedUser: vi.fn(async () => scenario.user ?? null),
}));

const { PATCH: patchUser } = await import("@/app/api/admin/users/route");
const { POST: upsertTemplate, DELETE: deactivateTemplate } = await import("@/app/api/admin/templates/route");
const { PATCH: patchPrivacyRequest } = await import("@/app/api/admin/privacy-requests/route");
const { GET: me } = await import("@/app/api/admin/me/route");

const validTemplate = {
  name: "Bowl test",
  mealType: "lunch",
  dietTypes: ["balanced"],
  ingredients: [{ name: "Riso", grams: 80 }],
  calories: 450,
};

beforeEach(() => {
  scenario.user = adminUser;
  scenario.supabase = null;
});

describe("admin authorization", () => {
  it.each([
    ["users", () => patchUser(jsonRequest("/api/admin/users", { userId: "u", tier: "premium" }, { method: "PATCH" }))],
    ["templates", () => upsertTemplate(jsonRequest("/api/admin/templates", validTemplate))],
    ["templates delete", () => deactivateTemplate(jsonRequest("/api/admin/templates", { id: "x" }, { method: "DELETE" }))],
    ["privacy", () => patchPrivacyRequest(jsonRequest("/api/admin/privacy-requests", { requestId: "r", status: "completed" }, { method: "PATCH" }))],
  ])("rejects non-admin callers on %s", async (_name, call) => {
    scenario.user = freeUser;
    expect((await call()).status).toBe(403);

    scenario.user = null;
    expect((await call()).status).toBe(403);
  });

  it("reports admin status on /api/admin/me", async () => {
    const response = await me();

    await expect(response.json()).resolves.toMatchObject({ authenticated: true, isAdmin: true, email: adminUser.email });

    scenario.user = null;
    await expect((await me()).json()).resolves.toMatchObject({ authenticated: false, isAdmin: false });
  });
});

describe("PATCH /api/admin/users", () => {
  it("validates the body", async () => {
    expect((await patchUser(jsonRequest("/api/admin/users", { userId: "u", tier: "gold" }, { method: "PATCH" }))).status).toBe(400);
    expect((await patchUser(jsonRequest("/api/admin/users", { tier: "premium" }, { method: "PATCH" }))).status).toBe(400);
  });

  it("returns 503 without the service role", async () => {
    expect((await patchUser(jsonRequest("/api/admin/users", { userId: "u", tier: "premium" }, { method: "PATCH" }))).status).toBe(503);
  });

  it("returns 404 for unknown users", async () => {
    scenario.supabase = createFakeSupabase();

    expect((await patchUser(jsonRequest("/api/admin/users", { userId: "missing", tier: "premium" }, { method: "PATCH" }))).status).toBe(404);
  });

  it("merges premium metadata when unlocking and revokes when downgrading", async () => {
    scenario.supabase = createFakeSupabase();
    scenario.supabase.auth.admin.getUserById.mockResolvedValue({ data: { user: { app_metadata: { username: "keep" } } }, error: null } as never);

    const unlock = await patchUser(jsonRequest("/api/admin/users", { userId: "u1", tier: "premium" }, { method: "PATCH" }));

    expect(unlock.status).toBe(200);
    expect(scenario.supabase.auth.admin.updateUserById).toHaveBeenLastCalledWith("u1", {
      app_metadata: expect.objectContaining({ username: "keep", plan: "premium", premium: expect.objectContaining({ status: "active", source: "admin" }) }),
    });

    await patchUser(jsonRequest("/api/admin/users", { userId: "u1", tier: "free" }, { method: "PATCH" }));

    expect(scenario.supabase.auth.admin.updateUserById).toHaveBeenLastCalledWith("u1", {
      app_metadata: expect.objectContaining({ plan: "free", premium: expect.objectContaining({ status: "inactive" }) }),
    });
  });
});

describe("/api/admin/templates", () => {
  it("validates templates before saving", async () => {
    const response = await upsertTemplate(jsonRequest("/api/admin/templates", { name: "" }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: expect.stringContaining("Nome richiesto") });
  });

  it("returns 503 without the service role", async () => {
    expect((await upsertTemplate(jsonRequest("/api/admin/templates", validTemplate))).status).toBe(503);
  });

  it("upserts a normalized template row", async () => {
    scenario.supabase = createFakeSupabase({ admin_meal_templates: { data: { id: "bowl-test", name: "Bowl test", active: true }, error: null } });

    const response = await upsertTemplate(jsonRequest("/api/admin/templates", validTemplate));

    expect(response.status).toBe(200);
    const upsert = scenario.supabase.calls.find((call) => call.op === "upsert");
    expect(upsert?.args[0]).toMatchObject({ id: "bowl-test", meal_type: "lunch", diet_types: ["balanced"], active: true, created_by: adminUser.id });
    expect(upsert?.args[1]).toEqual({ onConflict: "id" });
  });

  it("requires an id to deactivate and soft-deletes", async () => {
    expect((await deactivateTemplate(jsonRequest("/api/admin/templates", {}, { method: "DELETE" }))).status).toBe(400);

    scenario.supabase = createFakeSupabase({ admin_meal_templates: { data: { id: "bowl-test", active: false }, error: null } });
    const response = await deactivateTemplate(jsonRequest("/api/admin/templates", { id: "bowl-test" }, { method: "DELETE" }));

    expect(response.status).toBe(200);
    expect(scenario.supabase.calls.find((call) => call.op === "update")?.args[0]).toMatchObject({ active: false });
    expect(scenario.supabase.calls.find((call) => call.op === "delete")).toBeUndefined();
  });
});

describe("PATCH /api/admin/privacy-requests", () => {
  it("validates the status", async () => {
    expect((await patchPrivacyRequest(jsonRequest("/api/admin/privacy-requests", { requestId: "r", status: "done" }, { method: "PATCH" }))).status).toBe(400);
  });

  it("returns 404 for unknown requests", async () => {
    scenario.supabase = createFakeSupabase({ data_subject_requests: { data: null, error: { message: "not found" } } });

    expect((await patchPrivacyRequest(jsonRequest("/api/admin/privacy-requests", { requestId: "r", status: "completed" }, { method: "PATCH" }))).status).toBe(404);
  });

  it("updates the status and writes an audit event", async () => {
    scenario.supabase = createFakeSupabase({
      data_subject_requests: [
        { data: { id: "r", status: "open" }, error: null },
        { data: { id: "r", status: "completed", resolved_at: "2026-10-18T00:00:00.000Z" }, error: null },
      ],
      data_subject_request_audit_events: { data: null, error: null },
    });

    const response = await patchPrivacyRequest(jsonRequest("/api/admin/privacy-requests", { requestId: "r", status: "completed", note: " fatto " }, { method: "PATCH" }));

    expect(response.status).toBe(200);
    const audit = scenario.supabase.calls.find((call) => call.table === "data_subject_request_audit_events" && call.op === "insert");
    expect(audit?.args[0]).toMatchObject({ request_id: "r", previous_status: "open", next_status: "completed", note: "fatto", admin_email: adminUser.email });
    const update = scenario.supabase.calls.find((call) => call.op === "update");
    expect(update?.args[0]).toMatchObject({ status: "completed", resolved_at: expect.any(String) });
  });

  it("clears resolved_at when reopening", async () => {
    scenario.supabase = createFakeSupabase({
      data_subject_requests: [
        { data: { id: "r", status: "completed" }, error: null },
        { data: { id: "r", status: "open", resolved_at: null }, error: null },
      ],
    });

    await patchPrivacyRequest(jsonRequest("/api/admin/privacy-requests", { requestId: "r", status: "open" }, { method: "PATCH" }));

    expect(scenario.supabase.calls.find((call) => call.op === "update")?.args[0]).toEqual({ status: "open", resolved_at: null });
  });
});
