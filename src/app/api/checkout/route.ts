import { NextRequest, NextResponse } from "next/server";
import { loginRequiredResponse, rateLimit } from "@/lib/api";
import { env } from "@/lib/env";
import { isPremiumUser } from "@/lib/entitlements";
import { createAuthenticatedSupabaseClient } from "@/lib/supabase/data";
import { getStripeClient, isStripeCheckoutConfigured } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, {
    key: "checkout-create",
    limit: 8,
    windowMs: 10 * 60 * 1000,
  });

  if (limited) {
    return limited;
  }

  const { user } = await createAuthenticatedSupabaseClient(request);

  if (!user) {
    return loginRequiredResponse(request, "Login richiesto per acquistare Premium.");
  }

  if (isPremiumUser(user)) {
    return NextResponse.json({ url: `${env.siteUrl}/account?checkout=already-premium` });
  }

  if (!isStripeCheckoutConfigured()) {
    return NextResponse.json({ error: "Checkout Stripe non configurato." }, { status: 503 });
  }

  const stripe = getStripeClient();

  if (!stripe) {
    return NextResponse.json({ error: "Checkout non disponibile." }, { status: 503 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price: env.stripePremiumPriceId,
        quantity: 1,
      },
    ],
    success_url: `${env.siteUrl}/account?checkout=success`,
    cancel_url: `${env.siteUrl}/pricing?checkout=cancelled`,
    customer_email: user.email || undefined,
    client_reference_id: user.id,
    metadata: {
      userId: user.id,
      product: "premium_lifetime",
      priceId: env.stripePremiumPriceId,
    },
    payment_intent_data: {
      metadata: {
        userId: user.id,
        product: "premium_lifetime",
        priceId: env.stripePremiumPriceId,
      },
    },
  });

  if (!session.url) {
    return NextResponse.json({ error: "Sessione checkout non creata." }, { status: 500 });
  }

  return NextResponse.json(
    { url: session.url },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
