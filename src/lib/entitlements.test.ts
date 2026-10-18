import { describe, expect, it } from "vitest";
import { getPlanTier, isPremiumUser } from "./entitlements";
import { env } from "./env";

describe("entitlements", () => {
  it("treats anonymous users as free", () => {
    expect(getPlanTier(null)).toBe("free");
    expect(isPremiumUser(null)).toBe(false);
  });

  it("treats users without metadata as free", () => {
    expect(getPlanTier({ id: "u1", email: "a@b.it" })).toBe("free");
    expect(getPlanTier({ id: "u1", email: "a@b.it", app_metadata: {} })).toBe("free");
  });

  it.each(["plan", "tier", "productTier", "accessLevel"])("unlocks premium from app metadata key %s", (key) => {
    expect(getPlanTier({ id: "u1", app_metadata: { [key]: "premium" } })).toBe("premium");
    expect(getPlanTier({ id: "u1", app_metadata: { [key]: "PAID" } })).toBe("premium");
    expect(getPlanTier({ id: "u1", app_metadata: { [key]: "lifetime" } })).toBe("premium");
    expect(getPlanTier({ id: "u1", app_metadata: { [key]: "free" } })).toBe("free");
    expect(getPlanTier({ id: "u1", app_metadata: { [key]: "trial" } })).toBe("free");
  });

  it("ignores non-string metadata values", () => {
    expect(getPlanTier({ id: "u1", app_metadata: { plan: { status: "premium" } } })).toBe("free");
    expect(getPlanTier({ id: "u1", app_metadata: { plan: true } })).toBe("free");
  });

  it("unlocks premium from the PREMIUM_EMAILS allow list, case-insensitively", () => {
    env.premiumEmails = " Tester@Example.com , other@example.com";

    expect(getPlanTier({ id: "u1", email: "tester@example.com" })).toBe("premium");
    expect(getPlanTier({ id: "u2", email: "OTHER@example.com" })).toBe("premium");
    expect(getPlanTier({ id: "u3", email: "nobody@example.com" })).toBe("free");
  });

  it("admin-revoked metadata downgrades to free", () => {
    expect(
      getPlanTier({
        id: "u1",
        app_metadata: { plan: "free", tier: "free", accessLevel: "free", premium: { status: "inactive" } },
      }),
    ).toBe("free");
  });
});
