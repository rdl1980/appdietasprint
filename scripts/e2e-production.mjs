import { spawn } from "node:child_process";

/**
 * Runs the Playwright smoke suite against a deployed environment.
 *
 *   npm run test:e2e:production                      -> https://dietsprintai.com, anonymous checks only
 *   PLAYWRIGHT_BASE_URL=https://preview.url npm run test:e2e:production
 *   E2E_TEST_EMAIL=... E2E_TEST_PASSWORD=... npm run test:e2e:production -> also the authenticated flow
 */

const baseUrl = process.env.PLAYWRIGHT_BASE_URL || "https://dietsprintai.com";
const hasCredentials = Boolean(process.env.E2E_TEST_EMAIL && process.env.E2E_TEST_PASSWORD);
const specs = ["tests/e2e/production-smoke.spec.ts"];

if (hasCredentials) {
  specs.push("tests/e2e/authenticated.spec.ts");
}

console.log(`Running production smoke against ${baseUrl}${hasCredentials ? " (with authenticated flow)" : " (anonymous only)"}`);

const child = spawn(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["playwright", "test", ...specs, "--project=chromium", ...process.argv.slice(2)],
  {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: { ...process.env, PLAYWRIGHT_BASE_URL: baseUrl },
  },
);

child.on("exit", (code) => process.exit(code ?? 1));
