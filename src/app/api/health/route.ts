import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { isEmailConfigured } from "@/lib/email";

export function GET() {
  return NextResponse.json({
    ok: true,
    app: "DietaSprint AI",
    build: "admin-session-diagnostics-2026-05-29",
    supabaseConfigured: isSupabaseConfigured(),
    emailConfigured: isEmailConfigured(),
    timestamp: new Date().toISOString(),
  });
}
