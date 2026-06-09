import { Header } from "@/components/Header";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { WarningBox } from "@/components/WarningBox";
import { isSupabaseConfigured } from "@/lib/env";
import { getPlanTier } from "@/lib/entitlements";
import { createAuthenticatedSupabaseClient } from "@/lib/supabase/data";
import { CalendarDays, KeyRound, ListChecks, LockKeyhole, Plus, ShieldCheck, UserRound } from "lucide-react";

type ProfileRow = {
  id: string;
  diet_type: string;
  target_calories: number | null;
  meals_per_day: number;
  created_at: string;
};

type PlanRow = {
  id: string;
  daily_calories: number;
  warnings: string[] | null;
  created_at: string;
};

const dietLabels: Record<string, string> = {
  ketogenic: "Chetogenica",
  mediterranean: "Mediterranea",
  lowCarb: "Low carb",
  balanced: "Bilanciata ipocalorica",
  vegetarian: "Vegetariana",
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

type AccountPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const params = searchParams ? await searchParams : {};
  const checkoutState = typeof params.checkout === "string" ? params.checkout : "";
  const supabaseConfigured = isSupabaseConfigured();
  const { supabase, user } = await createAuthenticatedSupabaseClient();

  const { data: profiles } =
    supabase && user
      ? await supabase
          .from("user_profiles")
          .select("id,diet_type,target_calories,meals_per_day,created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(4)
      : { data: [] as ProfileRow[] };

  const { data: plans } =
    supabase && user
      ? await supabase
          .from("meal_plans")
          .select("id,daily_calories,warnings,created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(4)
      : { data: [] as PlanRow[] };

  const latestProfile = profiles?.[0] as ProfileRow | undefined;
  const latestPlan = plans?.[0] as PlanRow | undefined;
  const planTier = getPlanTier(user);
  const isPremium = planTier === "premium";

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {!supabaseConfigured ? (
          <div className="mb-6">
            <WarningBox tone="strong">
              Account non disponibile: mancano le variabili Supabase nell'ambiente di produzione.
            </WarningBox>
          </div>
        ) : null}

        {user && checkoutState === "success" ? (
          <div className="mb-6 rounded-[8px] border border-leaf/25 bg-mint p-4 text-sm font-semibold text-leaf">
            {isPremium
              ? "Pagamento ricevuto. Premium e' attivo sul tuo account."
              : "Pagamento ricevuto. L'attivazione Premium e' in corso e arrivera' appena Stripe conferma il webhook."}
          </div>
        ) : null}

        {user && checkoutState === "already-premium" ? (
          <div className="mb-6 rounded-[8px] border border-leaf/25 bg-mint p-4 text-sm font-semibold text-leaf">
            Premium e' gia' attivo sul tuo account.
          </div>
        ) : null}

        {!user ? (
          <section className="mx-auto max-w-3xl py-10 text-center">
            <p className="mx-auto mb-4 inline-flex rounded-full bg-mint px-4 py-2 text-sm font-bold text-leaf">
              Area personale
            </p>
            <h1 className="text-3xl font-black leading-tight text-ink sm:text-5xl">
              Accedi per salvare e ritrovare i tuoi piani.
            </h1>
            <p className="mx-auto mt-4 max-w-2xl leading-7 text-ink/65">
              Con un account puoi conservare profili alimentari, piani settimanali e liste spesa in modo persistente.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Button href="/onboarding" variant="secondary">Percorso guidato</Button>
              <Button href="/login">Accedi</Button>
              <Button href="/register" variant="secondary">Crea account</Button>
            </div>
          </section>
        ) : (
          <>
            <section className="flex flex-col gap-5 rounded-[8px] border border-ink/10 bg-white p-5 shadow-soft sm:p-7 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-mint text-leaf">
                  <UserRound size={26} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.12em] text-leaf">Account</p>
                  <h1 className="mt-1 text-2xl font-black text-ink sm:text-4xl">
                    Ciao, {user.email}
                  </h1>
                  <p className="mt-2 text-sm leading-6 text-ink/65">
                    Gestisci piani, profili alimentari, privacy e sicurezza del tuo account.
                  </p>
                  <p className="mt-3 inline-flex rounded-full bg-cream px-3 py-1 text-xs font-black text-ink">
                    Piano {isPremium ? "Premium" : "Free"}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button href="/planner">
                  <Plus size={18} aria-hidden="true" />
                  Nuovo piano
                </Button>
                <Button href="/auth/logout" variant="secondary">
                  Esci
                </Button>
              </div>
            </section>

            <section className="mt-5 grid gap-4 md:grid-cols-3">
              <Card>
                <div className="flex items-center gap-3">
                  <CalendarDays className="h-5 w-5 text-leaf" aria-hidden="true" />
                  <h2 className="text-lg font-black text-ink">Ultimo piano</h2>
                </div>
                <p className="mt-3 text-3xl font-black text-ink">
                  {latestPlan ? `${latestPlan.daily_calories} kcal` : "--"}
                </p>
                <p className="mt-1 text-sm text-ink/60">
                  {latestPlan ? formatDate(latestPlan.created_at) : "Crea il primo piano dal planner."}
                </p>
              </Card>
              <Card>
                <div className="flex items-center gap-3">
                  <ListChecks className="h-5 w-5 text-leaf" aria-hidden="true" />
                  <h2 className="text-lg font-black text-ink">Profilo attivo</h2>
                </div>
                <p className="mt-3 text-2xl font-black text-ink">
                  {latestProfile ? dietLabels[latestProfile.diet_type] || latestProfile.diet_type : "Non salvato"}
                </p>
                <p className="mt-1 text-sm text-ink/60">
                  {latestProfile
                    ? `${latestProfile.meals_per_day} pasti al giorno`
                    : "Salva un piano per creare il profilo."}
                </p>
              </Card>
              <Card>
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-leaf" aria-hidden="true" />
                  <h2 className="text-lg font-black text-ink">Privacy</h2>
                </div>
                <p className="mt-3 text-sm leading-6 text-ink/65">
                  Richieste GDPR, consensi e dati personali restano accessibili dalla tua area.
                </p>
                <Button href="/account/privacy" variant="secondary" size="sm" className="mt-4">
                  Gestisci privacy
                </Button>
              </Card>
            </section>

            <section className="mt-5 grid gap-4 lg:grid-cols-2">
              <Card>
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-xl font-black text-ink">Piani salvati</h2>
                  <div className="flex gap-2">
                    <Button href="/account/plans" variant="secondary" size="sm">Vedi tutti</Button>
                    <Button href="/planner" variant="secondary" size="sm">Crea</Button>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {plans?.length ? (
                    plans.map((plan) => (
                      <a
                        key={plan.id}
                        href={`/account/plans/${plan.id}`}
                        className="block rounded-[8px] border border-ink/10 bg-cream p-4 transition hover:border-leaf/40 hover:bg-mint/40"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-black text-ink">{plan.daily_calories} kcal giornaliere</p>
                            <p className="mt-1 text-sm text-ink/60">{formatDate(plan.created_at)}</p>
                          </div>
                          <CalendarDays className="h-5 w-5 shrink-0 text-leaf" aria-hidden="true" />
                        </div>
                        {plan.warnings?.length ? (
                          <p className="mt-2 text-xs font-semibold text-coral">
                            {plan.warnings.length} avviso calorie/sicurezza
                          </p>
                        ) : null}
                      </a>
                    ))
                  ) : (
                    <p className="rounded-[8px] bg-cream p-4 text-sm text-ink/60">
                      Nessun piano salvato. Genera un piano dal planner e salvalo nei risultati.
                    </p>
                  )}
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-xl font-black text-ink">Profili alimentari</h2>
                  <Button href="/account/profile" variant="secondary" size="sm">Modifica</Button>
                </div>
                <div className="mt-4 space-y-3">
                  {profiles?.length ? (
                    profiles.map((profile) => (
                      <div key={profile.id} className="rounded-[8px] border border-ink/10 bg-cream p-4">
                        <p className="font-black text-ink">
                          {dietLabels[profile.diet_type] || profile.diet_type}
                        </p>
                        <p className="mt-1 text-sm text-ink/60">
                          {profile.meals_per_day} pasti - {profile.target_calories || "calorie suggerite"} kcal
                        </p>
                        <p className="mt-1 text-xs text-ink/45">{formatDate(profile.created_at)}</p>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-[8px] bg-cream p-4 text-sm text-ink/60">
                      Nessun profilo salvato. Il profilo nasce quando salvi un piano.
                    </p>
                  )}
                </div>
              </Card>
            </section>

            <section className="mt-5 grid gap-4 md:grid-cols-2">
              <Card>
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-mint text-leaf">
                    <KeyRound size={20} aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="text-xl font-black text-ink">Sicurezza</h2>
                    <p className="mt-2 text-sm leading-6 text-ink/65">
                      Aggiorna la password del tuo account quando vuoi.
                    </p>
                    <Button href="/account/password" variant="secondary" size="sm" className="mt-4">
                      Cambia password
                    </Button>
                  </div>
                </div>
              </Card>
              <Card>
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-mint text-leaf">
                    <LockKeyhole size={20} aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="text-xl font-black text-ink">Accesso</h2>
                    <p className="mt-2 text-sm leading-6 text-ink/65">
                      Il tuo account usa email e password. L'accesso tramite magic link non e' disponibile.
                    </p>
                  </div>
                </div>
              </Card>
            </section>
          </>
        )}
      </main>
    </>
  );
}
