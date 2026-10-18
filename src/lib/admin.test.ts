import { describe, expect, it } from "vitest";
import { isAdminUser } from "./admin";

describe("isAdminUser", () => {
  it("rejects anonymous and plain users", () => {
    expect(isAdminUser(null)).toBe(false);
    expect(isAdminUser(undefined)).toBe(false);
    expect(isAdminUser({ id: "u1", email: "user@example.com" })).toBe(false);
  });

  it("accepts the admin role in app metadata regardless of case", () => {
    expect(isAdminUser({ id: "u1", app_metadata: { role: "admin" } })).toBe(true);
    expect(isAdminUser({ id: "u1", app_metadata: { role: "ADMIN" } })).toBe(true);
    expect(isAdminUser({ id: "u1", app_metadata: { role: "editor" } })).toBe(false);
  });

  it("accepts the default admin username", () => {
    expect(isAdminUser({ id: "u1", app_metadata: { username: "rdladmin" } })).toBe(true);
    expect(isAdminUser({ id: "u1", app_metadata: { username: "RDLADMIN" } })).toBe(true);
  });

  it("accepts emails and usernames configured through environment lists", () => {
    process.env.ADMIN_EMAILS = "Boss@Example.com, second@example.com";
    process.env.ADMIN_USERNAMES = "ops";

    expect(isAdminUser({ id: "u1", email: "boss@example.com" })).toBe(true);
    expect(isAdminUser({ id: "u2", email: "second@example.com" })).toBe(true);
    expect(isAdminUser({ id: "u3", app_metadata: { username: "OPS" } })).toBe(true);
    expect(isAdminUser({ id: "u4", email: "nobody@example.com" })).toBe(false);
  });

  it("does not grant admin from user-controlled plan metadata", () => {
    expect(isAdminUser({ id: "u1", app_metadata: { plan: "premium" } })).toBe(false);
  });
});
