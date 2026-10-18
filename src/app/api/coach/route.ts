import { NextRequest, NextResponse } from "next/server";
import { loginRequiredResponse, rateLimit, readJsonBody } from "@/lib/api";
import { generateAiCoachReply } from "@/lib/aiCoach";
import { isPremiumUser } from "@/lib/entitlements";
import { validateProfile } from "@/lib/profileValidation";
import { createAuthenticatedSupabaseClient } from "@/lib/supabase/data";
import type { MealPlan, UserProfile } from "@/lib/types";

type CoachBody = {
  question?: string;
  profile?: unknown;
  plan?: MealPlan;
};

export const runtime = "nodejs";

export const coachQuestionLimits = { min: 8, max: 600 } as const;

function isValidPlan(plan: MealPlan | undefined): plan is MealPlan {
  return Boolean(plan?.days?.length && Number.isFinite(plan.dailyCalories));
}

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, {
    key: "ai-coach",
    limit: 12,
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
    return NextResponse.json({ error: "Il coach AI e' disponibile solo con Premium." }, { status: 402 });
  }

  const body = await readJsonBody<CoachBody>(request);
  const question = typeof body?.question === "string" ? body.question.trim() : "";

  if (question.length < coachQuestionLimits.min || question.length > coachQuestionLimits.max) {
    return NextResponse.json(
      { error: `Scrivi una domanda tra ${coachQuestionLimits.min} e ${coachQuestionLimits.max} caratteri.` },
      { status: 400 },
    );
  }

  let profile: UserProfile | null = null;

  if (body?.profile) {
    const validation = validateProfile(body.profile);

    if (!validation.ok) {
      return NextResponse.json({ error: "Profilo non valido." }, { status: 400 });
    }

    profile = validation.profile;
  }

  if (body?.plan && !isValidPlan(body.plan)) {
    return NextResponse.json({ error: "Piano non valido." }, { status: 400 });
  }

  try {
    const reply = await generateAiCoachReply({
      question,
      profile,
      plan: body?.plan || null,
    });

    return NextResponse.json(reply, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("ai_coach_failed", { error: error instanceof Error ? error.message : error });
    return NextResponse.json({ error: "Coach AI non disponibile." }, { status: 500 });
  }
}
