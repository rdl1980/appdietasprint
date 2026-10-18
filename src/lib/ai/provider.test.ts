import { afterEach, describe, expect, it } from "vitest";
import { extractJsonObject, generateAiText, getAiModelName, isAiConfigured, resolveAiProvider, setAiTextGeneratorForTests } from "./provider";
import { env } from "../env";

afterEach(() => {
  setAiTextGeneratorForTests(null);
});

describe("resolveAiProvider", () => {
  it("returns null when no key is configured", () => {
    expect(resolveAiProvider()).toBeNull();
    expect(isAiConfigured()).toBe(false);
    expect(getAiModelName()).toBeNull();
  });

  it("prefers anthropic in auto mode when both keys exist", () => {
    env.anthropicApiKey = "sk-ant";
    env.openaiApiKey = "sk-openai";

    expect(resolveAiProvider()).toBe("anthropic");
    expect(getAiModelName()).toBe(env.anthropicModel);
  });

  it("falls back to openai in auto mode", () => {
    env.openaiApiKey = "sk-openai";

    expect(resolveAiProvider()).toBe("openai");
    expect(getAiModelName()).toBe(env.openaiModel);
  });

  it("honours an explicit provider only when its key is present", () => {
    env.aiProvider = "openai";
    env.anthropicApiKey = "sk-ant";
    expect(resolveAiProvider()).toBeNull();

    env.openaiApiKey = "sk-openai";
    expect(resolveAiProvider()).toBe("openai");

    env.aiProvider = "ANTHROPIC";
    expect(resolveAiProvider()).toBe("anthropic");
  });
});

describe("generateAiText", () => {
  it("throws when no provider is configured", async () => {
    await expect(generateAiText({ system: "s", user: "u" })).rejects.toThrow("AI provider not configured");
  });

  it("uses the injected test generator", async () => {
    setAiTextGeneratorForTests(async (request) => ({ text: `echo:${request.user}`, provider: "openai", model: "fake" }));

    expect(isAiConfigured()).toBe(true);
    await expect(generateAiText({ system: "s", user: "hello" })).resolves.toEqual({ text: "echo:hello", provider: "openai", model: "fake" });
  });
});

describe("extractJsonObject", () => {
  it("parses plain JSON", () => {
    expect(extractJsonObject('{"a":1}')).toEqual({ a: 1 });
  });

  it("strips markdown fences and surrounding prose", () => {
    expect(extractJsonObject('```json\n{"a":{"b":[1,2]}}\n```')).toEqual({ a: { b: [1, 2] } });
    expect(extractJsonObject('Ecco il piano: {"days":[]} fine.')).toEqual({ days: [] });
  });

  it("returns null for invalid or missing JSON", () => {
    expect(extractJsonObject("nessun json")).toBeNull();
    expect(extractJsonObject("{broken")).toBeNull();
    expect(extractJsonObject("")).toBeNull();
  });
});
