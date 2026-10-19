import { NextRequest, NextResponse } from "next/server";
import { signOut } from "@/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

/**
 * Next.js prefetches <Link> targets in production. A GET logout endpoint would
 * therefore sign the user out as soon as a page with an "Esci" link renders.
 * Logout is a POST; GET only answers direct navigations and ignores prefetches.
 */
export function isPrefetchRequest(request: NextRequest) {
  const purpose = request.headers.get("purpose") || request.headers.get("sec-purpose") || request.headers.get("x-purpose") || "";

  return (
    request.headers.has("next-router-prefetch") ||
    request.headers.has("rsc") ||
    request.headers.has("next-router-state-tree") ||
    /prefetch|preview/i.test(purpose)
  );
}

async function performLogout(request: NextRequest) {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase?.auth.signOut();
  }

  const redirectTo = new URL("/login?logout=1", request.url).toString();

  // Clear the Auth.js cookies here and redirect explicitly: letting Auth.js redirect
  // relies on a thrown NEXT_REDIRECT whose target was observed as undefined in dev.
  await signOut({ redirect: false, redirectTo });

  return NextResponse.redirect(redirectTo, 303);
}

export async function POST(request: NextRequest) {
  return performLogout(request);
}

export async function GET(request: NextRequest) {
  if (isPrefetchRequest(request)) {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }

  return performLogout(request);
}
