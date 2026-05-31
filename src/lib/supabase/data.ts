import { createClient } from "@supabase/supabase-js";
import { auth } from "@/auth";
import { env, isSupabaseConfigured } from "@/lib/env";

export type AppUser = {
  id: string;
  email?: string | null;
  app_metadata?: Record<string, unknown>;
};

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

export async function createAuthenticatedSupabaseClient() {
  const session = await auth();

  if (
    !isSupabaseConfigured() ||
    !session?.user?.id ||
    !session.supabaseAccessToken ||
    session.authError
  ) {
    return {
      supabase: null,
      user: null,
      accessToken: null,
    };
  }

  const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${session.supabaseAccessToken}`,
      },
    },
  });

  return {
    supabase,
    user: {
      id: session.user.id,
      email: session.user.email,
      app_metadata: session.user.appMetadata,
    } satisfies AppUser,
    accessToken: session.supabaseAccessToken,
  };
}
