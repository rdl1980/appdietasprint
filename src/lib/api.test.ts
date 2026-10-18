import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { getLoginUrl, loginRequiredResponse, rateLimit, readJsonBody } from "./api";

type MakeRequestInit = { method?: string; body?: string; headers?: Record<string, string>; ip?: string };

function makeRequest(url = "https://dietsprintai.com/api/test", init: MakeRequestInit = {}) {
  const headers = new Headers(init.headers);

  if (init.ip) {
    headers.set("x-forwarded-for", init.ip);
  }

  return new NextRequest(url, { method: init.method, body: init.body, headers });
}

describe("getLoginUrl", () => {
  it("uses a same-origin referer for API requests", () => {
    const request = new NextRequest("https://dietsprintai.com/api/checkout", {
      headers: {
        referer: "https://dietsprintai.com/pricing?checkout=1",
      },
    });

    expect(getLoginUrl(request)).toBe("https://dietsprintai.com/login?from=%2Fpricing%3Fcheckout%3D1");
  });

  it("ignores cross-origin referers", () => {
    const request = new NextRequest("https://dietsprintai.com/api/checkout", {
      headers: {
        referer: "https://example.com/pricing",
      },
    });

    expect(getLoginUrl(request)).toBe("https://dietsprintai.com/login?from=%2Fapi%2Fcheckout");
  });

  it("ignores malformed referers and honours an explicit from path", () => {
    const request = new NextRequest("https://dietsprintai.com/api/checkout", {
      headers: { referer: "not a url" },
    });

    expect(getLoginUrl(request)).toBe("https://dietsprintai.com/login?from=%2Fapi%2Fcheckout");
    expect(getLoginUrl(request, "/results")).toBe("https://dietsprintai.com/login?from=%2Fresults");
  });
});

describe("loginRequiredResponse", () => {
  it("returns a 401 JSON payload with a login url and no-store cache header", async () => {
    const response = loginRequiredResponse(makeRequest(), "Accedi prima.");

    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      error: "Accedi prima.",
      loginUrl: "https://dietsprintai.com/login?from=%2Fapi%2Ftest",
    });
  });
});

describe("readJsonBody", () => {
  it("parses JSON objects", async () => {
    const request = makeRequest("https://dietsprintai.com/api/test", {
      method: "POST",
      body: JSON.stringify({ a: 1 }),
      headers: { "content-type": "application/json" },
    });

    await expect(readJsonBody<{ a: number }>(request)).resolves.toEqual({ a: 1 });
  });

  it("returns null for invalid JSON or non-object payloads", async () => {
    const invalid = makeRequest("https://dietsprintai.com/api/test", { method: "POST", body: "{nope" });
    const scalar = makeRequest("https://dietsprintai.com/api/test", { method: "POST", body: "42" });
    const nothing = makeRequest("https://dietsprintai.com/api/test", { method: "POST", body: "null" });

    await expect(readJsonBody(invalid)).resolves.toBeNull();
    await expect(readJsonBody(scalar)).resolves.toBeNull();
    await expect(readJsonBody(nothing)).resolves.toBeNull();
  });
});

describe("rateLimit", () => {
  it("allows requests up to the limit and then returns 429 with Retry-After", async () => {
    const options = { key: `test-${Math.random()}`, limit: 2, windowMs: 60_000 };
    const ip = "10.0.0.1";

    expect(rateLimit(makeRequest(undefined, { ip }), options)).toBeNull();
    expect(rateLimit(makeRequest(undefined, { ip }), options)).toBeNull();

    const limited = rateLimit(makeRequest(undefined, { ip }), options);

    expect(limited).not.toBeNull();
    expect(limited?.status).toBe(429);
    expect(Number(limited?.headers.get("retry-after"))).toBeGreaterThan(0);
    await expect(limited!.json()).resolves.toMatchObject({ error: expect.stringContaining("Troppe richieste") });
  });

  it("tracks clients independently by forwarded ip", () => {
    const options = { key: `test-${Math.random()}`, limit: 1, windowMs: 60_000 };

    expect(rateLimit(makeRequest(undefined, { ip: "1.1.1.1" }), options)).toBeNull();
    expect(rateLimit(makeRequest(undefined, { ip: "2.2.2.2" }), options)).toBeNull();
    expect(rateLimit(makeRequest(undefined, { ip: "1.1.1.1" }), options)?.status).toBe(429);
  });

  it("uses the first address of a forwarded chain and falls back to x-real-ip", () => {
    const options = { key: `test-${Math.random()}`, limit: 1, windowMs: 60_000 };
    const chained = makeRequest(undefined, { headers: { "x-forwarded-for": "3.3.3.3, 9.9.9.9" } });
    const real = makeRequest(undefined, { headers: { "x-real-ip": "3.3.3.3" } });

    expect(rateLimit(chained, options)).toBeNull();
    expect(rateLimit(real, options)?.status).toBe(429);
  });

  it("resets the bucket once the window expires", () => {
    const options = { key: `test-${Math.random()}`, limit: 1, windowMs: 1_000 };
    const ip = "4.4.4.4";
    const now = Date.now();
    const spy = vi.spyOn(Date, "now").mockReturnValue(now);

    expect(rateLimit(makeRequest(undefined, { ip }), options)).toBeNull();
    expect(rateLimit(makeRequest(undefined, { ip }), options)?.status).toBe(429);

    spy.mockReturnValue(now + 1_500);
    expect(rateLimit(makeRequest(undefined, { ip }), options)).toBeNull();
  });
});
