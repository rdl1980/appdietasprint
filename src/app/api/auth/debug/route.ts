import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const cookieStore = await cookies();
  const cookieNames = cookieStore.getAll().map((cookie) => cookie.name);
  const supabaseCookieNames = cookieNames.filter((name) => name.startsWith("sb-"));
  const supabase = await createSupabaseServerClient();
  const { data, error } = supabase
    ? await supabase.auth.getUser()
    : { data: { user: null }, error: null };

  return NextResponse.json(
    {
      authenticated: Boolean(data.user),
      email: data.user?.email || null,
      supabaseCookieCount: supabaseCookieNames.length,
      supabaseCookieNames,
      hasAnyCookie: cookieNames.length > 0,
      error: error?.message || null,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
