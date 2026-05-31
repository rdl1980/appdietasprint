import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const next = requestUrl.searchParams.get("next") || (type === "recovery" ? "/account/password" : "/login?confirmed=1");
  const redirectTo = new URL(next.startsWith("/") ? next : "/login?confirmed=1", request.url);

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(new URL("/login?authError=supabase_not_configured", request.url));
  }

  const supabase = await createSupabaseServerClient();

  if (code) {
    const { error } = await supabase!.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(redirectTo);
    }

    return NextResponse.redirect(new URL("/login?authError=link_invalid_or_expired", request.url));
  }

  if (tokenHash && type) {
    const { error } = await supabase!.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (!error) {
      return NextResponse.redirect(redirectTo);
    }
  }

  return NextResponse.redirect(new URL("/login?authError=link_invalid_or_expired", request.url));
}
