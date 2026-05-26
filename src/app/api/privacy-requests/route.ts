import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

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

  const supabase = await createSupabaseServerClient();
  const { data: userResult, error: userError } = await supabase!.auth.getUser();

  if (userError || !userResult.user?.email) {
    return NextResponse.json({ error: "Login richiesto" }, { status: 401 });
  }

  const { data, error } = await supabase!
    .from("data_subject_requests")
    .insert({
      user_id: userResult.user.id,
      email: userResult.user.email,
      request_type: body.requestType,
      notes: body.notes || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Richiesta non salvata." }, { status: 500 });
  }

  return NextResponse.json({ requestId: data.id });
}
