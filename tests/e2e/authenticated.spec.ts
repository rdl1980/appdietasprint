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
