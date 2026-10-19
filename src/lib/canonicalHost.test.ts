import { describe, expect, it } from "vitest";
import { getCanonicalHost, getCanonicalRedirect } from "./canonicalHost";

describe("getCanonicalHost", () => {
  it("returns the https site host and ignores local or invalid urls", () => {
    expect(getCanonicalHost("https://dietsprintai.com")).toBe("dietsprintai.com");
    expect(getCanonicalHost("https://DietSprintAI.com/")).toBe("dietsprintai.com");
    expect(getCanonicalHost("http://localhost:3000")).toBe("");
    expect(getCanonicalHost("not a url")).toBe("");
  });
});

describe("getCanonicalRedirect", () => {
  const site = "https://dietsprintai.com";

  it("redirects the www alias to the apex keeping path and query", () => {
    expect(getCanonicalRedirect("https://www.dietsprintai.com/results?x=1#top", site)).toBe("https://dietsprintai.com/results?x=1#top");
  });

  it("redirects the apex to www when www is canonical", () => {
    expect(getCanonicalRedirect("https://dietsprintai.com/planner", "https://www.dietsprintai.com")).toBe("https://www.dietsprintai.com/planner");
  });

  it("does nothing for the canonical host, previews, localhost or invalid input", () => {
    expect(getCanonicalRedirect("https://dietsprintai.com/", site)).toBeNull();
    expect(getCanonicalRedirect("https://appdietasprint.vercel.app/", site)).toBeNull();
    expect(getCanonicalRedirect("http://127.0.0.1:3000/", site)).toBeNull();
    expect(getCanonicalRedirect("https://www.dietsprintai.com/", "http://localhost:3000")).toBeNull();
    expect(getCanonicalRedirect("nope", site)).toBeNull();
  });
});
