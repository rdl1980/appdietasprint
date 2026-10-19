import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const signOut = vi.fn(async () => undefined);
const supabaseSignOut = vi.fn(async () => ({ error: null }));

vi.mock("@/auth", () => ({ signOut: (...args: unknown[]) => signOut(...(args as [])) }));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({ auth: { signOut: supabaseSignOut } })),
}));

const { GET, POST, isPrefetchRequest } = await import("@/app/auth/logout/route");

function request(method: string, headers: Record<string, string> = {}) {
  return new NextRequest("https://dietsprintai.com/auth/logout", { method, headers });
}

beforeEach(() => {
  signOut.mockClear();
  supabaseSignOut.mockClear();
});

describe("isPrefetchRequest", () => {
  it("detects Next.js router prefetches and browser speculative fetches", () => {
    expect(isPrefetchRequest(request("GET", { "next-router-prefetch": "1" }))).toBe(true);
    expect(isPrefetchRequest(request("GET", { rsc: "1" }))).toBe(true);
    expect(isPrefetchRequest(request("GET", { purpose: "prefetch" }))).toBe(true);
    expect(isPrefetchRequest(request("GET", { "sec-purpose": "prefetch;prerender" }))).toBe(true);
  });

  it("treats plain navigations as real requests", () => {
    expect(isPrefetchRequest(request("GET"))).toBe(false);
    expect(isPrefetchRequest(request("GET", { accept: "text/html" }))).toBe(false);
  });
});

describe("/auth/logout", () => {
  it("answers 204 to prefetches without touching the session", async () => {
    const response = await GET(request("GET", { "next-router-prefetch": "1" }));

    expect(response.status).toBe(204);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(signOut).not.toHaveBeenCalled();
    expect(supabaseSignOut).not.toHaveBeenCalled();
  });

  it("signs out on POST and redirects to the login page", async () => {
    const response = await POST(request("POST"));

    expect(signOut).toHaveBeenCalledWith({ redirect: false, redirectTo: "https://dietsprintai.com/login?logout=1" });
    expect(response.status).toBeGreaterThanOrEqual(300);
    expect(response.headers.get("location")).toBe("https://dietsprintai.com/login?logout=1");
  });

  it("signs out on a direct GET navigation", async () => {
    const response = await GET(request("GET"));

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(response.headers.get("location")).toBe("https://dietsprintai.com/login?logout=1");
  });
});
