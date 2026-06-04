import { expect, test } from "@playwright/test";

const testEmail = process.env.E2E_TEST_EMAIL;
const testPassword = process.env.E2E_TEST_PASSWORD;
const authenticatedTest = testEmail && testPassword ? test : test.skip;

authenticatedTest("authenticated account can access plans, privacy export and profile", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(testEmail!);
  await page.getByLabel("Password").fill(testPassword!);
  await page.getByRole("button", { name: /^Accedi$/ }).click();

  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByRole("heading", { name: new RegExp(testEmail!.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") })).toBeVisible();

  await page.goto("/account/plans");
  await expect(page.getByRole("heading", { name: /storico piani salvati/i })).toBeVisible();

  await page.goto("/account/profile");
  await expect(page.getByRole("heading", { name: /modifica profilo alimentare/i })).toBeVisible();

  await page.goto("/account/privacy");
  await expect(page.getByRole("heading", { name: /richieste gdpr/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /scarica export json/i })).toBeVisible();
});
