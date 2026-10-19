import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedSupabaseClient } from "@/lib/supabase/data";
import { isSupabaseConfigured } from "@/lib/env";
import { loginRequiredResponse, rateLimit, readJsonBody } from "@/lib/api";
import { mealPlanToRow, profileToRow } from "@/lib/databaseMappers";
import { isPremiumUser } from "@/lib/entitlements";
import { consentDocuments } from "@/lib/legalVersions";
import { getMedicalScreeningBlock } from "@/lib/medicalScreening";
import { validateProfile } from "@/lib/profileValidation";
import { MealPlan } from "@/lib/types";

type SavePlanBody = {
  profile: unknown;
  plan: MealPlan;
  privacyConsent: boolean;
};

const premiumRequiredMessage = "Il salvataggio e' disponibile solo con Premium.";

export function isValidPlanPayload(plan: MealPlan | undefined | null): plan is MealPlan {
  return Boolean(
    plan &&
      Array.isArray(plan.days) &&
      plan.days.length > 0 &&
      plan.days.length <= 7 &&
      Number.isFinite(plan.dailyCalories) &&
      plan.days.every((day) => Array.isArray(day.meals) && day.meals.length > 0),
  );
}

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase non configurato" }, { status: 503 });
  }

  const { supabase, user, unavailableReason } = await createAuthenticatedSupabaseClient(request);

  if (!user) {
    return loginRequiredResponse(request);
  }

  if (!isPremiumUser(user)) {
    return NextResponse.json({ error: premiumRequiredMessage }, { status: 402 });
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

  const validation = validateProfile(body.profile);

  if (!validation.ok) {
    return NextResponse.json({ error: `Profilo non valido: ${validation.errors.join(" ")}` }, { status: 400 });
  }

  if (!isValidPlanPayload(body.plan)) {
    return NextResponse.json({ error: "Piano non valido." }, { status: 400 });
  }

  const medicalBlock = getMedicalScreeningBlock(validation.profile.medicalFlags);

  if (medicalBlock) {
    return NextResponse.json({ error: medicalBlock }, { status: 422 });
  }

  const { supabase, user, unavailableReason } = await createAuthenticatedSupabaseClient(request);

  if (!user) {
    return loginRequiredResponse(request);
  }

  if (!isPremiumUser(user)) {
    return NextResponse.json({ error: premiumRequiredMessage }, { status: 402 });
  }

  if (!supabase) {
    const status = unavailableReason === "data_service_not_configured" ? 503 : 401;
    return NextResponse.json({ error: "Salvataggio non disponibile." }, { status });
  }

  const userId = user.id;
  const profile = validation.profile;

  const { data: profileRow, error: profileError } = await supabase
    .from("user_profiles")
    .insert(profileToRow(profile, userId))
    .select("id")
    .single();

  if (profileError || !profileRow) {
    console.error("profile_save_failed", { userId, error: profileError?.message });
    return NextResponse.json({ error: "Profilo non salvato." }, { status: 500 });
  }

  const { data: planRow, error: planError } = await supabase
    .from("meal_plans")
    .insert(mealPlanToRow(body.plan, userId, profileRow.id, profile))
    .select("id")
    .single();

  if (planError || !planRow) {
    console.error("plan_save_failed", { userId, error: planError?.message });
    return NextResponse.json({ error: "Piano non salvato." }, { status: 500 });
  }

  const { error: consentError } = await supabase.from("privacy_consents").insert(
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

  if (consentError) {
    console.error("consent_save_failed", { userId, planId: planRow.id, error: consentError.message });
  }

  return NextResponse.json({ profileId: profileRow.id, planId: planRow.id });
}
