import { NextResponse } from "next/server";
import { isAdminUser } from "@/lib/admin";
import { getAuthenticatedUser } from "@/lib/supabase/data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const user = await getAuthenticatedUser();

  return NextResponse.json(
    {
      authenticated: Boolean(user),
      email: user?.email || null,
      isAdmin: isAdminUser(user),
      appMetadata: user?.app_metadata || null,
      error: null,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
