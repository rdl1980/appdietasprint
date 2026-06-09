import type { AppUser } from "@/lib/supabase/data";
import { env } from "@/lib/env";

export type PlanTier = "free" | "premium";

const premiumMetadataValues = new Set(["premium", "paid", "lifetime"]);

export function getPlanTier(user: AppUser | null): PlanTier {
  if (!user) {
    return "free";
  }

  const configuredPremiumEmails = env.premiumEmails
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  if (user.email && configuredPremiumEmails.includes(user.email.toLowerCase())) {
    return "premium";
  }

  const metadata = user.app_metadata || {};
  const tier = metadata.plan || metadata.tier || metadata.productTier || metadata.accessLevel;

  return typeof tier === "string" && premiumMetadataValues.has(tier.toLowerCase()) ? "premium" : "free";
}

export function isPremiumUser(user: AppUser | null) {
  return getPlanTier(user) === "premium";
}
