import { NextRequest, NextResponse } from "next/server";
import { env, isSupabaseConfigured } from "@/lib/env";
import { createAuthenticatedSupabaseClient } from "@/lib/supabase/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type UpdatePasswordBody = {
  password?: string;
};

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase non configurato." }, { status: 503 });
  }

  const body = (await request.json()) as UpdatePasswordBody;

  if (!body.password || body.password.length < 8) {
    return NextResponse.json({ error: "Usa una password di almeno 8 caratteri." }, { status: 400 });
  }

  const { accessToken } = await createAuthenticatedSupabaseClient();

  if (accessToken) {
    const response = await fetch(`${env.supabaseUrl}/auth/v1/user`, {
      method: "PUT",
      headers: {
        apikey: env.supabaseAnonKey,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password: body.password }),
    });

    if (!response.ok) {
      const result = (await response.json()) as { message?: string };
      return NextResponse.json({ error: result.message || "Password non aggiornata." }, { status: response.status });
    }

    return NextResponse.json({ updated: true });
  }

  // Password recovery links establish a short-lived Supabase cookie before an Auth.js session exists.
  const supabase = await createSupabaseServerClient();
  const { data } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  if (!supabase || !data.user) {
    return NextResponse.json({ error: "Sessione non valida. Richiedi un nuovo link di recupero." }, { status: 401 });
  }

  const { error } = await supabase.auth.updateUser({ password: body.password });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ updated: true });
}
