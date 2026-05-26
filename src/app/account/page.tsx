import { Header } from "@/components/Header";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { WarningBox } from "@/components/WarningBox";
import { getP0Readiness } from "@/lib/productionReadiness";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CalendarDays, CheckCircle2, LockKeyhole, ShieldAlert } from "lucide-react";

export default async function AccountPage() {
  const supabaseConfigured = isSupabaseConfigured();
  const readiness = getP0Readiness().filter((item) => item.id === "auth" || item.id === "database");
  const supabase = await createSupabaseServerClient();
  const { data: userResult } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const user = userResult.user;
  const { data: profiles } =
    supabase && user
      ? await supabase
          .from("user_profiles")
          .select("id,diet_type,target_calories,meals_per_day,created_at")
          .order("created_at", { ascending: false })
          .limit(5)
      : { data: [] };
  const { data: plans } =
    supabase && user
      ? await supabase
          .from("meal_plans")
          .select("id,daily_calories,warnings,created_at")
          .order("created_at", { ascending: false })
          .limit(5)
      : { data: [] };

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <p className="mb-3 inline-flex rounded-full bg-mint px-4 py-2 text-sm font-bold text-leaf">
          Account P0
        </p>
        <h1 className="max-w-3xl text-3xl font-black leading-tight text-ink sm:text-5xl">
          Area account pronta per il collegamento a Supabase.
        </h1>
        <p className="mt-4 max-w-3xl leading-7 text-ink/65">
          Questa pagina e' il punto di ingresso per login, profili salvati e piani persistenti.
          Nella demo resta disattivata finche' non sono configurate le variabili ambiente.
        </p>

        <div className="mt-6">
          {supabaseConfigured ? (
            <WarningBox>
              Supabase e' configurato. Puoi usare login magic link e salvare profili/piani dal risultato generato.
            </WarningBox>
          ) : (
            <WarningBox tone="strong">
              Mancano le variabili Supabase. Configura NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY
              su Vercel e nel file locale `.env.local`.
            </WarningBox>
          )}
        </div>

        <Card className="mt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-leaf">Sessione</p>
              <h2 className="mt-1 text-xl font-black text-ink">
                {user ? user.email || "Utente autenticato" : "Nessun utente autenticato"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-ink/65">
                {user
                  ? "I nuovi piani salvati appariranno qui."
                  : "Accedi per salvare profilo alimentare, piano settimanale e lista spesa."}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              {user ? (
                <Button href="/auth/logout" variant="secondary">
                  Esci
                </Button>
              ) : (
                <Button href="/login">
                  Vai al login
                </Button>
              )}
              <Button href="/planner" variant="secondary">
                Crea piano
              </Button>
              <Button href="/account/privacy" variant="secondary">
                Privacy
              </Button>
            </div>
          </div>
        </Card>

        {user ? (
          <section className="mt-6 grid gap-4 lg:grid-cols-2">
            <Card>
              <h2 className="text-xl font-black text-ink">Profili recenti</h2>
              <div className="mt-4 space-y-3">
                {profiles?.length ? (
                  profiles.map((profile) => (
                    <div key={profile.id} className="rounded-[8px] bg-cream p-3 text-sm text-ink/70">
                      <p className="font-bold text-ink">{profile.diet_type}</p>
                      <p>
                        {profile.meals_per_day} pasti - {profile.target_calories || "calorie suggerite"} kcal
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-ink/60">Nessun profilo salvato.</p>
                )}
              </div>
            </Card>
            <Card>
              <h2 className="text-xl font-black text-ink">Piani salvati</h2>
              <div className="mt-4 space-y-3">
                {plans?.length ? (
                  plans.map((plan) => (
                    <div key={plan.id} className="flex items-start gap-3 rounded-[8px] bg-cream p-3 text-sm text-ink/70">
                      <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-leaf" aria-hidden="true" />
                      <div>
                        <p className="font-bold text-ink">{plan.daily_calories} kcal</p>
                        <p>{new Date(plan.created_at).toLocaleDateString("it-IT")}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-ink/60">Nessun piano salvato.</p>
                )}
              </div>
            </Card>
          </section>
        ) : null}

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          {readiness.map((item) => (
            <Card key={item.id}>
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-mint text-leaf">
                  {item.status === "ready" ? (
                    <CheckCircle2 size={20} aria-hidden="true" />
                  ) : (
                    <ShieldAlert size={20} aria-hidden="true" />
                  )}
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-ink/45">{item.owner}</p>
                  <h2 className="mt-1 text-xl font-black text-ink">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-ink/65">{item.detail}</p>
                </div>
              </div>
            </Card>
          ))}
        </section>

        <Card className="mt-6">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-leaf text-white">
              <LockKeyhole size={20} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-xl font-black text-ink">Setup richiesto</h2>
              <ol className="mt-3 space-y-2 text-sm leading-6 text-ink/70">
                <li>1. Crea un progetto Supabase.</li>
                <li>2. Esegui `supabase/schema.sql` nel SQL editor.</li>
                <li>3. Copia URL e anon key in `.env.local` e su Vercel.</li>
                <li>4. Attiva provider email o OAuth in Supabase Auth.</li>
              </ol>
              <Button href="/backlog" variant="secondary" className="mt-5">
                Torna al backlog
              </Button>
            </div>
          </div>
        </Card>
      </main>
    </>
  );
}
