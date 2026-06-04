import { Header } from "@/components/Header";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { WarningBox } from "@/components/WarningBox";
import { createAuthenticatedSupabaseClient } from "@/lib/supabase/data";
import { isSupabaseConfigured } from "@/lib/env";
import { consentDocuments } from "@/lib/legalVersions";
import { PrivacyRequestForm } from "./privacy-request-form";
import { ExportDataButton } from "./export-data-button";

type ConsentRow = {
  id: string;
  document: string;
  version: string;
  accepted_at: string;
};

const requestStatusLabels: Record<string, string> = {
  open: "Aperta",
  in_review: "In revisione",
  completed: "Completata",
  rejected: "Respinta",
};

export default async function AccountPrivacyPage() {
  const { supabase, user } = await createAuthenticatedSupabaseClient();
  const { data: requests } =
    supabase && user
      ? await supabase
          .from("data_subject_requests")
          .select("id,request_type,status,created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10)
      : { data: [] };
  const { data: consents } =
    supabase && user
      ? await supabase
          .from("privacy_consents")
          .select("id,document,version,accepted_at")
          .eq("user_id", user.id)
          .order("accepted_at", { ascending: false })
          .limit(20)
      : { data: [] as ConsentRow[] };

  return (
    <>
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <p className="mb-3 inline-flex rounded-full bg-mint px-4 py-2 text-sm font-bold text-leaf">
          Privacy account
        </p>
        <h1 className="text-3xl font-black text-ink sm:text-5xl">Richieste GDPR</h1>
        <p className="mt-4 max-w-3xl leading-7 text-ink/65">
          Area per registrare richieste di accesso, rettifica, export, cancellazione o opposizione.
        </p>

        {!isSupabaseConfigured() ? (
          <div className="mt-6">
            <WarningBox tone="strong">Supabase non configurato: le richieste non possono essere salvate.</WarningBox>
          </div>
        ) : null}

        {!user ? (
          <Card className="mt-6">
            <h2 className="text-xl font-black text-ink">Login richiesto</h2>
            <p className="mt-2 text-sm leading-6 text-ink/65">
              Accedi per registrare una richiesta privacy collegata al tuo account.
            </p>
            <Button href="/login" className="mt-5">
              Vai al login
            </Button>
          </Card>
        ) : (
          <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
            <Card>
              <h2 className="text-xl font-black text-ink">Nuova richiesta</h2>
              <PrivacyRequestForm />
            </Card>
            <Card>
              <h2 className="text-xl font-black text-ink">Export dati</h2>
              <p className="mt-2 text-sm leading-6 text-ink/65">
                Scarica una copia JSON di profili, piani, consensi e richieste privacy.
              </p>
              <div className="mt-4">
                <ExportDataButton />
              </div>
            </Card>
            <Card>
              <h2 className="text-xl font-black text-ink">Richieste recenti</h2>
              <div className="mt-4 space-y-3">
                {requests?.length ? (
                  requests.map((request) => (
                    <div key={request.id} className="rounded-[8px] bg-cream p-3 text-sm text-ink/70">
                      <p className="font-bold text-ink">{request.request_type}</p>
                      <p>
                        {requestStatusLabels[request.status] || request.status} -{" "}
                        {new Date(request.created_at).toLocaleDateString("it-IT")}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-ink/60">Nessuna richiesta registrata.</p>
                )}
              </div>
            </Card>
            <Card>
              <h2 className="text-xl font-black text-ink">Consensi e versioni</h2>
              <div className="mt-4 space-y-3">
                {consentDocuments.map((document) => {
                  const latestConsent = consents?.find((consent) => consent.document === document.document);

                  return (
                    <div key={document.document} className="rounded-[8px] bg-cream p-3 text-sm text-ink/70">
                      <p className="font-bold text-ink">{document.label}</p>
                      <p>Versione corrente: {document.version}</p>
                      <p>
                        {latestConsent
                          ? `Accettata: ${new Date(latestConsent.accepted_at).toLocaleDateString("it-IT")}`
                          : "Non ancora registrata"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </Card>
          </section>
        )}
      </main>
    </>
  );
}
