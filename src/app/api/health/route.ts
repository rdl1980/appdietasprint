import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { isEmailConfigured } from "@/lib/email";

export function GET() {
  return NextResponse.json({
    ok: true,
    app: "DietaSprint AI",
    build: "p0-ci-guardrails-2026-06-04",
    supabaseConfigured: isSupabaseConfigured(),
    emailConfigured: isEmailConfigured(),
    timestamp: new Date().toISOString(),
  });
}
