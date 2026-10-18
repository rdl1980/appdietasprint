import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { getLoginUrl } from "./api";

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
});
