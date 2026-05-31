import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      appMetadata?: Record<string, unknown>;
    } & DefaultSession["user"];
    supabaseAccessToken?: string;
    authError?: "RefreshAccessTokenError";
  }

  interface User {
    supabaseAccessToken?: string;
    supabaseRefreshToken?: string;
    supabaseExpiresAt?: number;
    appMetadata?: Record<string, unknown>;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    supabaseAccessToken?: string;
    supabaseRefreshToken?: string;
    supabaseExpiresAt?: number;
    appMetadata?: Record<string, unknown>;
    authError?: "RefreshAccessTokenError";
  }
}
