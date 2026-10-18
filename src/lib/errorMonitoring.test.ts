import { describe, expect, it } from "vitest";
import { sanitizeClientError, sanitizeErrorText } from "./errorMonitoring";

describe("error monitoring sanitization", () => {
  it("redacts email and token-like values", () => {
    const sanitized = sanitizeErrorText("User rdl1980@gmail.com failed with token=secret and bearer abc.def");

    expect(sanitized).not.toContain("rdl1980@gmail.com");
    expect(sanitized).not.toContain("secret");
    expect(sanitized).not.toContain("abc.def");
    expect(sanitized).toContain("[redacted]");
  });

  it("redacts password query parameters", () => {
    expect(sanitizeErrorText("POST /login?password=hunter2&next=/x")).toBe("POST /login?[redacted]&next=/x");
  });

  it("returns an empty string for missing text", () => {
    expect(sanitizeErrorText(undefined)).toBe("");
    expect(sanitizeErrorText("")).toBe("");
  });

  it("keeps client events bounded and structured", () => {
    const event = sanitizeClientError({
      message: "x".repeat(2000),
      path: "/account?email=rdl1980@gmail.com",
      source: "test",
    });

    expect(event.message).toHaveLength(1600);
    expect(event.path).not.toContain("rdl1980@gmail.com");
    expect(event.source).toBe("test");
    expect(event.digest).toBe("");
    expect(new Date(event.reportedAt).toString()).not.toBe("Invalid Date");
  });

  it("defaults the source to client", () => {
    expect(sanitizeClientError({ message: "boom" }).source).toBe("client");
  });
});
