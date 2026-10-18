import { NextRequest } from "next/server";
import { vi } from "vitest";
import type { AppUser } from "@/lib/supabase/data";

export type FakeQueryResult = { data: unknown; error: { message: string } | null };

/**
 * Minimal chainable stand-in for the Supabase query builder: every method
 * returns the builder and awaiting it resolves to the configured result.
 */
export function createFakeSupabase(results: Record<string, FakeQueryResult | FakeQueryResult[]> = {}) {
  const calls: Array<{ table: string; op: string; args: unknown[] }> = [];
  const pending = new Map<string, FakeQueryResult[]>();

  for (const [table, value] of Object.entries(results)) {
    pending.set(table, Array.isArray(value) ? [...value] : [value]);
  }

  function nextResult(table: string): FakeQueryResult {
    const queue = pending.get(table);

    if (queue && queue.length > 1) {
      return queue.shift()!;
    }

    return queue?.[0] ?? { data: null, error: null };
  }

  function builder(table: string) {
    const chain: Record<string, unknown> = {};
    const ops = ["select", "insert", "update", "upsert", "delete", "eq", "order", "limit", "single", "maybeSingle"];

    for (const op of ops) {
      chain[op] = (...args: unknown[]) => {
        calls.push({ table, op, args });
        return chain;
      };
    }

    chain.then = (resolve: (value: FakeQueryResult) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve(nextResult(table)).then(resolve, reject);

    return chain;
  }

  const admin = {
    getUserById: vi.fn(async () => ({ data: { user: null }, error: null })),
    updateUserById: vi.fn(async () => ({ data: { user: null }, error: null })),
    deleteUser: vi.fn(async () => ({ data: null, error: null })),
    listUsers: vi.fn(async () => ({ data: { users: [] }, error: null })),
  };

  return {
    from: vi.fn((table: string) => builder(table)),
    auth: { admin },
    calls,
  };
}

export type AuthScenario = {
  user?: AppUser | null;
  supabase?: ReturnType<typeof createFakeSupabase> | null;
  unavailableReason?: "unauthenticated" | "supabase_not_configured" | "data_service_not_configured" | null;
};

export const freeUser: AppUser = { id: "user-free", email: "free@example.com", app_metadata: {} };
export const premiumUser: AppUser = { id: "user-premium", email: "premium@example.com", app_metadata: { plan: "premium" } };
export const adminUser: AppUser = { id: "user-admin", email: "admin@example.com", app_metadata: { role: "admin" } };

export function jsonRequest(path: string, body?: unknown, init: { method?: string; headers?: Record<string, string> } = {}) {
  return new NextRequest(`https://dietsprintai.com${path}`, {
    method: init.method ?? (body === undefined ? "GET" : "POST"),
    headers: { "content-type": "application/json", "x-forwarded-for": `10.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.1`, ...init.headers },
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  });
}
