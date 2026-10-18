import { describe, expect, it } from "vitest";
import { env } from "./env";
import { getStripeClient, isStripeCheckoutConfigured, isStripeWebhookConfigured } from "./stripe";

describe("stripe configuration", () => {
  it("is not configured by default", () => {
    expect(isStripeCheckoutConfigured()).toBe(false);
    expect(isStripeWebhookConfigured()).toBe(false);
    expect(getStripeClient()).toBeNull();
  });

  it("requires secret key plus price id for checkout", () => {
    env.stripeSecretKey = "sk_test_x";
    expect(isStripeCheckoutConfigured()).toBe(false);

    env.stripePremiumPriceId = "price_x";
    expect(isStripeCheckoutConfigured()).toBe(true);
  });

  it("requires secret key plus webhook secret for webhooks", () => {
    env.stripeSecretKey = "sk_test_x";
    expect(isStripeWebhookConfigured()).toBe(false);

    env.stripeWebhookSecret = "whsec_x";
    expect(isStripeWebhookConfigured()).toBe(true);
  });
});
