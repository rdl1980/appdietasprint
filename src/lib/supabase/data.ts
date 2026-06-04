import { createClient } from "@supabase/supabase-js";
import { SignJWT } from "jose";
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

  if (!session?.user?.id || session.authError) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    app_metadata: session.user.appMetadata,
  };
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

export async function createAuthenticatedSupabaseClient() {
  const session = await auth();

  if (!isSupabaseConfigured()) {
    return {
      supabase: null,
      user: null,
      mode: null,
      unavailableReason: "supabase_not_configured" satisfies AuthenticatedSupabaseUnavailableReason,
    };
  }

  if (!session?.user?.id || session.authError) {
    return {
      supabase: null,
      user: null,
      mode: null,
      unavailableReason: "unauthenticated" satisfies AuthenticatedSupabaseUnavailableReason,
    };
  }

  const user = {
    id: session.user.id,
    email: session.user.email,
    app_metadata: session.user.appMetadata,
  } satisfies AppUser;
  const rlsToken = await createSupabaseRlsToken(user);

  if (rlsToken) {
    const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
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

    return {
      supabase,
      user,
      mode: "rls" as const,
      unavailableReason: null,
    };
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
