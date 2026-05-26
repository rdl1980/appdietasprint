import { Header } from "@/components/Header";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { WarningBox } from "@/components/WarningBox";
import { disclaimerText } from "@/components/DisclaimerText";
import {
  ArrowRight,
  CalendarDays,
  Coins,
  ListChecks,
  RefreshCw,
  Sparkles,
  Utensils,
} from "lucide-react";

const steps = [
  "Inserisci dati, obiettivo e stile alimentare.",
  "Il planner calcola BMR, TDEE e range calorico.",
  "Ricevi pasti, lista spesa e strategie anti-fame.",
];

const diets = [
  "Chetogenica",
  "Mediterranea",
  "Low carb",
  "Ipocalorica bilanciata",
  "Vegetariana",
];

const features = [
  { title: "Modalita Zero Sbatti", icon: Sparkles, text: "Pasti pratici, pochi ingredienti e preparazioni veloci." },
  { title: "Modalita Budget", icon: Coins, text: "Priorita a ingredienti ricorrenti e facili da trovare." },
  { title: "Rigenera Pasto", icon: RefreshCw, text: "Pulsante mock per sostituire un pasto in modo rapido." },
  { title: "Lista Spesa", icon: ListChecks, text: "Ingredienti sommati in automatico sul piano settimanale." },
  { title: "Piano 7 Giorni", icon: CalendarDays, text: "Settimana completa generata da template deterministici." },
  { title: "Coach Anti-Fame", icon: Utensils, text: "Suggerimenti pratici per fame serale, spuntini e sazieta." },
];

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <section className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.03fr_0.97fr] lg:items-center lg:py-16">
          <div>
            <p className="mb-4 inline-flex rounded-full bg-mint px-4 py-2 text-sm font-bold text-leaf">
              MVP planner alimentare AI-assisted
            </p>
            <h1 className="max-w-3xl text-4xl font-black leading-tight text-ink sm:text-6xl">
              Il piano alimentare che si adatta alla tua vita reale, non il contrario.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-ink/70">
              DietaSprint AI crea un piano realistico partendo da calorie, stile alimentare,
              pasti al giorno, esclusioni e livello di semplicita.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button href="/planner" size="lg">
                Crea il piano <ArrowRight size={18} aria-hidden="true" />
              </Button>
              <Button href="/pricing" variant="secondary" size="lg">
                Vedi prezzi
              </Button>
            </div>
          </div>

          <div className="relative min-h-[430px] overflow-hidden rounded-[8px] bg-[url('https://images.unsplash.com/photo-1543352634-a1c51d9f1fa7?auto=format&fit=crop&w=1100&q=80')] bg-cover bg-center shadow-soft">
            <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/25 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 rounded-[8px] bg-white/92 p-4 shadow-soft backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-leaf">Anteprima</p>
                  <h2 className="mt-1 text-xl font-black text-ink">Piano mediterraneo 7 giorni</h2>
                </div>
                <span className="rounded-full bg-lemon/70 px-3 py-1 text-sm font-bold">1820 kcal</span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-semibold text-ink/70">
                <div className="rounded-[8px] bg-mint p-3">BMR calcolato</div>
                <div className="rounded-[8px] bg-mint p-3">Lista spesa</div>
                <div className="rounded-[8px] bg-mint p-3">Anti-fame</div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white/55 py-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-3xl font-black text-ink">Come funziona</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {steps.map((step, index) => (
                <Card key={step}>
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-leaf text-sm font-black text-white">
                    {index + 1}
                  </span>
                  <p className="mt-4 text-base font-semibold leading-7 text-ink">{step}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <h2 className="text-3xl font-black text-ink">Tipi di dieta</h2>
              <p className="mt-3 leading-7 text-ink/65">
                I template v1 rispettano tendenze macro diverse: low carb non e' keto,
                vegetariano include uova, latticini, legumi e tofu.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {diets.map((diet) => (
                <span key={diet} className="rounded-full bg-white px-4 py-3 text-sm font-bold shadow-sm ring-1 ring-ink/10">
                  {diet}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-mint/70 py-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-3xl font-black text-ink">Vita reale, davvero</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Card key={feature.title}>
                    <Icon className="h-6 w-6 text-leaf" aria-hidden="true" />
                    <h3 className="mt-4 text-lg font-bold text-ink">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-ink/65">{feature.text}</p>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-4 px-4 py-12 sm:px-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h2 className="text-3xl font-black text-ink">Gratis per iniziare, Premium quando serve.</h2>
            <p className="mt-2 text-ink/65">Il mock include Free, Premium e Pro con funzioni pensate per la roadmap.</p>
          </div>
          <Button href="/pricing" variant="secondary">
            Apri pricing
          </Button>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
          <WarningBox>{disclaimerText}</WarningBox>
        </section>
      </main>
    </>
  );
}
