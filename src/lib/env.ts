export const env = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "ciao@dietsprintai.com",
  legalController: process.env.NEXT_PUBLIC_LEGAL_CONTROLLER || "Titolare da definire",
  legalAddress: process.env.NEXT_PUBLIC_LEGAL_ADDRESS || "Indirizzo sede da definire",
  legalVat: process.env.NEXT_PUBLIC_LEGAL_VAT || "P.IVA / codice fiscale da definire",
  dpoEmail: process.env.NEXT_PUBLIC_DPO_EMAIL || "",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  supabaseJwtSecret: process.env.SUPABASE_JWT_SECRET || "",
  debugAuthEndpoint: process.env.DEBUG_AUTH_ENDPOINT === "true",
  premiumEmails: process.env.PREMIUM_EMAILS || "",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  stripePremiumPriceId: process.env.STRIPE_PREMIUM_PRICE_ID || "",
  // AI provider selection: "openai" | "anthropic" | "auto" (first configured key wins).
  aiProvider: process.env.AI_PROVIDER || "auto",
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  openaiModel: process.env.OPENAI_MODEL || "gpt-5.4-mini",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || "",
  anthropicModel: process.env.ANTHROPIC_MODEL || "claude-opus-5-5",
  buildId: process.env.VERCEL_GIT_COMMIT_SHA || process.env.BUILD_ID || "local",
  // "warn" (default) generates a draft with a medical review warning; "block" refuses automatic plans.
  medicalScreeningMode: process.env.NEXT_PUBLIC_MEDICAL_SCREENING_MODE || "warn",
};

export function isSupabaseConfigured() {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}
