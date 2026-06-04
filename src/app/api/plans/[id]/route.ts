import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedSupabaseClient } from "@/lib/supabase/data";
import { rateLimit } from "@/lib/api";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(request: NextRequest, context: RouteContext) {
  const limited = rateLimit(request, {
    key: "plans-delete",
    limit: 20,
    windowMs: 10 * 60 * 1000,
  });

  if (limited) {
    return limited;
  }

  const { id } = await context.params;
  const { supabase, user, unavailableReason } = await createAuthenticatedSupabaseClient(request);

  if (!user) {
    return NextResponse.json({ error: "Login richiesto" }, { status: 401 });
  }

  if (!supabase) {
    const status = unavailableReason === "data_service_not_configured" ? 503 : 401;
    return NextResponse.json({ error: "Eliminazione non disponibile." }, { status });
  }

  const { error } = await supabase
    .from("meal_plans")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("plan_delete_failed", { userId: user.id, planId: id, error: error.message });
    return NextResponse.json({ error: "Piano non eliminato." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
