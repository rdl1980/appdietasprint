import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedSupabaseClient } from "@/lib/supabase/data";
import { profileFromRow, profileRowColumns, profileToRow, type ProfileRow } from "@/lib/databaseMappers";
import { loginRequiredResponse, rateLimit, readJsonBody } from "@/lib/api";
import { validateProfile } from "@/lib/profileValidation";

type UpdateProfileBody = {
  profileId: string;
  profile: unknown;
};

/** Latest saved profile of the caller, used to prefill the planner on a new device. */
export async function GET(request: NextRequest) {
  const { supabase, user, unavailableReason } = await createAuthenticatedSupabaseClient(request);

  if (!user) {
    return loginRequiredResponse(request);
  }

  if (!supabase) {
    const status = unavailableReason === "data_service_not_configured" ? 503 : 401;
    return NextResponse.json({ error: "Profilo non disponibile." }, { status });
  }

  const { data, error } = await supabase
    .from("user_profiles")
    .select(profileRowColumns)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("profile_fetch_failed", { userId: user.id, error: error.message });
    return NextResponse.json({ error: "Profilo non disponibile." }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ profile: null }, { headers: { "Cache-Control": "no-store" } });
  }

  const row = data as unknown as ProfileRow & { id: string };

  return NextResponse.json({ profileId: row.id, profile: profileFromRow(row) }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: NextRequest) {
  const limited = rateLimit(request, {
    key: "profile-patch",
    limit: 20,
    windowMs: 10 * 60 * 1000,
  });

  if (limited) {
    return limited;
  }

  const body = await readJsonBody<UpdateProfileBody>(request);

  if (!body?.profileId || typeof body.profileId !== "string") {
    return NextResponse.json({ error: "Profilo non valido." }, { status: 400 });
  }

  const validation = validateProfile(body.profile);

  if (!validation.ok) {
    return NextResponse.json({ error: `Profilo non valido: ${validation.errors.join(" ")}` }, { status: 400 });
  }

  const { supabase, user, unavailableReason } = await createAuthenticatedSupabaseClient(request);

  if (!user) {
    return loginRequiredResponse(request);
  }

  if (!supabase) {
    const status = unavailableReason === "data_service_not_configured" ? 503 : 401;
    return NextResponse.json({ error: "Profilo non disponibile." }, { status });
  }

  const { data, error } = await supabase
    .from("user_profiles")
    .update({
      ...profileToRow(validation.profile, user.id),
      updated_at: new Date().toISOString(),
    })
    .eq("id", body.profileId)
    .eq("user_id", user.id)
    .select("id")
    .single();

  if (error || !data) {
    console.error("profile_update_failed", { userId: user.id, profileId: body.profileId, error: error?.message });
    return NextResponse.json({ error: "Profilo non aggiornato." }, { status: 500 });
  }

  return NextResponse.json({ profileId: data.id });
}
