import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedSupabaseClient } from "@/lib/supabase/data";
import { isValidProfile, profileToRow } from "@/lib/databaseMappers";
import { rateLimit, readJsonBody } from "@/lib/api";
import type { UserProfile } from "@/lib/types";

type UpdateProfileBody = {
  profileId: string;
  profile: UserProfile;
};

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

  if (!body?.profileId || !isValidProfile(body.profile)) {
    return NextResponse.json({ error: "Profilo non valido." }, { status: 400 });
  }

  const { supabase, user, unavailableReason } = await createAuthenticatedSupabaseClient(request);

  if (!user) {
    return NextResponse.json({ error: "Login richiesto" }, { status: 401 });
  }

  if (!supabase) {
    const status = unavailableReason === "data_service_not_configured" ? 503 : 401;
    return NextResponse.json({ error: "Profilo non disponibile." }, { status });
  }

  const { data, error } = await supabase
    .from("user_profiles")
    .update({
      ...profileToRow(body.profile, user.id),
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
