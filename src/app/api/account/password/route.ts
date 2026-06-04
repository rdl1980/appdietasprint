import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseAdminClient, getAuthenticatedUser } from "@/lib/supabase/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { rateLimit, readJsonBody } from "@/lib/api";

type UpdatePasswordBody = {
  password?: string;
};

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, {
    key: "account-password",
    limit: 5,
    windowMs: 10 * 60 * 1000,
  });

  if (limited) {
    return limited;
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase non configurato." }, { status: 503 });
  }

  const body = await readJsonBody<UpdatePasswordBody>(request);

  if (!body?.password || body.password.length < 8) {
    return NextResponse.json({ error: "Usa una password di almeno 8 caratteri." }, { status: 400 });
  }

  const user = await getAuthenticatedUser();

  if (user) {
    const supabaseAdmin = await createSupabaseAdminClient();

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Servizio account non configurato." }, { status: 503 });
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: body.password,
    });

    if (error) {
      console.error("password_update_failed", { userId: user.id, error: error.message });
      return NextResponse.json({ error: "Password non aggiornata." }, { status: 500 });
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
    console.error("recovery_password_update_failed", { error: error.message });
    return NextResponse.json({ error: "Password non aggiornata. Richiedi un nuovo link di recupero." }, { status: 400 });
  }

  return NextResponse.json({ updated: true });
}
