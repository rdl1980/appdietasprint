import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { env } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/data";
import { getStripeClient, isStripeWebhookConfigured } from "@/lib/stripe";

export const runtime = "nodejs";

function getStripeId(value: string | { id?: string } | null) {
  return typeof value === "string" ? value : value?.id || null;
}

async function unlockPremium(session: Stripe.Checkout.Session) {
  if (session.mode !== "payment" || session.payment_status !== "paid") {
    return;
  }

  const userId = session.client_reference_id || session.metadata?.userId;

  if (!userId) {
    throw new Error(`Missing user id for checkout session ${session.id}`);
  }

  const supabase = await createSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Supabase service role non configurato per il webhook Stripe.");
  }

  const paymentIntentId = getStripeId(session.payment_intent);
  const customerId = getStripeId(session.customer);
  const paidAt = new Date().toISOString();

  const { error: purchaseError } = await supabase.from("stripe_purchases").upsert(
    {
      user_id: userId,
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId,
      stripe_customer_id: customerId,
      stripe_price_id: session.metadata?.priceId || env.stripePremiumPriceId,
      amount_total: session.amount_total,
      currency: session.currency,
      status: "paid",
      metadata: {
        product: session.metadata?.product || "premium_lifetime",
        paymentStatus: session.payment_status,
        customerEmail: session.customer_details?.email || session.customer_email,
      },
      updated_at: paidAt,
    },
    {
      onConflict: "stripe_checkout_session_id",
    },
  );

  if (purchaseError) {
    throw new Error(`Stripe purchase not stored: ${purchaseError.message}`);
  }

  const { data: existingUser } = await supabase.auth.admin.getUserById(userId);
  const currentAppMetadata = existingUser.user?.app_metadata || {};

  const { error: userError } = await supabase.auth.admin.updateUserById(userId, {
    app_metadata: {
      ...currentAppMetadata,
      plan: "premium",
      tier: "premium",
      accessLevel: "premium",
      premium: {
        status: "active",
        source: "stripe",
        grantedAt: paidAt,
        checkoutSessionId: session.id,
        paymentIntentId,
        customerId,
        priceId: session.metadata?.priceId || env.stripePremiumPriceId,
      },
    },
  });

  if (userError) {
    throw new Error(`Premium metadata not updated: ${userError.message}`);
  }
}

export async function POST(request: NextRequest) {
  if (!isStripeWebhookConfigured()) {
    return NextResponse.json({ error: "Webhook Stripe non configurato." }, { status: 503 });
  }

  const stripe = getStripeClient();
  const signature = request.headers.get("stripe-signature");

  if (!stripe || !signature) {
    return NextResponse.json({ error: "Webhook Stripe non valido." }, { status: 400 });
  }

  const payload = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, env.stripeWebhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Firma webhook non valida.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      await unlockPremium(event.data.object as Stripe.Checkout.Session);
    }
  } catch (error) {
    console.error("stripe_webhook_processing_failed", {
      eventId: event.id,
      eventType: event.type,
      error: error instanceof Error ? error.message : error,
    });

    return NextResponse.json({ error: "Webhook non processato." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
