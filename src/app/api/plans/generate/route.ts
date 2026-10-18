import { NextRequest, NextResponse } from "next/server";
import { generateAiMealPlan } from "@/lib/ai/mealPlanGeneration";
import { loginRequiredResponse, rateLimit, readJsonBody } from "@/lib/api";
import { isPremiumUser } from "@/lib/entitlements";
import { validateProfile } from "@/lib/profileValidation";
import { createAuthenticatedSupabaseClient } from "@/lib/supabase/data";

type GenerateBody = {
  profile?: unknown;
  days?: number;
};

export const runtime = "nodejs";

/**
 * AI-assisted plan generation. Premium only: the deterministic generator stays
 * available client-side for Free users, so this route never blocks the funnel.
 */
export async function POST(request: NextRequest) {
  const limited = rateLimit(request, {
    key: "plans-generate",
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });

  if (limited) {
    return limited;
  }

  const { user } = await createAuthenticatedSupabaseClient(request);

  if (!user) {
    return loginRequiredResponse(request);
  }

  if (!isPremiumUser(user)) {
    return NextResponse.json({ error: "La generazione AI e' disponibile solo con Premium." }, { status: 402 });
  }

  const body = await readJsonBody<GenerateBody>(request);
  const validation = validateProfile(body?.profile);

  if (!validation.ok) {
    return NextResponse.json({ error: `Profilo non valido: ${validation.errors.join(" ")}` }, { status: 400 });
  }

  const days = typeof body?.days === "number" && Number.isInteger(body.days) ? Math.min(Math.max(body.days, 1), 7) : 7;

  try {
    const result = await generateAiMealPlan(validation.profile, { days });

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("plan_generate_failed", { error: error instanceof Error ? error.message : error });
    return NextResponse.json({ error: "Generazione non disponibile." }, { status: 500 });
  }
}
