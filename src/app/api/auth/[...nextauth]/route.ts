import { handlers } from "@/auth";
import { rateLimit } from "@/lib/api";
import { NextRequest } from "next/server";

export const GET = handlers.GET;

export function POST(request: NextRequest) {
  const limited = rateLimit(request, {
    key: "auth-credentials",
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });

  if (limited) {
    return limited;
  }

  return handlers.POST(request);
}
