import { beforeEach, describe, expect, it, vi } from "vitest";
import { env } from "@/lib/env";
import { freeUser, jsonRequest, premiumUser, type AuthScenario } from "./helpers";

const scenario: AuthScenario = {};

vi.mock("@/lib/supabase/data", () => ({
  createAuthenticatedSupabaseClient: vi.fn(async () => ({ supabase: null, user: scenario.user ?? null, mode: null, unavailableReason: null })),
  createSupabaseAdminClient: vi.fn(async () => null),
  getAuthenticatedUser: vi.fn(async () => scenario.user ?? null),
}));

const { POST: checkout } = await import("@/app/api/checkout/route");
const { POST: webhook } = await import("@/app/api/stripe/webhook/route");

beforeEach(() => {
  scenario.user = null;
});

describe("POST /api/checkout", () => {
  it("requires login and points to the login page", async () => {
    const response = await checkout(jsonRequest("/api/checkout", {}, { headers: { referer: "https://dietsprintai.com/pricing" } }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: "Login richiesto per acquistare Premium.",
      loginUrl: "https://dietsprintai.com/login?from=%2Fpricing",
    });
  });

  it("short-circuits for users who are already premium", async () => {
    scenario.user = premiumUser;

    const response = await checkout(jsonRequest("/api/checkout", {}));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ url: `${env.siteUrl}/account?checkout=already-premium` });
  });

  it("returns 503 when Stripe is not configured", async () => {
    scenario.user = freeUser;

    const response = await checkout(jsonRequest("/api/checkout", {}));

    expect(response.status).toBe(503);
  });
});

describe("POST /api/stripe/webhook", () => {
  it("returns 503 when the webhook secret is missing", async () => {
    const response = await webhook(jsonRequest("/api/stripe/webhook", {}));

    expect(response.status).toBe(503);
  });

  it("rejects requests without a signature", async () => {
    env.stripeSecretKey = "sk_test_x";
    env.stripeWebhookSecret = "whsec_x";

    const response = await webhook(jsonRequest("/api/stripe/webhook", { type: "checkout.session.completed" }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Webhook Stripe non valido." });
  });

  it("rejects requests with an invalid signature", async () => {
    env.stripeSecretKey = "sk_test_x";
    env.stripeWebhookSecret = "whsec_x";

    const response = await webhook(jsonRequest("/api/stripe/webhook", { type: "checkout.session.completed" }, { headers: { "stripe-signature": "t=1,v1=bad" } }));

    expect(response.status).toBe(400);
  });
});
