import { NextRequest, NextResponse } from "next/server";
import { signOut } from "@/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export async function GET(request: NextRequest) {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase!.auth.signOut();
  }

  await signOut({
    redirectTo: new URL("/login?logout=1", request.url).toString(),
  });

  return NextResponse.redirect(new URL("/login?logout=1", request.url));
}
