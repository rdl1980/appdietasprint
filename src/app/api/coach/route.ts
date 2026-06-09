import { NextRequest, NextResponse } from "next/server";
import { rateLimit, readJsonBody } from "@/lib/api";
import { generateAiCoachReply } from "@/lib/aiCoach";
import { isPremiumUser } from "@/lib/entitlements";
import { isValidProfile } from "@/lib/databaseMappers";
import { createAuthenticatedSupabaseClient } from "@/lib/supabase/data";
import type { MealPlan, UserProfile } from "@/lib/types";

type CoachBody = {
  question?: string;
  profile?: UserProfile;
  plan?: MealPlan;
};

export const runtime = "nodejs";

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
    return NextResponse.json({ error: "Login richiesto." }, { status: 401 });
  }

  if (!isPremiumUser(user)) {
    return NextResponse.json({ error: "Il coach AI e' disponibile solo con Premium." }, { status: 402 });
  }

  const body = await readJsonBody<CoachBody>(request);
  const question = body?.question?.trim() || "";

  if (question.length < 8 || question.length > 600) {
    return NextResponse.json({ error: "Scrivi una domanda tra 8 e 600 caratteri." }, { status: 400 });
  }

  if (body?.profile && !isValidProfile(body.profile)) {
    return NextResponse.json({ error: "Profilo non valido." }, { status: 400 });
  }

  if (body?.plan && !isValidPlan(body.plan)) {
    return NextResponse.json({ error: "Piano non valido." }, { status: 400 });
  }

  try {
    const reply = await generateAiCoachReply({
      question,
      profile: body?.profile || null,
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
