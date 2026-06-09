import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedSupabaseClient } from "@/lib/supabase/data";
import { isSupabaseConfigured } from "@/lib/env";
import { rateLimit, readJsonBody } from "@/lib/api";
import { isValidProfile, mealPlanToRow, profileToRow } from "@/lib/databaseMappers";
import { isPremiumUser } from "@/lib/entitlements";
import { consentDocuments } from "@/lib/legalVersions";
import { MealPlan, UserProfile } from "@/lib/types";

type SavePlanBody = {
  profile: UserProfile;
  plan: MealPlan;
  privacyConsent: boolean;
};

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase non configurato" }, { status: 503 });
  }

  const { supabase, user, unavailableReason } = await createAuthenticatedSupabaseClient(request);

  if (!user) {
    return NextResponse.json({ error: "Login richiesto" }, { status: 401 });
  }

  if (!isPremiumUser(user)) {
    return NextResponse.json({ error: "Il salvataggio e' disponibile solo con Premium." }, { status: 402 });
  }

  if (!supabase) {
    const status = unavailableReason === "data_service_not_configured" ? 503 : 401;
    return NextResponse.json({ error: "Piani non disponibili." }, { status });
  }

  const { data, error } = await supabase
    .from("meal_plans")
    .select("id,daily_calories,warnings,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("plans_list_failed", { userId: user.id, error: error.message });
    return NextResponse.json({ error: "Piani non disponibili." }, { status: 500 });
  }

  return NextResponse.json({ plans: data });
}

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, {
    key: "plans-post",
    limit: 20,
    windowMs: 10 * 60 * 1000,
  });

  if (limited) {
    return limited;
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase non configurato" }, { status: 503 });
  }

  const body = await readJsonBody<SavePlanBody>(request);

  if (!body) {
    return NextResponse.json({ error: "Richiesta non valida." }, { status: 400 });
  }

  if (!body.privacyConsent) {
    return NextResponse.json({ error: "Consenso privacy richiesto per salvare dati alimentari." }, { status: 400 });
  }

  if (!isValidProfile(body.profile) || !body.plan?.days?.length) {
    return NextResponse.json({ error: "Profilo o piano non validi." }, { status: 400 });
  }

  const { supabase, user, unavailableReason } = await createAuthenticatedSupabaseClient(request);

  if (!user) {
    return NextResponse.json({ error: "Login richiesto" }, { status: 401 });
  }

  if (!supabase) {
    const status = unavailableReason === "data_service_not_configured" ? 503 : 401;
    return NextResponse.json({ error: "Salvataggio non disponibile." }, { status });
  }

  const userId = user.id;

  const { data: profileRow, error: profileError } = await supabase
    .from("user_profiles")
    .insert(profileToRow(body.profile, userId))
    .select("id")
    .single();

  if (profileError || !profileRow) {
    console.error("profile_save_failed", { userId, error: profileError?.message });
    return NextResponse.json({ error: "Profilo non salvato." }, { status: 500 });
  }

  const { data: planRow, error: planError } = await supabase
    .from("meal_plans")
    .insert(mealPlanToRow(body.plan, userId, profileRow.id, body.profile))
    .select("id")
    .single();

  if (planError || !planRow) {
    console.error("plan_save_failed", { userId, error: planError?.message });
    return NextResponse.json({ error: "Piano non salvato." }, { status: 500 });
  }

  await supabase.from("privacy_consents").insert(
    consentDocuments.map((document) => ({
      user_id: userId,
      document: document.document,
      version: document.version,
      metadata: {
        source: "save_plan",
        planId: planRow.id,
      },
    })),
  );

  return NextResponse.json({ profileId: profileRow.id, planId: planRow.id });
}
