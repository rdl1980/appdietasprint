import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { getVercelOidcTokenSync } from "@vercel/oidc";
import OpenAI from "openai";
import { env } from "@/lib/env";

/**
 * Provider-agnostic text generation layer.
 *
 * The app only needs "give me a short text answer for this system + user prompt".
 * Both OpenAI (Responses API) and Anthropic (Messages API) are supported so the
 * real API key can be plugged in later without touching business logic.
 */

export type AiProviderName = "openai" | "anthropic";

export type AiTextRequest = {
  system: string;
  user: string;
  maxOutputTokens?: number;
  /** When true the model is instructed to answer with a single JSON object. */
  json?: boolean;
};

export type AiTextResult = {
  text: string;
  provider: AiProviderName;
  model: string;
};

export type AiTextGenerator = (request: AiTextRequest) => Promise<AiTextResult>;

let openaiClient: OpenAI | null = null;
let anthropicClient: Anthropic | null = null;
let generatorOverride: AiTextGenerator | null = null;

/**
 * Vercel delivers the OIDC token per request (header x-vercel-oidc-token, exposed through
 * the request context) and only as VERCEL_OIDC_TOKEN at build time or in local dev.
 */
function readVercelOidcToken(): string | null {
  try {
    return getVercelOidcTokenSync() || null;
  } catch {
    return null;
  }
}

/** Identity token for Workload Identity Federation: Vercel OIDC first, then an explicit file. */
function getFederationIdentityToken(): { token?: string; path?: string } | null {
  const token = readVercelOidcToken() || process.env.ANTHROPIC_IDENTITY_TOKEN;

  if (token) {
    return { token };
  }

  if (env.anthropicIdentityTokenFile) {
    return { path: env.anthropicIdentityTokenFile };
  }

  return null;
}

/** True when the Anthropic client can authenticate without an API key (OIDC federation). */
export function isAnthropicFederationConfigured() {
  if (!env.anthropicFederationRuleId) {
    return false;
  }

  // On Vercel the token arrives with every request, so the rule id alone means "configured"
  // even when this is evaluated outside a request (build, health checks, page rendering).
  return Boolean(getFederationIdentityToken()) || process.env.VERCEL === "1";
}

function isAnthropicConfigured() {
  return Boolean(env.anthropicApiKey) || isAnthropicFederationConfigured();
}

export function resolveAiProvider(): AiProviderName | null {
  const requested = env.aiProvider.trim().toLowerCase();

  if (requested === "openai") {
    return env.openaiApiKey ? "openai" : null;
  }

  if (requested === "anthropic") {
    return isAnthropicConfigured() ? "anthropic" : null;
  }

  if (isAnthropicConfigured()) {
    return "anthropic";
  }

  if (env.openaiApiKey) {
    return "openai";
  }

  return null;
}

export function isAiConfigured() {
  return Boolean(generatorOverride) || resolveAiProvider() !== null;
}

export function getAiModelName() {
  const provider = resolveAiProvider();

  if (provider === "anthropic") {
    return env.anthropicModel;
  }

  if (provider === "openai") {
    return env.openaiModel;
  }

  return null;
}

/** Test hook: inject a fake generator instead of calling a real provider. */
export function setAiTextGeneratorForTests(generator: AiTextGenerator | null) {
  generatorOverride = generator;
}

function getOpenAiClient() {
  openaiClient ||= new OpenAI({ apiKey: env.openaiApiKey });
  return openaiClient;
}

function getAnthropicClient() {
  if (env.anthropicApiKey) {
    anthropicClient ||= new Anthropic({ apiKey: env.anthropicApiKey });
    return anthropicClient;
  }

  const identity = getFederationIdentityToken();

  if (!identity) {
    throw new Error("Anthropic federation identity token not available");
  }

  // The SDK reads the identity token from a file. Vercel rotates VERCEL_OIDC_TOKEN per
  // invocation, so the file is refreshed and a new client (and token exchange) is used
  // every time instead of a memoized one.
  let path = identity.path || "";

  if (identity.token) {
    path = join(tmpdir(), "anthropic-identity-token.jwt");
    writeFileSync(path, identity.token, { mode: 0o600 });
  }

  return new Anthropic({
    config: {
      authentication: {
        type: "oidc_federation",
        federation_rule_id: env.anthropicFederationRuleId,
        service_account_id: env.anthropicServiceAccountId || undefined,
        identity_token: { source: "file", path },
      },
      organization_id: env.anthropicOrganizationId || undefined,
    },
  });
}

async function generateWithOpenAi(request: AiTextRequest): Promise<AiTextResult> {
  const client = getOpenAiClient();
  const response = await client.responses.create({
    model: env.openaiModel,
    max_output_tokens: request.maxOutputTokens ?? 450,
    input: [
      { role: "developer", content: request.system },
      { role: "user", content: request.user },
    ],
    ...(request.json ? { text: { format: { type: "json_object" as const } } } : {}),
  });

  return {
    text: response.output_text?.trim() || "",
    provider: "openai",
    model: env.openaiModel,
  };
}

async function generateWithAnthropic(request: AiTextRequest): Promise<AiTextResult> {
  const client = getAnthropicClient();
  const response = await client.messages.create({
    model: env.anthropicModel,
    // Short, deliberately bounded outputs: coach replies and compact JSON plans.
    max_tokens: request.maxOutputTokens ?? 1024,
    output_config: { effort: "low" },
    system: request.json ? `${request.system}\n\nRispondi esclusivamente con un oggetto JSON valido, senza testo aggiuntivo.` : request.system,
    messages: [{ role: "user", content: request.user }],
  });

  if (response.stop_reason === "refusal") {
    return { text: "", provider: "anthropic", model: env.anthropicModel };
  }

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  return { text, provider: "anthropic", model: env.anthropicModel };
}

export async function generateAiText(request: AiTextRequest): Promise<AiTextResult> {
  if (generatorOverride) {
    return generatorOverride(request);
  }

  const provider = resolveAiProvider();

  if (provider === "anthropic") {
    return generateWithAnthropic(request);
  }

  if (provider === "openai") {
    return generateWithOpenAi(request);
  }

  throw new Error("AI provider not configured");
}

/** Extracts the first JSON object from a model answer, tolerating code fences. */
export function extractJsonObject(text: string): unknown {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");

  if (start < 0 || end <= start) {
    return null;
  }

  try {
    return JSON.parse(trimmed.slice(start, end + 1));
  } catch {
    return null;
  }
}
