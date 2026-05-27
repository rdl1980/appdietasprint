import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const next = requestUrl.searchParams.get("next") || "/account";

  const redirectTo = request.nextUrl.clone();
  redirectTo.pathname = next.startsWith("/") ? next : "/account";
  redirectTo.search = "";

  if (!isSupabaseConfigured()) {
    redirectTo.pathname = "/login";
    redirectTo.searchParams.set("authError", "supabase_not_configured");
    return NextResponse.redirect(redirectTo);
  }

  if (code) {
    const callbackUrl = request.nextUrl.clone();
    callbackUrl.pathname = "/auth/callback";
    return NextResponse.redirect(callbackUrl);
  }

  if (tokenHash && type) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase!.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (!error) {
      return NextResponse.redirect(redirectTo);
    }
  }

  redirectTo.pathname = "/login";
  redirectTo.searchParams.set("authError", "link_invalid_or_expired");
  return NextResponse.redirect(redirectTo);
}
