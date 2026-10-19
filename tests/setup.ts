import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { env } from "@/lib/env";

// Keep every test hermetic: no real provider keys, no Supabase, no Stripe.
const defaults = {
  supabaseUrl: "",
  supabaseAnonKey: "",
  supabaseServiceRoleKey: "",
  supabaseJwtSecret: "",
  supabaseJwtKeyId: "",
  premiumEmails: "",
  stripeSecretKey: "",
  stripeWebhookSecret: "",
  stripePremiumPriceId: "",
  aiProvider: "auto",
  openaiApiKey: "",
  anthropicApiKey: "",
  anthropicFederationRuleId: "",
  anthropicOrganizationId: "",
  anthropicServiceAccountId: "",
  anthropicIdentityTokenFile: "",
  medicalScreeningMode: "warn",
} as const;

function resetEnv() {
  Object.assign(env, defaults);
  delete process.env.RESEND_API_KEY;
  delete process.env.ADMIN_EMAILS;
  delete process.env.ADMIN_USERNAMES;
  delete process.env.VERCEL_OIDC_TOKEN;
  delete process.env.VERCEL;
  delete process.env.ANTHROPIC_IDENTITY_TOKEN;
}

resetEnv();

afterEach(async () => {
  resetEnv();

  // React Testing Library only auto-cleans with Vitest globals enabled.
  if (typeof document !== "undefined") {
    const { cleanup } = await import("@testing-library/react");
    cleanup();
  }
});
