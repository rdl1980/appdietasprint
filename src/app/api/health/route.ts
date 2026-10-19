import { NextResponse } from "next/server";
import { env, isSupabaseConfigured } from "@/lib/env";
import { isEmailConfigured } from "@/lib/email";
import { isAiConfigured, resolveAiProvider } from "@/lib/ai/provider";
import { isStripeCheckoutConfigured, isStripeWebhookConfigured } from "@/lib/stripe";
import { checkSupabaseRlsToken } from "@/lib/supabase/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const rlsProbe = await checkSupabaseRlsToken().catch(() => null);

  return NextResponse.json(
    {
      ok: true,
      app: "Diet Sprint AI",
      build: env.buildId,
      supabaseConfigured: isSupabaseConfigured(),
      supabaseRlsTokenOk: rlsProbe ? rlsProbe.ok : null,
      emailConfigured: isEmailConfigured(),
      aiConfigured: isAiConfigured(),
      aiProvider: resolveAiProvider(),
      stripeCheckoutConfigured: isStripeCheckoutConfigured(),
      stripeWebhookConfigured: isStripeWebhookConfigured(),
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
