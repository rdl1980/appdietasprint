import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/api";
import { notifySecurityEvent } from "@/lib/email";
import { createAuthenticatedSupabaseClient, createSupabaseAdminClient } from "@/lib/supabase/data";

type DeleteAccountBody = {
  confirmation?: string;
};

export async function DELETE(request: NextRequest) {
  const limited = rateLimit(request, {
    key: "account-delete",
    limit: 3,
    windowMs: 60 * 60 * 1000,
  });

  if (limited) {
    return limited;
  }

  const body = (await request.json().catch(() => null)) as DeleteAccountBody | null;

  if (body?.confirmation !== "ELIMINA") {
    return NextResponse.json({ error: "Conferma eliminazione non valida." }, { status: 400 });
  }

  const { supabase, user, unavailableReason } = await createAuthenticatedSupabaseClient(request);

  if (!user) {
    return NextResponse.json({ error: "Login richiesto" }, { status: 401 });
  }

  if (!supabase) {
    const status = unavailableReason === "data_service_not_configured" ? 503 : 401;
    return NextResponse.json({ error: "Cancellazione non disponibile." }, { status });
  }

  const admin = await createSupabaseAdminClient();

  if (!admin) {
    return NextResponse.json({ error: "Cancellazione account non configurata lato server." }, { status: 503 });
  }

  await supabase.from("data_subject_requests").insert({
    user_id: user.id,
    email: user.email || "unknown",
    request_type: "erasure",
    status: "completed",
    notes: "Richiesta self-service completata automaticamente.",
    resolved_at: new Date().toISOString(),
  });

  if (user.email) {
    await notifySecurityEvent({ email: user.email, event: "account_deleted" });
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    console.error("account_delete_failed", { userId: user.id, error: error.message });
    return NextResponse.json({ error: "Account non eliminato." }, { status: 500 });
  }

  return NextResponse.json(
    { ok: true },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
