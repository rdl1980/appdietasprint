import { NextRequest, NextResponse } from "next/server";
import { rateLimit, readJsonBody } from "@/lib/api";
import { sanitizeClientError, type ClientErrorEvent } from "@/lib/errorMonitoring";

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, {
    key: "client-errors",
    limit: 20,
    windowMs: 10 * 60 * 1000,
  });

  if (limited) {
    return limited;
  }

  const body = await readJsonBody<ClientErrorEvent>(request);

  if (!body) {
    return NextResponse.json({ error: "Evento non valido." }, { status: 400 });
  }

  const event = sanitizeClientError(body);
  console.error("client_error_reported", event);

  return NextResponse.json({ ok: true });
}
