import { NextResponse } from "next/server";
import { isAdminUser } from "@/lib/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = supabase
    ? await supabase.auth.getUser()
    : { data: { user: null }, error: null };

  const user = data.user;

  return NextResponse.json(
    {
      authenticated: Boolean(user),
      email: user?.email || null,
      isAdmin: isAdminUser(user),
      appMetadata: user?.app_metadata || null,
      error: error?.message || null,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
