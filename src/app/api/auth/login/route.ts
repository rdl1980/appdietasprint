import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { env, isSupabaseConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function translateAuthError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "Email o password non corretti.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Email non confermata. Controlla la posta e completa la registrazione.";
  }

  if (normalized.includes("too many requests") || normalized.includes("rate limit")) {
    return "Troppi tentativi in poco tempo. Aspetta qualche minuto prima di riprovare.";
  }

  return message;
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase non e' ancora configurato." }, { status: 503 });
  }

  const { email, password } = await request.json();
  let response: NextResponse = NextResponse.json({ ok: true });

  const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    response = NextResponse.json({ error: translateAuthError(error.message) }, { status: 401 });
  }

  return response;
}
