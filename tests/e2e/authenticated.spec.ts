import { expect, type Page, test } from "@playwright/test";

const testEmail = process.env.E2E_TEST_EMAIL;
const testPassword = process.env.E2E_TEST_PASSWORD;
const requireAuthenticatedE2E = process.env.REQUIRE_AUTHENTICATED_E2E === "true";
const authenticatedTest = testEmail && testPassword ? test : test.skip;

if (requireAuthenticatedE2E && (!testEmail || !testPassword)) {
  throw new Error("REQUIRE_AUTHENTICATED_E2E=true richiede E2E_TEST_EMAIL e E2E_TEST_PASSWORD.");
}

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

authenticatedTest("authenticated account can create a ketogenic plan, save it, access privacy and profile", async ({ page }) => {
  await seedNecessaryCookieConsent(page);
  await page.goto("/login");
  await page.getByLabel("Email").fill(testEmail!);
  await page.getByLabel("Password").fill(testPassword!);
  await page.getByRole("button", { name: /^Accedi$/ }).click();

  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByRole("heading", { name: new RegExp(testEmail!.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") })).toBeVisible();

  await page.goto("/planner");
  // The session must survive navigation: the header shows the account and the logout form.
  await expect(page.getByRole("button", { name: /^esci$/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /accedi \/ registrati/i })).toHaveCount(0);
  await page.getByLabel("Tipo dieta").selectOption("ketogenic");
  await page.getByRole("button", { name: /genera piano/i }).click();

  await expect(page).toHaveURL(/\/results$/);
  await expect(page.getByText(/carboidrati molto bassi/i)).toBeVisible();
  await page.getByLabel(/ho letto privacy e disclaimer/i).check();
  await page.getByRole("button", { name: /salva piano/i }).click();
  await expect(page.getByText(/piano salvato/i)).toBeVisible();

  await page.goto("/account/plans");
  await expect(page.getByRole("heading", { name: /storico piani salvati/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /apri/i }).first()).toBeVisible();

  await page.goto("/account/profile");
  await expect(page.getByRole("heading", { name: /modifica profilo alimentare/i })).toBeVisible();

  await page.goto("/account/privacy");
  await expect(page.getByRole("heading", { name: /richieste gdpr/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /scarica export json/i })).toBeVisible();
});

authenticatedTest("premium account gets a real AI coach answer when a provider is configured", async ({ page }) => {
  await seedNecessaryCookieConsent(page);
  await page.goto("/login");
  await page.getByLabel("Email").fill(testEmail!);
  await page.getByLabel("Password").fill(testPassword!);
  await page.getByRole("button", { name: /^Accedi$/ }).click();
  await expect(page).toHaveURL(/\/account$/);

  const health = await page.request.get("/api/health");
  expect(health.ok()).toBe(true);
  const { aiConfigured } = (await health.json()) as { aiConfigured: boolean };

  // Same browser context: the Auth.js session cookie travels with the API request.
  const response = await page.request.post("/api/coach", {
    data: { question: "Quale spuntino proteico semplice posso aggiungere a meta' pomeriggio?" },
  });

  expect(response.status(), await response.text()).toBe(200);
  const reply = (await response.json()) as { answer: string; blocked: boolean; fallback: boolean };

  expect(reply.blocked).toBe(false);
  expect(reply.answer.length).toBeGreaterThan(40);
  // With a provider configured the answer must come from the model, not from the local tips.
  expect(reply.fallback).toBe(!aiConfigured);
});
