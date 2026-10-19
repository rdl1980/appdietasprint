import { createClient } from "@supabase/supabase-js";
import { SignJWT } from "jose";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { auth } from "@/auth";
import { env, isSupabaseConfigured } from "@/lib/env";

export type AppUser = {
  id: string;
  email?: string | null;
  app_metadata?: Record<string, unknown>;
};

type AuthenticatedSupabaseUnavailableReason =
  | "unauthenticated"
  | "supabase_not_configured"
  | "data_service_not_configured";

export async function getAuthenticatedUser(): Promise<AppUser | null> {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  return refreshUserMetadata({
    id: session.user.id,
    email: session.user.email,
    app_metadata: session.user.appMetadata,
  });
}

async function refreshUserMetadata(user: AppUser): Promise<AppUser> {
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    return user;
  }

  const { data, error } = await supabase.auth.admin.getUserById(user.id);

  if (error || !data.user) {
    return user;
  }

  return {
    ...user,
    email: data.user.email || user.email,
    app_metadata: data.user.app_metadata || user.app_metadata,
  };
}

async function getAuthenticatedUserFromRequest(request?: NextRequest): Promise<AppUser | null> {
  const session = await auth();

  if (session?.user?.id) {
    return refreshUserMetadata({
      id: session.user.id,
      email: session.user.email,
      app_metadata: session.user.appMetadata,
    });
  }

  if (!request || !process.env.AUTH_SECRET) {
    return null;
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });

  if (!token?.userId) {
    return null;
  }

  return refreshUserMetadata({
    id: token.userId,
    email: token.email,
    app_metadata: token.appMetadata,
  });
}

function createSupabaseServiceClient() {
  if (!isSupabaseConfigured() || !env.supabaseServiceRoleKey) {
    return null;
  }

  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

export async function createSupabaseAdminClient() {
  return createSupabaseServiceClient();
}

/** PostgREST answers 401 with these codes/messages when the bearer token cannot be verified. */
export function isSupabaseJwtError(error: { code?: string | null; message?: string | null } | null | undefined) {
  if (!error) {
    return false;
  }

  const code = String(error.code || "");
  const message = String(error.message || "");

  return code === "PGRST301" || code === "PGRST303" || /JW[ST]|jwt|invalid (signature|token)/i.test(message);
}

type RlsProbe = { ok: boolean; checkedAt: number; reason?: string };

const rlsProbeTtlMs = 10 * 60 * 1000;
let rlsProbe: RlsProbe | null = null;

function createRlsClient(rlsToken: string) {
  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${rlsToken}`,
      },
    },
  });
}

/**
 * Checks once per instance (cached for 10 minutes) that tokens signed with
 * SUPABASE_JWT_SECRET are accepted by PostgREST. A mismatch between the Vercel
 * secret and the project JWT secret would otherwise turn every data request
 * into a silent 401.
 */
export async function checkSupabaseRlsToken(force = false): Promise<RlsProbe | null> {
  if (!isSupabaseConfigured() || !env.supabaseJwtSecret) {
    return null;
  }

  if (!force && rlsProbe && Date.now() - rlsProbe.checkedAt < rlsProbeTtlMs) {
    return rlsProbe;
  }

  const token = await createSupabaseRlsToken({ id: "00000000-0000-0000-0000-000000000000", email: "rls-probe@dietsprintai.local" });

  if (!token) {
    return null;
  }

  const { error } = await createRlsClient(token).from("user_profiles").select("id", { head: true, count: "exact" });
  const rejected = isSupabaseJwtError(error);
  rlsProbe = { ok: !rejected, checkedAt: Date.now(), reason: rejected ? error?.message || error?.code || "jwt_rejected" : undefined };

  if (rejected) {
    console.error("supabase_rls_token_rejected", { reason: rlsProbe.reason });
  }

  return rlsProbe;
}

/** Test hook. */
export function resetSupabaseRlsProbeForTests() {
  rlsProbe = null;
}

async function createSupabaseRlsToken(user: AppUser) {
  if (!env.supabaseJwtSecret) {
    return null;
  }

  const secret = new TextEncoder().encode(env.supabaseJwtSecret);

  return new SignJWT({
    aud: "authenticated",
    role: "authenticated",
    email: user.email,
    app_metadata: user.app_metadata || {},
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secret);
}

export async function createAuthenticatedSupabaseClient(request?: NextRequest) {
  if (!isSupabaseConfigured()) {
    return {
      supabase: null,
      user: null,
      mode: null,
      unavailableReason: "supabase_not_configured" satisfies AuthenticatedSupabaseUnavailableReason,
    };
  }

  const user = await getAuthenticatedUserFromRequest(request);

  if (!user) {
    return {
      supabase: null,
      user: null,
      mode: null,
      unavailableReason: "unauthenticated" satisfies AuthenticatedSupabaseUnavailableReason,
    };
  }

  const rlsToken = await createSupabaseRlsToken(user);

  if (rlsToken) {
    const probe = await checkSupabaseRlsToken();

    if (!probe || probe.ok) {
      return {
        supabase: createRlsClient(rlsToken),
        user,
        mode: "rls" as const,
        unavailableReason: null,
      };
    }

    // SUPABASE_JWT_SECRET does not match the project: fall back to the service role.
    // Every query in the app filters by user_id explicitly, so data isolation is preserved.
  }

  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    console.error("authenticated_data_client_unavailable", {
      userId: user.id,
      hasSupabaseJwtSecret: Boolean(env.supabaseJwtSecret),
      hasServiceRoleKey: Boolean(env.supabaseServiceRoleKey),
    });

    return {
      supabase: null,
      user,
      mode: null,
      unavailableReason: "data_service_not_configured" satisfies AuthenticatedSupabaseUnavailableReason,
    };
  }

  return {
    supabase,
    user,
    mode: "service" as const,
    unavailableReason: null,
  };
}
