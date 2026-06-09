import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { JWT } from "next-auth/jwt";
import { createClient } from "@supabase/supabase-js";
import { env, isSupabaseConfigured } from "@/lib/env";
import { notifySecurityEvent } from "@/lib/email";

function createSupabaseAuthClient() {
  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

async function refreshSupabaseAccessToken(token: JWT): Promise<JWT> {
  if (!token.supabaseRefreshToken || !isSupabaseConfigured()) {
    return { ...token, authError: undefined };
  }

  const supabase = createSupabaseAuthClient();
  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: token.supabaseRefreshToken,
  });

  if (error || !data.session) {
    return {
      ...token,
      supabaseAccessToken: undefined,
      supabaseRefreshToken: undefined,
      supabaseExpiresAt: undefined,
      authError: undefined,
    };
  }

  return {
    ...token,
    supabaseAccessToken: data.session.access_token,
    supabaseRefreshToken: data.session.refresh_token,
    supabaseExpiresAt: data.session.expires_at,
    appMetadata: data.user?.app_metadata || token.appMetadata,
    authError: undefined,
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = typeof credentials.email === "string" ? credentials.email.trim() : "";
        const password = typeof credentials.password === "string" ? credentials.password : "";

        if (!email || !password || !isSupabaseConfigured()) {
          return null;
        }

        const supabase = createSupabaseAuthClient();
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error || !data.user || !data.session) {
          return null;
        }

        if (data.user.email) {
          notifySecurityEvent({ email: data.user.email, event: "login" }).catch((notifyError) => {
            console.error("security_login_notification_failed", { error: notifyError });
          });
        }

        return {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.full_name || data.user.email,
          appMetadata: data.user.app_metadata,
          supabaseAccessToken: data.session.access_token,
          supabaseRefreshToken: data.session.refresh_token,
          supabaseExpiresAt: data.session.expires_at,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        return {
          ...token,
          userId: user.id,
          appMetadata: user.appMetadata,
          supabaseAccessToken: user.supabaseAccessToken,
          supabaseRefreshToken: user.supabaseRefreshToken,
          supabaseExpiresAt: user.supabaseExpiresAt,
          authError: undefined,
        };
      }

      if (
        token.supabaseAccessToken &&
        token.supabaseExpiresAt &&
        Date.now() < (token.supabaseExpiresAt - 60) * 1000
      ) {
        return token;
      }

      return refreshSupabaseAccessToken(token);
    },
    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId;
      }

      session.user.appMetadata = token.appMetadata;
      session.authError = token.authError;

      return session;
    },
  },
});
