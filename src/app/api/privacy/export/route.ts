import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedSupabaseClient } from "@/lib/supabase/data";
import { loginRequiredResponse, rateLimit } from "@/lib/api";

export async function GET(request: NextRequest) {
  const limited = rateLimit(request, {
    key: "privacy-export",
    limit: 6,
    windowMs: 60 * 60 * 1000,
  });

  if (limited) {
    return limited;
  }

  const { supabase, user, unavailableReason } = await createAuthenticatedSupabaseClient(request);

  if (!user) {
    return loginRequiredResponse(request);
  }

  if (!supabase) {
    const status = unavailableReason === "data_service_not_configured" ? 503 : 401;
    return NextResponse.json({ error: "Export non disponibile." }, { status });
  }

  const [profiles, plans, consents, requests] = await Promise.all([
    supabase.from("user_profiles").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("meal_plans").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("privacy_consents").select("*").eq("user_id", user.id).order("accepted_at", { ascending: false }),
    supabase.from("data_subject_requests").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
  ]);

  const firstError = [profiles.error, plans.error, consents.error, requests.error].find(Boolean);

  if (firstError) {
    console.error("privacy_export_failed", { userId: user.id, error: firstError.message });
    return NextResponse.json({ error: "Export non generato." }, { status: 500 });
  }

  return NextResponse.json(
    {
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
      },
      profiles: profiles.data || [],
      mealPlans: plans.data || [],
      consents: consents.data || [],
      privacyRequests: requests.data || [],
    },
    {
      headers: {
        "Content-Disposition": `attachment; filename=\"dietsprint-export-${user.id}.json\"`,
        "Cache-Control": "no-store",
      },
    },
  );
}
