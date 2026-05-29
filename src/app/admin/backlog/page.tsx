import { redirect } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  Bot,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Database,
  FileText,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  TestTube2,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/admin";

const columns = [
  {
    title: "Fatto",
    tone: "bg-mint",
    items: [
      { priority: "OK", title: "Dominio dietsprintai.com", area: "Go-live", icon: CheckCircle2 },
      { priority: "OK", title: "Auth email/password", area: "Account", icon: LockKeyhole },
      { priority: "OK", title: "Supabase profili e piani", area: "Dati", icon: Database },
      { priority: "OK", title: "Planner + piano 7 giorni", area: "Prodotto", icon: CheckCircle2 },
      { priority: "OK", title: "Email Resend funzionante", area: "Comunicazioni", icon: CheckCircle2 },
    ],
  },
  {
    title: "Da chiudere P0",
    tone: "bg-white",
    items: [
      { priority: "P0", title: "QA registrazione end-to-end", area: "Account", icon: TestTube2 },
      { priority: "P0", title: "Revisione legale reale", area: "GDPR", icon: ShieldCheck },
      { priority: "P0", title: "Error tracking produzione", area: "Qualita", icon: AlertTriangle },
      { priority: "P0", title: "Backup e retention dati", area: "Dati", icon: Database },
    ],
  },
  {
    title: "Prossimo sprint",
    tone: "bg-white",
    items: [
      { priority: "P1", title: "Modifica profilo utente", area: "Account", icon: LockKeyhole },
      { priority: "P1", title: "Dettaglio piano salvato", area: "Prodotto", icon: FileText },
      { priority: "P1", title: "Elimina piano/profilo", area: "GDPR", icon: ShieldCheck },
      { priority: "P1", title: "Analytics privacy-first", area: "Misura", icon: BarChart3 },
    ],
  },
  {
    title: "Dopo beta",
    tone: "bg-white",
    items: [
      { priority: "P1", title: "Stripe subscriptions", area: "Revenue", icon: CreditCard },
      { priority: "P1", title: "AI server-side", area: "AI", icon: Bot },
      { priority: "P2", title: "Coach anti-fame reale", area: "Engagement", icon: Sparkles },
      { priority: "P2", title: "Export PDF reale", area: "Output", icon: FileText },
    ],
  },
];

const metrics = [
  { label: "Core MVP", value: "85%", detail: "Planner, risultati, salvataggio e account sono attivi." },
  { label: "Pronto beta", value: "62%", detail: "Mancano QA, legale finale e monitoraggio errori." },
  { label: "Monetizzazione", value: "15%", detail: "Pricing mock presente, Stripe ancora da implementare." },
];

const checklist = [
  "Registrazione -> conferma email -> login -> account",
  "Planner -> risultati -> salva piano -> storico account",
  "Reset password -> cambio password -> nuovo login",
  "Richiesta privacy/GDPR salvata correttamente",
  "Controllo responsive mobile su landing, planner, risultati e account",
];

export default async function AdminBacklogPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const user = data.user;

  if (!user) {
    redirect("/login?authError=admin_login_required");
  }

  if (!isAdminUser(user)) {
    redirect("/account?adminError=not_admin");
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <section className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-3 inline-flex rounded-full bg-mint px-4 py-2 text-sm font-bold text-leaf">
              Admin
            </p>
            <h1 className="max-w-4xl text-3xl font-black leading-tight text-ink sm:text-5xl">
              Backlog operativo DietaSprint AI.
            </h1>
            <p className="mt-4 max-w-3xl leading-7 text-ink/65">
              Roadmap interna per portare l'app da MVP funzionante a prodotto pronto per beta pubblica e produzione.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-ink shadow-sm ring-1 ring-ink/10">
            <CalendarClock className="h-4 w-4 text-leaf" aria-hidden="true" />
            Aggiornato: area admin
          </div>
        </section>

        <section className="mb-6 grid gap-4 md:grid-cols-3">
          {metrics.map((metric) => (
            <Card key={metric.label}>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-leaf">{metric.label}</p>
              <p className="mt-3 text-4xl font-black text-ink">{metric.value}</p>
              <p className="mt-2 text-sm leading-6 text-ink/65">{metric.detail}</p>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-4">
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

        <section className="mt-8 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
          <Card>
            <h2 className="text-2xl font-black text-ink">Checklist test beta</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {checklist.map((item) => (
                <div key={item} className="flex gap-3 rounded-[8px] border border-ink/10 bg-cream p-4 text-sm font-semibold text-ink/75">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-leaf" aria-hidden="true" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-2xl font-black text-ink">Azioni veloci</h2>
            <div className="mt-5 grid gap-3">
              <Button href="/planner">Testa planner</Button>
              <Button href="/account" variant="secondary">Apri account</Button>
              <Button href="/account/privacy" variant="secondary">Privacy utente</Button>
            </div>
          </Card>
        </section>
      </main>
    </>
  );
}
