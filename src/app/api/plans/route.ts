import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { isValidProfile, mealPlanToRow, profileToRow } from "@/lib/databaseMappers";
import { MealPlan, UserProfile } from "@/lib/types";

type SavePlanBody = {
  profile: UserProfile;
  plan: MealPlan;
  privacyConsent: boolean;
};

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase non configurato" }, { status: 503 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: userResult, error: userError } = await supabase!.auth.getUser();

  if (userError || !userResult.user) {
    return NextResponse.json({ error: "Login richiesto" }, { status: 401 });
  }

  const { data, error } = await supabase!
    .from("meal_plans")
    .select("id,daily_calories,warnings,created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ plans: data });
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase non configurato" }, { status: 503 });
  }

  const body = (await request.json()) as SavePlanBody;

  if (!body.privacyConsent) {
    return NextResponse.json({ error: "Consenso privacy richiesto per salvare dati alimentari." }, { status: 400 });
  }

  if (!isValidProfile(body.profile) || !body.plan?.days?.length) {
    return NextResponse.json({ error: "Profilo o piano non validi." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: userResult, error: userError } = await supabase!.auth.getUser();

  if (userError || !userResult.user) {
    return NextResponse.json({ error: "Login richiesto" }, { status: 401 });
  }

  const userId = userResult.user.id;

  const { data: profileRow, error: profileError } = await supabase!
    .from("user_profiles")
    .insert(profileToRow(body.profile, userId))
    .select("id")
    .single();

  if (profileError || !profileRow) {
    return NextResponse.json({ error: profileError?.message || "Profilo non salvato." }, { status: 500 });
  }

  const { data: planRow, error: planError } = await supabase!
    .from("meal_plans")
    .insert(mealPlanToRow(body.plan, userId, profileRow.id))
    .select("id")
    .single();

  if (planError || !planRow) {
    return NextResponse.json({ error: planError?.message || "Piano non salvato." }, { status: 500 });
  }

  await supabase!.from("privacy_consents").insert({
    user_id: userId,
    document: "privacy",
    version: "mvp-2026-05",
    metadata: {
      source: "save_plan",
      planId: planRow.id,
    },
  });

  return NextResponse.json({ profileId: profileRow.id, planId: planRow.id });
}
