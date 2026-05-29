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
    return NextResponse.redirect(new URL("/login?authError=supabase_not_configured", request.url), 303);
  }

  const contentType = request.headers.get("content-type") || "";
  let email = "";
  let password = "";

  if (contentType.includes("application/json")) {
    const body = await request.json();
    email = body.email || "";
    password = body.password || "";
  } else {
    const formData = await request.formData();
    email = String(formData.get("email") || "");
    password = String(formData.get("password") || "");
  }

  let response: NextResponse = NextResponse.redirect(new URL("/account", request.url), 303);

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
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("authError", "login_failed");
    loginUrl.searchParams.set("message", translateAuthError(error.message));
    response = NextResponse.redirect(loginUrl, 303);
  }

  return response;
}
