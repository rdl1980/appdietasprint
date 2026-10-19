import { expect, type Page, test } from "@playwright/test";

async function seedNecessaryCookieConsent(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "dietSprintCookieConsent",
      JSON.stringify({
        version: "cookies-2026-06-04",
        essential: true,
        analytics: false,
        marketing: false,
        acceptedAt: "2026-06-04T00:00:00.000Z",
      }),
    );
  });
}

test("home, planner and results flow render without login", async ({ page }) => {
  await seedNecessaryCookieConsent(page);
  await page.goto("/");
  await expect(page.getByRole("link", { name: /salta al contenuto/i })).toHaveCount(1);
  await expect(page.getByRole("heading", { name: /si adatta alla tua vita reale/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /accedi \/ registrati/i })).toBeVisible();

  await page.goto("/planner");
  await expect(page.getByRole("heading", { name: /costruiamo il tuo piano realistico/i })).toBeVisible();
  await expect(page.getByText("Screening salute")).toBeVisible();
  await expect(page.getByText("Allergie e intolleranze")).toBeVisible();

  await page.getByLabel("Tipo dieta").selectOption("ketogenic");
  await page.getByRole("button", { name: /genera piano/i }).click();
  await expect(page).toHaveURL(/\/results$/);
  await expect(page.getByText("Il tuo giorno Diet Sprint AI.")).toBeVisible();
  await expect(page.getByText(/carboidrati molto bassi/i)).toBeVisible();
  await expect(page.getByText("Macro coerenti").or(page.getByText("Tendenza macro"))).toBeVisible();
  await expect(page.getByText(/Free genera solo il piano giornaliero/i)).toBeVisible();
  await expect(page.getByText(/Premium sblocca la settimana completa/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /salva piano/i })).toBeDisabled();
});

test("results page without a profile sends the visitor back to the planner", async ({ page }) => {
  await seedNecessaryCookieConsent(page);
  await page.goto("/results");
  await expect(page.getByRole("heading", { name: /nessun piano trovato/i })).toBeVisible();
  await page.getByRole("link", { name: /vai al planner/i }).click();
  await expect(page).toHaveURL(/\/planner$/);
});

test("medical screening generates a plan with a visible medical review warning", async ({ page }) => {
  await seedNecessaryCookieConsent(page);
  await page.goto("/planner");
  await page.getByLabel(/diabete/i).check();
  await page.getByRole("button", { name: /genera piano/i }).click();

  await expect(page).toHaveURL(/\/results$/);
  await expect(page.getByText(/review medica necessaria prima di seguire questo piano/i)).toBeVisible();
  await expect(page.getByText(/hai indicato: diabete/i)).toBeVisible();
});

test("planner blocks minors client-side", async ({ page }) => {
  await seedNecessaryCookieConsent(page);
  await page.goto("/planner");
  await page.getByRole("spinbutton", { name: "Eta" }).fill("16");
  await page.getByRole("button", { name: /genera piano/i }).click();
  await expect(page).toHaveURL(/\/planner$/);
  expect(await page.getByRole("spinbutton", { name: "Eta" }).evaluate((input: HTMLInputElement) => input.validity.valid)).toBe(false);
});

test("planner draft survives a reload", async ({ page }) => {
  await seedNecessaryCookieConsent(page);
  await page.goto("/planner");
  await page.getByRole("spinbutton", { name: /^peso/i }).fill("81");
  await page.getByRole("button", { name: /salva bozza/i }).click();
  await expect(page.getByText(/bozza salvata/i)).toBeVisible();

  await page.reload();
  await expect(page.getByRole("spinbutton", { name: /^peso/i })).toHaveValue("81");
  await expect(page.getByText("Bozza caricata.")).toBeVisible();
});

test("onboarding guide renders", async ({ page }) => {
  await seedNecessaryCookieConsent(page);
  await page.goto("/onboarding");
  await expect(page.getByRole("heading", { name: /arriva al primo piano salvato/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /apri planner/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /privacy account/i })).toBeVisible();
});

test("pricing, auth and legal pages render", async ({ page }) => {
  await seedNecessaryCookieConsent(page);

  await page.goto("/pricing");
  await expect(page.getByRole("heading", { name: /scegli quanto sprint vuoi/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /acquista premium/i })).toBeVisible();

  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /accedi al tuo account/i })).toBeVisible();

  await page.goto("/register");
  await expect(page.getByRole("heading", { name: /crea il tuo account/i })).toBeVisible();

  await page.goto("/forgot-password");
  await expect(page.getByRole("heading", { name: /reimposta password/i })).toBeVisible();

  for (const path of ["/legal/privacy", "/legal/terms", "/legal/cookies", "/legal/gdpr", "/legal/disclaimer"]) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
    await expect(page.locator("main h1").first()).toBeVisible();
  }
});

test("account and admin areas require authentication", async ({ page }) => {
  await seedNecessaryCookieConsent(page);

  await page.goto("/account");
  await expect(page.getByRole("heading", { name: /accedi per salvare e ritrovare i tuoi piani/i })).toBeVisible();

  await page.goto("/account/profile");
  await expect(page).toHaveURL(/\/login/);

  await page.goto("/admin/backlog");
  await expect(page).toHaveURL(/\/login\?authError=admin_login_required/);
  await expect(page.getByText(/account amministratore/i)).toBeVisible();

  await page.goto("/admin/users");
  await expect(page).toHaveURL(/\/login\?authError=admin_login_required/);

  await page.goto("/backlog");
  await expect(page).toHaveURL(/\/login\?authError=admin_login_required&from=(%2F|\/)backlog/);
});

test("backlog link is hidden from anonymous visitors", async ({ page }) => {
  await seedNecessaryCookieConsent(page);
  await page.goto("/");
  await expect(page.getByRole("link", { name: /backlog/i })).toHaveCount(0);
});

test("cookie banner stores granular consent", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Preferenze cookie")).toBeVisible();
  await page.getByLabel(/analytics privacy-first/i).check();
  await page.getByRole("button", { name: /salva scelte/i }).click();
  await expect(page.getByText("Preferenze cookie")).toBeHidden();

  const consent = await page.evaluate(() => window.localStorage.getItem("dietSprintCookieConsent"));
  expect(consent).toContain('"analytics":true');
  expect(consent).toContain('"marketing":false');
});

test("unknown routes return the 404 page", async ({ page }) => {
  await seedNecessaryCookieConsent(page);
  const response = await page.goto("/questa-pagina-non-esiste");
  expect(response?.status()).toBe(404);
});

test("health endpoint and auth debug production guard behave", async ({ request }) => {
  const health = await request.get("/api/health");
  expect(health.ok()).toBe(true);
  const payload = await health.json();
  expect(payload).toMatchObject({ ok: true, app: "Diet Sprint AI" });
  expect(typeof payload.aiConfigured).toBe("boolean");
  expect(typeof payload.stripeCheckoutConfigured).toBe("boolean");

  const debug = await request.get("/api/auth/debug");
  expect([404, 200]).toContain(debug.status());
});

test("security headers are present", async ({ request }) => {
  const response = await request.get("/");
  expect(response.headers()["x-frame-options"]).toBe("DENY");
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(response.headers()["content-security-policy-report-only"]).toContain("frame-ancestors 'none'");
  expect(response.headers()["x-powered-by"]).toBeUndefined();
});

test("analytics endpoint accepts only consented first-party events", async ({ request }) => {
  const valid = await request.post("/api/analytics", {
    data: { event: "page_view", path: "/pricing" },
  });
  expect(valid.ok()).toBe(true);

  const invalid = await request.post("/api/analytics", {
    data: { event: "email_capture", path: "https://example.com" },
  });
  expect(invalid.status()).toBe(400);
});

test("protected API routes answer 401 with a login url for anonymous callers", async ({ request }) => {
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

  const checkout = await request.post("/api/checkout", { data: {} });
  expect(checkout.status()).toBe(401);
  expect((await checkout.json()).loginUrl).toContain("/login?from=");

  const coach = await request.post("/api/coach", { data: { question: "Come gestisco la fame serale?" } });
  expect(coach.status()).toBe(401);

  const generate = await request.post("/api/plans/generate", { data: { profile } });
  expect(generate.status()).toBe(401);

  const exportResponse = await request.get("/api/privacy/export");
  expect(exportResponse.status()).toBe(401);

  const adminMe = await request.get("/api/admin/me");
  expect(adminMe.ok()).toBe(true);
  expect(await adminMe.json()).toMatchObject({ authenticated: false, isAdmin: false });
});

test("logout ignores router prefetches and only acts on real requests", async ({ request }) => {
  const prefetch = await request.get("/auth/logout", { headers: { "Next-Router-Prefetch": "1", RSC: "1" }, maxRedirects: 0 });
  expect(prefetch.status()).toBe(204);

  const direct = await request.post("/auth/logout", { maxRedirects: 0 });
  expect([302, 303, 307, 308]).toContain(direct.status());
  expect(direct.headers()["location"]).toContain("/login?logout=1");
});

test("account deletion endpoint validates the confirmation before anything else", async ({ request }) => {
  const response = await request.delete("/api/account", { data: { confirmation: "no" } });
  expect(response.status()).toBe(400);
});
