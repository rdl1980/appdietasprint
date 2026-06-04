import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedSupabaseClient } from "@/lib/supabase/data";
import { isSupabaseConfigured } from "@/lib/env";
import { notifyPrivacyRequest } from "@/lib/email";
import { rateLimit, readJsonBody } from "@/lib/api";

const allowedRequestTypes = ["access", "rectification", "export", "erasure", "objection"] as const;

type PrivacyRequestBody = {
  requestType: (typeof allowedRequestTypes)[number];
  notes?: string;
};

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, {
    key: "privacy-requests",
    limit: 4,
    windowMs: 60 * 60 * 1000,
  });

  if (limited) {
    return limited;
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase non configurato" }, { status: 503 });
  }

  const body = await readJsonBody<PrivacyRequestBody>(request);

  if (!body || !allowedRequestTypes.includes(body.requestType)) {
    return NextResponse.json({ error: "Tipo richiesta non valido." }, { status: 400 });
  }

  const { supabase, user } = await createAuthenticatedSupabaseClient();

  if (!supabase || !user?.email) {
    return NextResponse.json({ error: "Login richiesto" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("data_subject_requests")
    .insert({
      user_id: user.id,
      email: user.email,
      request_type: body.requestType,
      notes: body.notes || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("privacy_request_save_failed", { userId: user.id, error: error?.message });
    return NextResponse.json({ error: "Richiesta non salvata." }, { status: 500 });
  }

  const emailResult = await notifyPrivacyRequest({
    requestId: data.id,
    email: user.email,
    requestType: body.requestType,
    notes: body.notes,
  });

  return NextResponse.json({ requestId: data.id, emailSent: emailResult.sent });
}
