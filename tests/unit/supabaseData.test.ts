import { afterEach, describe, expect, it, vi } from "vitest";
import { env } from "@/lib/env";

vi.mock("@/auth", () => ({ auth: vi.fn(async () => null) }));
vi.mock("next-auth/jwt", () => ({ getToken: vi.fn(async () => null) }));

const { checkSupabaseRlsToken, createAuthenticatedSupabaseClient, isSupabaseJwtError, resetSupabaseRlsProbeForTests } = await import("@/lib/supabase/data");

afterEach(() => {
  resetSupabaseRlsProbeForTests();
});

describe("isSupabaseJwtError", () => {
  it("recognizes PostgREST JWT rejections", () => {
    expect(isSupabaseJwtError({ code: "PGRST301", message: "JWT expired" })).toBe(true);
    expect(isSupabaseJwtError({ code: "PGRST303", message: "" })).toBe(true);
    expect(isSupabaseJwtError({ code: "", message: "JWSError JWSInvalidSignature" })).toBe(true);
    expect(isSupabaseJwtError({ code: "", message: "invalid signature" })).toBe(true);
  });

  it("ignores other errors and empty values", () => {
    expect(isSupabaseJwtError(null)).toBe(false);
    expect(isSupabaseJwtError(undefined)).toBe(false);
    expect(isSupabaseJwtError({ code: "23505", message: "duplicate key value" })).toBe(false);
    expect(isSupabaseJwtError({ code: "42501", message: "permission denied for table" })).toBe(false);
  });
});

describe("checkSupabaseRlsToken", () => {
  it("returns null when Supabase or the JWT secret are not configured", async () => {
    expect(await checkSupabaseRlsToken()).toBeNull();

    env.supabaseUrl = "https://test.supabase.co";
    env.supabaseAnonKey = "anon";
    expect(await checkSupabaseRlsToken()).toBeNull();
  });
});

describe("createAuthenticatedSupabaseClient", () => {
  it("reports supabase_not_configured without env", async () => {
    const result = await createAuthenticatedSupabaseClient();

    expect(result).toEqual({ supabase: null, user: null, mode: null, unavailableReason: "supabase_not_configured" });
  });

  it("reports unauthenticated without a session", async () => {
    env.supabaseUrl = "https://test.supabase.co";
    env.supabaseAnonKey = "anon";

    const result = await createAuthenticatedSupabaseClient();

    expect(result.user).toBeNull();
    expect(result.unavailableReason).toBe("unauthenticated");
  });
});
