import { NextRequest, NextResponse } from "next/server";
import { isAdminUser } from "@/lib/admin";
import { rateLimit, readJsonBody } from "@/lib/api";
import { createAuthenticatedSupabaseClient, createSupabaseAdminClient } from "@/lib/supabase/data";

const allowedStatuses = ["open", "in_review", "completed", "rejected"] as const;

type UpdatePrivacyRequestBody = {
  requestId: string;
  status: (typeof allowedStatuses)[number];
};

export async function PATCH(request: NextRequest) {
  const limited = rateLimit(request, {
    key: "admin-privacy-requests",
    limit: 40,
    windowMs: 10 * 60 * 1000,
  });

  if (limited) {
    return limited;
  }

  const { user } = await createAuthenticatedSupabaseClient(request);

  if (!isAdminUser(user)) {
    return NextResponse.json({ error: "Admin richiesto" }, { status: 403 });
  }

  const body = await readJsonBody<UpdatePrivacyRequestBody>(request);

  if (!body?.requestId || !allowedStatuses.includes(body.status)) {
    return NextResponse.json({ error: "Richiesta non valida." }, { status: 400 });
  }

  const supabase = await createSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({ error: "Servizio admin non configurato." }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("data_subject_requests")
    .update({
      status: body.status,
      resolved_at: ["completed", "rejected"].includes(body.status) ? new Date().toISOString() : null,
    })
    .eq("id", body.requestId)
    .select("id,status,resolved_at")
    .single();

  if (error || !data) {
    console.error("admin_privacy_request_update_failed", { requestId: body.requestId, error: error?.message });
    return NextResponse.json({ error: "Richiesta non aggiornata." }, { status: 500 });
  }

  return NextResponse.json({ request: data });
}
