import Stripe from "stripe";
import { env } from "@/lib/env";

let stripeClient: Stripe | null = null;

export function isStripeCheckoutConfigured() {
  return Boolean(env.stripeSecretKey && env.stripePremiumPriceId);
}

export function isStripeWebhookConfigured() {
  return Boolean(env.stripeSecretKey && env.stripeWebhookSecret);
}

export function getStripeClient() {
  if (!env.stripeSecretKey) {
    return null;
  }

  stripeClient ||= new Stripe(env.stripeSecretKey);
  return stripeClient;
}
