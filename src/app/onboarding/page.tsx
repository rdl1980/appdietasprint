import { CheckCircle2, ClipboardList, LockKeyhole, ShieldCheck } from "lucide-react";
import { Header } from "@/components/Header";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";

const steps = [
  {
    title: "Crea o accedi all'account",
    detail: "Serve per salvare profilo, piano settimanale, lista spesa e consensi.",
    href: "/register",
    action: "Crea account",
    icon: LockKeyhole,
  },
  {
    title: "Compila il planner",
    detail: "Profilo, obiettivo, dieta, allergie, tempo cucina e screening salute.",
    href: "/planner",
    action: "Apri planner",
    icon: ClipboardList,
  },
  {
    title: "Controlla il piano",
    detail: "Verifica macro, pasti, sostituzioni, lista spesa e disclaimer.",
    href: "/results",
    action: "Vai ai risultati",
    icon: CheckCircle2,
  },
  {
    title: "Gestisci privacy",
    detail: "Export dati, consensi, richieste GDPR ed eliminazione account restano nell'area privacy.",
    href: "/account/privacy",
    action: "Privacy account",
    icon: ShieldCheck,
  },
];

export default function OnboardingPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <section className="mb-7 max-w-3xl">
          <p className="mb-3 inline-flex rounded-full bg-mint px-4 py-2 text-sm font-bold text-leaf">
            Onboarding
          </p>
          <h1 className="text-3xl font-black leading-tight text-ink sm:text-5xl">
            Arriva al primo piano salvato senza passaggi inutili.
          </h1>
          <p className="mt-4 leading-7 text-ink/65">
            Percorso essenziale per configurare account, planner, risultato e privacy prima della beta.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <Card key={step.title}>
                <div className="flex items-center justify-between gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-mint text-leaf">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <span className="rounded-full bg-lemon/70 px-2.5 py-1 text-xs font-black text-ink">
                    {index + 1}
                  </span>
                </div>
                <h2 className="mt-5 text-xl font-black text-ink">{step.title}</h2>
                <p className="mt-2 text-sm leading-6 text-ink/65">{step.detail}</p>
                <Button href={step.href} variant={index === 0 ? "primary" : "secondary"} size="sm" className="mt-5">
                  {step.action}
                </Button>
              </Card>
            );
          })}
        </section>
      </main>
    </>
  );
}
