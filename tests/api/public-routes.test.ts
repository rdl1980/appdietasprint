import { describe, expect, it, vi } from "vitest";
import { env } from "@/lib/env";
import { jsonRequest } from "./helpers";

vi.mock("@/lib/supabase/data", () => ({
  checkSupabaseRlsToken: vi.fn(async () => null),
  createAuthenticatedSupabaseClient: vi.fn(),
  createSupabaseAdminClient: vi.fn(),
  getAuthenticatedUser: vi.fn(async () => null),
}));

const { POST: analytics } = await import("@/app/api/analytics/route");
const { POST: errors } = await import("@/app/api/errors/route");
const { GET: health } = await import("@/app/api/health/route");

describe("POST /api/analytics", () => {
  it("accepts allowed first-party events", async () => {
    const response = await analytics(jsonRequest("/api/analytics", { event: "page_view", path: "/pricing" }));

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it.each([
    [{ event: "email_capture", path: "/pricing" }],
    [{ event: "page_view", path: "https://example.com" }],
    [{ event: "page_view" }],
    [{}],
  ])("rejects invalid payload %j", async (body) => {
    const response = await analytics(jsonRequest("/api/analytics", body));

    expect(response.status).toBe(400);
  });

  it("truncates long paths in logs", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);

    await analytics(jsonRequest("/api/analytics", { event: "page_view", path: `/${"a".repeat(500)}` }));

    expect(info).toHaveBeenCalledWith("analytics_event", expect.objectContaining({ path: expect.stringMatching(/^\/a{159}$/) }));
  });
});

describe("POST /api/errors", () => {
  it("rejects empty bodies", async () => {
    expect((await errors(jsonRequest("/api/errors", "nope"))).status).toBe(400);
  });

  it("logs sanitized events", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await errors(jsonRequest("/api/errors", { message: "fail for rdl1980@gmail.com", path: "/x" }));

    expect(response.status).toBe(200);
    expect(error).toHaveBeenCalledWith("client_error_reported", expect.objectContaining({ message: "fail for [redacted]", source: "client" }));
  });
});

describe("GET /api/health", () => {
  it("reports configuration flags without leaking secrets", async () => {
    env.supabaseUrl = "https://x.supabase.co";
    env.supabaseAnonKey = "anon";
    env.anthropicApiKey = "sk-ant";

    const response = await health();
    const payload = await response.json();

    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(payload).toMatchObject({
      ok: true,
      app: "Diet Sprint AI",
      supabaseConfigured: true,
      supabaseRlsTokenOk: null,
      emailConfigured: false,
      aiConfigured: true,
      aiProvider: "anthropic",
      stripeCheckoutConfigured: false,
      stripeWebhookConfigured: false,
    });
    expect(JSON.stringify(payload)).not.toContain("sk-ant");
    expect(typeof payload.build).toBe("string");
  });
});
