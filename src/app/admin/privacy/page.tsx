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

type PrivacyAuditEventRow = {
  id: string;
  request_id: string;
  admin_email: string | null;
  previous_status: string | null;
  next_status: string;
  note: string | null;
  created_at: string;
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
  const requestIds = requests?.map((request) => request.id) || [];
  const { data: auditEvents } =
    supabase && requestIds.length
      ? await supabase
          .from("data_subject_request_audit_events")
          .select("id,request_id,admin_email,previous_status,next_status,note,created_at")
          .in("request_id", requestIds)
          .order("created_at", { ascending: false })
      : { data: [] as PrivacyAuditEventRow[] };
  const auditByRequest = new Map<string, PrivacyAuditEventRow[]>();

  (auditEvents as PrivacyAuditEventRow[] | null)?.forEach((event) => {
    auditByRequest.set(event.request_id, [...(auditByRequest.get(event.request_id) || []), event]);
  });

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
                    <div className="mt-4 rounded-[8px] bg-cream p-3">
                      <p className="text-xs font-black uppercase text-ink/50">Audit trail</p>
                      <div className="mt-2 space-y-2">
                        {(auditByRequest.get(request.id) || []).length ? (
                          auditByRequest.get(request.id)?.map((event) => (
                            <div key={event.id} className="rounded-[8px] bg-white p-3 text-xs text-ink/65">
                              <p className="font-bold text-ink">
                                {event.previous_status || "n/a"} -&gt; {event.next_status}
                              </p>
                              <p className="mt-1">
                                {formatDate(event.created_at)} · {event.admin_email || "admin"}
                              </p>
                              {event.note ? <p className="mt-1 leading-5">{event.note}</p> : null}
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-ink/50">Nessun evento audit registrato.</p>
                        )}
                      </div>
                    </div>
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
