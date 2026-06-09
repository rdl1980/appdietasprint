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
