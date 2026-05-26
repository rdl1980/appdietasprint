import { Header } from "@/components/Header";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { WarningBox } from "@/components/WarningBox";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { PrivacyRequestForm } from "./privacy-request-form";

export default async function AccountPrivacyPage() {
  const supabase = await createSupabaseServerClient();
  const { data: userResult } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const user = userResult.user;
  const { data: requests } =
    supabase && user
      ? await supabase
          .from("data_subject_requests")
          .select("id,request_type,status,created_at")
          .order("created_at", { ascending: false })
          .limit(10)
      : { data: [] };

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
              <h2 className="text-xl font-black text-ink">Richieste recenti</h2>
              <div className="mt-4 space-y-3">
                {requests?.length ? (
                  requests.map((request) => (
                    <div key={request.id} className="rounded-[8px] bg-cream p-3 text-sm text-ink/70">
                      <p className="font-bold text-ink">{request.request_type}</p>
                      <p>
                        {request.status} - {new Date(request.created_at).toLocaleDateString("it-IT")}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-ink/60">Nessuna richiesta registrata.</p>
                )}
              </div>
            </Card>
          </section>
        )}
      </main>
    </>
  );
}
