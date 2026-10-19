import { expect, test } from "@playwright/test";

/**
 * Smoke checks that run against a deployed environment without login.
 * Usage: npm run test:e2e:production  (PLAYWRIGHT_BASE_URL defaults to https://dietsprintai.com)
 * The authenticated flow lives in authenticated.spec.ts and needs E2E_TEST_EMAIL / E2E_TEST_PASSWORD.
 */

const baseUrl = process.env.PLAYWRIGHT_BASE_URL || "";
const smoke = baseUrl.startsWith("https://") ? test : test.skip;

const profile = {
  sex: "female",
  age: 35,
  heightCm: 165,
  weightKg: 70,
  activityLevel: "moderate",
  goal: "standard",
  dietType: "balanced",
  mealsPerDay: 3,
  excludedFoods: [],
  simplicityLevel: "standard",
  budgetMode: false,
};

smoke("health reports the deployed build with Supabase and email configured", async ({ request }) => {
  const response = await request.get("/api/health");

  expect(response.ok()).toBe(true);
  const payload = await response.json();
  expect(payload).toMatchObject({ ok: true, app: "Diet Sprint AI", supabaseConfigured: true, emailConfigured: true });
  expect(payload.build).toMatch(/^[0-9a-f]{40}$/);
  expect(response.headers()["cache-control"]).toContain("no-store");
});

smoke("public pages render over https with security headers", async ({ page, request }) => {
  for (const path of ["/", "/planner", "/pricing", "/login", "/register", "/legal/privacy"]) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
    await expect(page.locator("main h1").first()).toBeVisible();
  }

  const home = await request.get("/");
  expect(home.headers()["strict-transport-security"]).toContain("max-age=");
  expect(home.headers()["x-frame-options"]).toBe("DENY");
  expect(home.headers()["x-powered-by"]).toBeUndefined();
});

smoke("free planner flow works end-to-end without login", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "dietSprintCookieConsent",
      JSON.stringify({ version: "cookies-2026-06-04", essential: true, analytics: false, marketing: false, acceptedAt: "2026-06-04T00:00:00.000Z" }),
    );
  });
  await page.goto("/planner");
  await page.getByLabel("Tipo dieta").selectOption("mediterranean");
  await page.getByRole("button", { name: /genera piano/i }).click();
  await expect(page).toHaveURL(/\/results$/);
  await expect(page.getByText("Il tuo giorno Diet Sprint AI.")).toBeVisible();
});

smoke("protected routes and APIs refuse anonymous access", async ({ page, request }) => {
  await page.goto("/backlog");
  await expect(page).toHaveURL(/\/login\?authError=admin_login_required/);
  await page.goto("/admin/users");
  await expect(page).toHaveURL(/\/login\?authError=admin_login_required/);
  await page.goto("/account/profile");
  await expect(page).toHaveURL(/\/login/);

  const checks: Array<[string, Promise<{ status(): number }>]> = [
    ["plans", request.get("/api/plans")],
    ["checkout", request.post("/api/checkout", { data: {} })],
    ["coach", request.post("/api/coach", { data: { question: "Come gestisco la fame serale?" } })],
    ["generate", request.post("/api/plans/generate", { data: { profile } })],
    ["export", request.get("/api/privacy/export")],
    ["profile", request.patch("/api/profile", { data: { profileId: "x", profile } })],
    ["privacy-requests", request.post("/api/privacy-requests", { data: { requestType: "access" } })],
  ];

  for (const [name, pending] of checks) {
    const response = await pending;
    expect(response.status(), name).toBe(401);
  }

  const admin = await request.patch("/api/admin/users", { data: { userId: "x", tier: "premium" } });
  expect(admin.status()).toBe(403);

  const me = await request.get("/api/admin/me");
  expect(await me.json()).toMatchObject({ authenticated: false, isAdmin: false });
});

smoke("input validation answers 400 before touching the database", async ({ request }) => {
  const analytics = await request.post("/api/analytics", { data: { event: "nope", path: "/x" } });
  expect(analytics.status()).toBe(400);

  const account = await request.delete("/api/account", { data: { confirmation: "no" } });
  expect(account.status()).toBe(400);

  const password = await request.post("/api/account/password", { data: { password: "short" } });
  expect(password.status()).toBe(400);
});

smoke("www alias redirects permanently to the canonical host", async ({ request }) => {
  const canonical = new URL(baseUrl);

  if (canonical.host.startsWith("www.")) {
    test.skip();
    return;
  }

  const response = await request.get(`https://www.${canonical.host}/pricing?utm=smoke`, { maxRedirects: 0 });
  expect(response.status()).toBe(308);
  expect(response.headers()["location"]).toBe(`https://${canonical.host}/pricing?utm=smoke`);
});

smoke("debug endpoint is disabled in production", async ({ request }) => {
  const debug = await request.get("/api/auth/debug");
  expect(debug.status()).toBe(404);
});
