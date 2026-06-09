import { NextRequest, NextResponse } from "next/server";
import { isAdminUser } from "@/lib/admin";
import { rateLimit, readJsonBody } from "@/lib/api";
import { createAuthenticatedSupabaseClient, createSupabaseAdminClient } from "@/lib/supabase/data";

type UpdateUserBody = {
  userId?: string;
  tier?: "free" | "premium";
};

export async function PATCH(request: NextRequest) {
  const limited = rateLimit(request, {
    key: "admin-users",
    limit: 40,
    windowMs: 10 * 60 * 1000,
  });

  if (limited) {
    return limited;
  }

  const { user } = await createAuthenticatedSupabaseClient(request);

  if (!isAdminUser(user)) {
    return NextResponse.json({ error: "Admin richiesto" }, { status: 403 });
  }

  const body = await readJsonBody<UpdateUserBody>(request);

  if (!body?.userId || !["free", "premium"].includes(body.tier || "")) {
    return NextResponse.json({ error: "Richiesta non valida." }, { status: 400 });
  }

  const supabase = await createSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({ error: "Servizio admin non configurato." }, { status: 503 });
  }

  const { data: existingUser, error: fetchError } = await supabase.auth.admin.getUserById(body.userId);

  if (fetchError || !existingUser.user) {
    return NextResponse.json({ error: "Utente non trovato." }, { status: 404 });
  }

  const currentMetadata = existingUser.user.app_metadata || {};
  const premiumMetadata =
    body.tier === "premium"
      ? {
          plan: "premium",
          tier: "premium",
          accessLevel: "premium",
          premium: {
            status: "active",
            source: "admin",
            grantedAt: new Date().toISOString(),
            grantedBy: user?.email || user?.id,
          },
        }
      : {
          plan: "free",
          tier: "free",
          accessLevel: "free",
          premium: {
            status: "inactive",
            source: "admin",
            revokedAt: new Date().toISOString(),
            revokedBy: user?.email || user?.id,
          },
        };

  const { error } = await supabase.auth.admin.updateUserById(body.userId, {
    app_metadata: {
      ...currentMetadata,
      ...premiumMetadata,
    },
  });

  if (error) {
    console.error("admin_user_update_failed", { userId: body.userId, error: error.message });
    return NextResponse.json({ error: "Utente non aggiornato." }, { status: 500 });
  }

  return NextResponse.json({ user: { id: body.userId, tier: body.tier } });
}
