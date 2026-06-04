import { redirect } from "next/navigation";
import { CalendarClock, ShieldCheck } from "lucide-react";
import { Header } from "@/components/Header";
import { Card } from "@/components/Card";
import { WarningBox } from "@/components/WarningBox";
import { getAuthenticatedUser, createSupabaseAdminClient } from "@/lib/supabase/data";
import { isAdminUser } from "@/lib/admin";
import { PrivacyStatusSelect } from "./privacy-status-select";

type PrivacyRequestRow = {
  id: string;
  email: string;
  request_type: string;
  status: string;
  notes: string | null;
  created_at: string;
  resolved_at: string | null;
};

const requestTypeLabels: Record<string, string> = {
  access: "Accesso",
  rectification: "Rettifica",
  export: "Export dati",
  erasure: "Cancellazione",
  objection: "Opposizione",
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function AdminPrivacyPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login?authError=admin_login_required&from=/admin/privacy");
  }

  if (!isAdminUser(user)) {
    redirect("/account?adminError=not_admin");
  }

  const supabase = await createSupabaseAdminClient();
  const { data: requests, error } = supabase
    ? await supabase
        .from("data_subject_requests")
        .select("id,email,request_type,status,notes,created_at,resolved_at")
        .order("created_at", { ascending: false })
        .limit(50)
    : { data: [] as PrivacyRequestRow[], error: null };

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <section className="mb-6">
          <p className="mb-3 inline-flex rounded-full bg-mint px-4 py-2 text-sm font-bold text-leaf">
            Admin GDPR
          </p>
          <h1 className="text-3xl font-black text-ink sm:text-5xl">Coda richieste privacy</h1>
          <p className="mt-3 max-w-3xl leading-7 text-ink/65">
            Gestisci stati, scadenze operative e note lasciate dagli utenti.
          </p>
        </section>

        {!supabase ? (
          <div className="mb-5">
            <WarningBox tone="strong">Servizio admin non configurato.</WarningBox>
          </div>
        ) : null}

        {error ? (
          <div className="mb-5">
            <WarningBox tone="strong">Richieste privacy non disponibili.</WarningBox>
          </div>
        ) : null}

        <section className="grid gap-4">
          {requests?.length ? (
            requests.map((request) => (
              <Card key={request.id}>
                <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-mint px-3 py-1 text-xs font-black uppercase text-leaf">
                        <ShieldCheck size={14} aria-hidden="true" />
                        {requestTypeLabels[request.request_type] || request.request_type}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-cream px-3 py-1 text-xs font-bold text-ink/60">
                        <CalendarClock size={14} aria-hidden="true" />
                        {formatDate(request.created_at)}
                      </span>
                    </div>
                    <h2 className="mt-3 text-xl font-black text-ink">{request.email}</h2>
                    <p className="mt-2 text-sm leading-6 text-ink/65">{request.notes || "Nessuna nota."}</p>
                    {request.resolved_at ? (
                      <p className="mt-2 text-xs font-semibold text-ink/45">
                        Chiusura: {formatDate(request.resolved_at)}
                      </p>
                    ) : null}
                  </div>
                  <PrivacyStatusSelect requestId={request.id} initialStatus={request.status} />
                </div>
              </Card>
            ))
          ) : (
            <Card>
              <p className="text-sm text-ink/60">Nessuna richiesta privacy registrata.</p>
            </Card>
          )}
        </section>
      </main>
    </>
  );
}
