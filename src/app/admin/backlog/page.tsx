import { redirect } from "next/navigation";
import {
  BarChart3,
  Bot,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Database,
  FileText,
  LockKeyhole,
  ShoppingBasket,
  ShieldCheck,
  Smartphone,
  TestTube2,
  UserRound,
  Utensils,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { getAuthenticatedUser } from "@/lib/supabase/data";
import { isAdminUser } from "@/lib/admin";
import { backlogItems, backlogStatusLabels, type BacklogItem, type BacklogPriority, type BacklogStatus } from "@/lib/productBacklog";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const priorityOrder: Record<BacklogPriority, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };
const statusOrder: Record<BacklogStatus, number> = { next: 0, planned: 1, later: 2, done: 3 };

const areaIcons = {
  Fondamenta: Database,
  Account: LockKeyhole,
  Privacy: ShieldCheck,
  Planner: ClipboardList,
  Nutrizione: Utensils,
  Piani: FileText,
  Spesa: ShoppingBasket,
  "AI coach": Bot,
  Premium: CreditCard,
  Admin: UserRound,
  Qualita: TestTube2,
  Growth: BarChart3,
  Mobile: Smartphone,
} as const;

const priorityColumns: Array<{ priority: BacklogPriority; title: string; detail: string }> = [
  { priority: "P0", title: "Da chiudere per beta", detail: "Blocchi residui prima della beta pubblica." },
  { priority: "P1", title: "Prossimo sprint", detail: "Funzioni prioritarie per prodotto, sicurezza e monetizzazione." },
  { priority: "P2", title: "Dopo beta", detail: "Migliorie di valore quando il nucleo e' stabile." },
  { priority: "P3", title: "Espansioni", detail: "Evoluzioni di lungo periodo e canali mobile." },
];

function byOperationalPriority(a: BacklogItem, b: BacklogItem) {
  return (
    priorityOrder[a.priority] - priorityOrder[b.priority] ||
    statusOrder[a.status] - statusOrder[b.status] ||
    a.area.localeCompare(b.area) ||
    a.title.localeCompare(b.title)
  );
}

const checklist = [
  "Registrazione -> conferma email -> login -> account",
  "Planner -> screening salute -> risultati -> salva piano -> storico/dettaglio account",
  "Reset password -> cambio password -> nuovo login",
  "Richiesta privacy/GDPR salvata correttamente",
  "Controllo responsive mobile su landing, planner, risultati e account",
];

export default async function AdminBacklogPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login?authError=admin_login_required&from=/admin/backlog");
  }

  if (!isAdminUser(user)) {
    redirect("/account?adminError=not_admin");
  }

  const remainingItems = backlogItems.filter((item) => item.status !== "done").sort(byOperationalPriority);
  const doneCount = backlogItems.filter((item) => item.status === "done").length;
  const p0OpenCount = remainingItems.filter((item) => item.priority === "P0").length;
  const monetizationCount = remainingItems.filter((item) => item.area === "Premium").length;
  const metrics = [
    { label: "Completate", value: doneCount.toString(), detail: "Voci marcate Fatto nella sorgente unica del backlog." },
    { label: "P0 aperte", value: p0OpenCount.toString(), detail: "Da chiudere prima della beta pubblica." },
    { label: "Monetizzazione", value: monetizationCount.toString(), detail: "Feature premium e Stripe ancora aperte." },
  ];

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
              Backlog operativo Diet Sprint AI.
            </h1>
            <p className="mt-4 max-w-3xl leading-7 text-ink/65">
              Roadmap interna per portare l'app da MVP funzionante a prodotto pronto per beta pubblica e produzione.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-ink shadow-sm ring-1 ring-ink/10">
            <CalendarClock className="h-4 w-4 text-leaf" aria-hidden="true" />
            Aggiornato: 05 giu 2026
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
          {priorityColumns.map((column) => {
            const items = remainingItems.filter((item) => item.priority === column.priority);

            return (
              <div key={column.priority} className="rounded-[8px] border border-ink/10 bg-white p-4 shadow-soft">
                <h2 className="mb-4 text-xl font-black text-ink">{column.title}</h2>
                <p className="mb-4 text-sm leading-6 text-ink/60">{column.detail}</p>
                <div className="space-y-3">
                  {items.map((item) => {
                    const Icon = areaIcons[item.area as keyof typeof areaIcons] ?? CheckCircle2;

                    return (
                      <article key={item.id} className="rounded-[8px] bg-white p-4 shadow-sm ring-1 ring-ink/10">
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
                            <p className="mt-2 text-sm leading-6 text-ink/60">{item.detail}</p>
                            <p className="mt-3 text-xs font-bold text-leaf">{backlogStatusLabels[item.status]}</p>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                  {items.length === 0 ? (
                    <div className="rounded-[8px] border border-dashed border-ink/15 bg-cream p-4 text-sm font-semibold text-ink/60">
                      Nessuna voce aperta.
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
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
              <Button href="/admin/privacy" variant="secondary">Coda GDPR</Button>
            </div>
          </Card>
        </section>
      </main>
    </>
  );
}
