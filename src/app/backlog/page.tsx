import { Header } from "@/components/Header";
import { Card } from "@/components/Card";
import {
  AlertTriangle,
  BarChart3,
  Bot,
  CalendarClock,
  CheckCircle2,
  CircleDashed,
  CreditCard,
  Database,
  Globe2,
  LockKeyhole,
  Rocket,
  ShieldCheck,
  Sparkles,
  TestTube2,
  Users,
} from "lucide-react";
import { getP0Readiness, ReadinessStatus } from "@/lib/productionReadiness";

const statusCopy: Record<ReadinessStatus, { label: string; className: string }> = {
  done: { label: "Fatto", className: "bg-leaf text-white" },
  ready: { label: "Pronto", className: "bg-lemon/70 text-ink" },
  blocked: { label: "Bloccato", className: "bg-coral/15 text-coral" },
};

const columns = [
  {
    title: "Backlog",
    tone: "bg-white",
    items: [
      { priority: "P0", title: "Privacy/GDPR definitivo", area: "Legale", icon: ShieldCheck },
      { priority: "P0", title: "Dominio custom", area: "Brand", icon: Globe2 },
      { priority: "P1", title: "AI server-side", area: "Prodotto", icon: Bot },
      { priority: "P1", title: "Stripe subscriptions", area: "Monetizzazione", icon: CreditCard },
      { priority: "P2", title: "Coach anti-fame reale", area: "Engagement", icon: Sparkles },
    ],
  },
  {
    title: "Prossimo sprint",
    tone: "bg-mint",
    items: [
      { priority: "P0", title: "Deploy Vercel", area: "Go-live", icon: Rocket },
      { priority: "P0", title: "Creare progetto Supabase", area: "Dati", icon: Database },
      { priority: "P0", title: "Attivare Supabase Auth", area: "Account", icon: LockKeyhole },
      { priority: "P1", title: "Analytics privacy-first", area: "Misura", icon: BarChart3 },
      { priority: "P1", title: "Error tracking", area: "Qualita", icon: AlertTriangle },
    ],
  },
  {
    title: "Gia pronto",
    tone: "bg-white",
    items: [
      { priority: "OK", title: "Landing + planner", area: "MVP", icon: CheckCircle2 },
      { priority: "OK", title: "Calcolo BMR/TDEE", area: "Core", icon: CheckCircle2 },
      { priority: "OK", title: "Piano 7 giorni mock", area: "Core", icon: CheckCircle2 },
      { priority: "OK", title: "Lista spesa", area: "Core", icon: CheckCircle2 },
      { priority: "OK", title: "Pagine legali MVP", area: "Legale", icon: CheckCircle2 },
      { priority: "OK", title: "Build Next valida", area: "Tech", icon: CheckCircle2 },
      { priority: "OK", title: "Health check /api/health", area: "Deploy", icon: CheckCircle2 },
      { priority: "OK", title: "Schema Supabase con RLS", area: "Dati", icon: CheckCircle2 },
      { priority: "OK", title: "Auth magic link Supabase", area: "Account", icon: CheckCircle2 },
      { priority: "OK", title: "API salvataggio piani", area: "Dati", icon: CheckCircle2 },
      { priority: "OK", title: "Registro richieste GDPR", area: "Legale", icon: CheckCircle2 },
    ],
  },
];

const nextActions = [
  {
    title: "Collegare Vercel al repo",
    detail: "Importare rdl1980/appdietasprint, usare npm run build e pubblicare la demo.",
    owner: "Tech",
  },
  {
    title: "Creare Supabase",
    detail: "Eseguire supabase/schema.sql, copiare URL e anon key, poi provare login e salvataggio.",
    owner: "Tech",
  },
  {
    title: "Compilare dati legali reali",
    detail: "Titolare, email, fornitori, basi giuridiche, retention e revisione GDPR.",
    owner: "Legale",
  },
  {
    title: "Scegliere dominio",
    detail: "Acquistare dominio, collegarlo a Vercel e aggiornare NEXT_PUBLIC_SITE_URL.",
    owner: "Business",
  },
];

const milestones = [
  {
    step: "1",
    title: "Demo pubblica",
    text: "Vercel, dominio, analytics, error tracking, legale revisionato e QA mobile.",
  },
  {
    step: "2",
    title: "Prodotto utilizzabile",
    text: "Login, database, profili salvati, piani persistenti e storico utente.",
  },
  {
    step: "3",
    title: "AI reale",
    text: "Generazione server-side con guardrail salute, sostituzioni e rigenera pasto reale.",
  },
  {
    step: "4",
    title: "Monetizzazione",
    text: "Stripe checkout, customer portal, limiti per piano e webhook abbonamenti.",
  },
];

const readiness = [
  "Build e deploy automatici da GitHub",
  "Nessuna chiave API nel browser",
  "Dati utente salvati in modo sicuro",
  "Copy senza claim medici",
  "GDPR revisionato prima del lancio",
  "Pagamenti testati in sandbox",
  "Percorso mobile fluido",
  "Monitoraggio errori attivo",
];

export default function BacklogPage() {
  const p0Readiness = getP0Readiness();

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <section className="mb-8">
          <p className="mb-3 inline-flex rounded-full bg-mint px-4 py-2 text-sm font-bold text-leaf">
            Roadmap produzione aggiornata
          </p>
          <h1 className="max-w-4xl text-3xl font-black leading-tight text-ink sm:text-5xl">
            Backlog visuale per trasformare DietaSprint AI in una vera app pubblica.
          </h1>
          <p className="mt-4 max-w-3xl leading-7 text-ink/65">
            Aggiornato dopo l'indirizzamento P0: le fondamenta tecniche per account, database,
            health check e deploy sono pronte; restano da collegare servizi esterni e dati legali reali.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-ink shadow-sm ring-1 ring-ink/10">
            <CalendarClock className="h-4 w-4 text-leaf" aria-hidden="true" />
            Ultimo aggiornamento: P0 technical readiness
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {columns.map((column) => (
            <div key={column.title} className={`rounded-[8px] border border-ink/10 p-4 shadow-soft ${column.tone}`}>
              <h2 className="mb-4 text-xl font-black text-ink">{column.title}</h2>
              <div className="space-y-3">
                {column.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <article key={`${column.title}-${item.title}`} className="rounded-[8px] bg-white p-4 shadow-sm ring-1 ring-ink/10">
                      <div className="flex items-start gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-mint text-leaf">
                          <Icon size={18} aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-lemon/60 px-2.5 py-1 text-xs font-black text-ink">
                              {item.priority}
                            </span>
                            <span className="text-xs font-bold uppercase tracking-[0.12em] text-ink/45">
                              {item.area}
                            </span>
                          </div>
                          <h3 className="mt-2 text-base font-black text-ink">{item.title}</h3>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </section>

        <section className="mt-8">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-black text-ink">P0 indirizzati</h2>
              <p className="mt-1 text-sm text-ink/60">
                Cosa e' stato preparato ora e cosa resta bloccato da account esterni o decisioni business.
              </p>
            </div>
            <ButtonLink />
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {p0Readiness.map((item) => {
              const status = statusCopy[item.status];
              return (
                <article key={item.id} className="rounded-[8px] border border-ink/10 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${status.className}`}>
                      {status.label}
                    </span>
                    <CircleDashed className="h-5 w-5 text-ink/35" aria-hidden="true" />
                  </div>
                  <p className="mt-4 text-xs font-bold uppercase tracking-[0.12em] text-ink/45">{item.owner}</p>
                  <h3 className="mt-1 text-base font-black text-ink">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-ink/65">{item.detail}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
          <Card>
            <h2 className="text-2xl font-black text-ink">Next actions P0</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {nextActions.map((action) => (
                <div key={action.title} className="rounded-[8px] border border-ink/10 bg-cream p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-leaf">{action.owner}</p>
                  <h3 className="mt-2 text-base font-black text-ink">{action.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-ink/65">{action.detail}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-leaf text-white">
                <Users size={20} aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-2xl font-black text-ink">Definition of Done</h2>
                <p className="text-sm text-ink/60">Criteri minimi per dire: si puo' andare online.</p>
              </div>
            </div>
            <ul className="mt-5 space-y-3">
              {readiness.map((item) => (
                <li key={item} className="flex gap-3 rounded-[8px] bg-cream p-3 text-sm font-semibold text-ink/75">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-leaf" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        </section>

        <section className="mt-8">
          <Card>
            <h2 className="text-2xl font-black text-ink">Milestone</h2>
            <div className="mt-5 space-y-4">
              {milestones.map((milestone) => (
                <div key={milestone.step} className="grid gap-3 rounded-[8px] border border-ink/10 bg-cream p-4 sm:grid-cols-[48px_1fr]">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-leaf text-lg font-black text-white">
                    {milestone.step}
                  </span>
                  <div>
                    <h3 className="text-lg font-black text-ink">{milestone.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-ink/65">{milestone.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>
      </main>
    </>
  );
}

function ButtonLink() {
  return (
    <a
      href="/account"
      className="inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-bold text-ink shadow-sm ring-1 ring-ink/10 transition hover:bg-mint"
    >
      Apri account P0
    </a>
  );
}
