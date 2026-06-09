import { NextRequest, NextResponse } from "next/server";
import { rateLimit, readJsonBody } from "@/lib/api";

type AnalyticsBody = {
  event?: string;
  path?: string;
};

const allowedEvents = new Set(["page_view", "planner_started", "plan_generated", "pricing_viewed"]);

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, {
    key: "analytics",
    limit: 120,
    windowMs: 60 * 60 * 1000,
  });

  if (limited) {
    return limited;
  }

  const body = await readJsonBody<AnalyticsBody>(request);
  const event = body?.event;
  const path = body?.path;

  if (!event || !allowedEvents.has(event) || !path || !path.startsWith("/")) {
    return NextResponse.json({ error: "Evento analytics non valido." }, { status: 400 });
  }

  console.info("analytics_event", {
    event,
    path: path.slice(0, 160),
    at: new Date().toISOString(),
  });

  return NextResponse.json(
    { ok: true },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
