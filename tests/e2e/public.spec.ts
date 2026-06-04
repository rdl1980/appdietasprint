import { expect, type Page, test } from "@playwright/test";

async function seedNecessaryCookieConsent(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "dietaSprintCookieConsent",
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
  await expect(page.getByRole("heading", { name: /si adatta alla tua vita reale/i })).toBeVisible();

  await page.goto("/planner");
  await expect(page.getByRole("heading", { name: /costruiamo il tuo piano realistico/i })).toBeVisible();
  await expect(page.getByText("Screening salute")).toBeVisible();
  await expect(page.getByText("Allergie e intolleranze")).toBeVisible();

  await page.getByRole("button", { name: /genera piano/i }).click();
  await expect(page).toHaveURL(/\/results$/);
  await expect(page.getByText("La tua settimana DietaSprint.")).toBeVisible();
  await expect(page.getByText("Macro coerenti").or(page.getByText("Tendenza macro"))).toBeVisible();
  await expect(page.getByText("Lista spesa 7 giorni")).toBeVisible();
});

test("medical screening blocks automatic plan generation", async ({ page }) => {
  await seedNecessaryCookieConsent(page);
  await page.goto("/planner");
  await page.getByLabel(/diabete/i).check();
  await page.getByRole("button", { name: /genera piano/i }).click();

  await expect(page).toHaveURL(/\/planner$/);
  await expect(page.getByText(/non genera un piano automatico/i)).toBeVisible();
});

test("cookie banner stores granular consent", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Preferenze cookie")).toBeVisible();
  await page.getByLabel(/analytics privacy-first/i).check();
  await page.getByRole("button", { name: /salva scelte/i }).click();
  await expect(page.getByText("Preferenze cookie")).toBeHidden();

  const consent = await page.evaluate(() => window.localStorage.getItem("dietaSprintCookieConsent"));
  expect(consent).toContain('"analytics":true');
  expect(consent).toContain('"marketing":false');
});

test("health endpoint and auth debug production guard behave", async ({ request }) => {
  const health = await request.get("/api/health");
  expect(health.ok()).toBe(true);
  await expect(health.json()).resolves.toMatchObject({ ok: true, app: "DietaSprint AI" });

  const debug = await request.get("/api/auth/debug");
  expect([404, 200]).toContain(debug.status());
});
