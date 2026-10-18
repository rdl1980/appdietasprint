import { describe, expect, it } from "vitest";
import { env, isSupabaseConfigured } from "./env";

describe("env", () => {
  it("reports Supabase as configured only with url and anon key", () => {
    expect(isSupabaseConfigured()).toBe(false);

    env.supabaseUrl = "https://x.supabase.co";
    expect(isSupabaseConfigured()).toBe(false);

    env.supabaseAnonKey = "anon";
    expect(isSupabaseConfigured()).toBe(true);
  });

  it("has safe defaults for public values", () => {
    expect(env.siteUrl).toMatch(/^https?:\/\//);
    expect(env.contactEmail).toContain("@");
    expect(env.anthropicModel).toBe("claude-opus-5-5");
    expect(env.openaiModel.length).toBeGreaterThan(0);
    expect(env.buildId.length).toBeGreaterThan(0);
  });
});
