import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedSupabaseClient } from "@/lib/supabase/data";
import { isSupabaseConfigured } from "@/lib/env";
import { notifyPrivacyRequest } from "@/lib/email";

const allowedRequestTypes = ["access", "rectification", "export", "erasure", "objection"] as const;

type PrivacyRequestBody = {
  requestType: (typeof allowedRequestTypes)[number];
  notes?: string;
};

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase non configurato" }, { status: 503 });
  }

  const body = (await request.json()) as PrivacyRequestBody;

  if (!allowedRequestTypes.includes(body.requestType)) {
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
    return NextResponse.json({ error: error?.message || "Richiesta non salvata." }, { status: 500 });
  }

  const emailResult = await notifyPrivacyRequest({
    requestId: data.id,
    email: user.email,
    requestType: body.requestType,
    notes: body.notes,
  });

  return NextResponse.json({ requestId: data.id, emailSent: emailResult.sent });
}
