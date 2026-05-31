import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const cookieStore = await cookies();
  const cookieNames = cookieStore.getAll().map((cookie) => cookie.name);
  const supabaseCookieNames = cookieNames.filter((name) => name.startsWith("sb-"));
  const authJsCookieNames = cookieNames.filter((name) => name.includes("authjs"));
  const session = await auth();

  return NextResponse.json(
    {
      authenticated: Boolean(session?.user),
      email: session?.user?.email || null,
      authProvider: "authjs",
      authJsCookieCount: authJsCookieNames.length,
      authJsCookieNames,
      supabaseCookieCount: supabaseCookieNames.length,
      supabaseCookieNames,
      hasAnyCookie: cookieNames.length > 0,
      error: session?.authError || null,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
