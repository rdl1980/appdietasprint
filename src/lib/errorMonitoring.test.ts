import { describe, expect, it } from "vitest";
import { sanitizeClientError, sanitizeErrorText } from "./errorMonitoring";

describe("error monitoring sanitization", () => {
  it("redacts email and token-like values", () => {
    const sanitized = sanitizeErrorText("User rdl1980@gmail.com failed with token=secret and bearer abc.def");

    expect(sanitized).not.toContain("rdl1980@gmail.com");
    expect(sanitized).not.toContain("secret");
    expect(sanitized).toContain("[redacted]");
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
  });
});
