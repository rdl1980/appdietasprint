"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { GroceryList } from "@/components/GroceryList";
import { MealCard } from "@/components/MealCard";
import { WarningBox } from "@/components/WarningBox";
import { disclaimerText } from "@/components/DisclaimerText";
import { generateMealPlan } from "@/lib/generateMealPlan";
import { MealPlan, UserProfile } from "@/lib/types";
import { CalendarDays, Download, HeartPulse, RefreshCw, ShieldCheck } from "lucide-react";

const dietCopy: Record<UserProfile["dietType"], string> = {
  ketogenic: "Carboidrati molto bassi, proteine moderate/alte, grassi moderati. Evita pane, pasta, riso, patate e zuccheri.",
  mediterranean: "Schema bilanciato con cereali integrali, legumi, pesce, verdure e olio extravergine.",
  lowCarb: "Carboidrati ridotti ma non chetogenici, con piu spazio a proteine e verdure.",
  balanced: "Deficit calorico semplice, con tutti i gruppi alimentari permessi.",
  vegetarian: "Opzioni con uova, latticini, legumi e tofu per sostenere proteine e sazieta.",
};

const substitutions = [
  "Pollo -> tacchino, tonno al naturale o tofu compatto.",
  "Farro/riso/quinoa -> patate, pane integrale o legumi in porzioni equivalenti.",
  "Yogurt/skyr -> ricotta magra, kefir o alternativa vegetale proteica.",
  "Salmone/orata -> sgombro, merluzzo o uova se preferisci un'opzione piu economica.",
];

const hungerTips = [
  "Inserisci verdure voluminose a pranzo e cena prima di aumentare le calorie.",
  "Tieni una quota proteica in ogni pasto: aiuta a gestire fame e snack impulsivi.",
  "Per fame serale, sposta lo snack nel dopocena invece di eliminarlo.",
  "Bevi acqua e pianifica pasti semplici: la costanza batte il piano perfetto.",
];

export function ResultsClient() {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem("dietaSprintProfile");
    if (stored) {
      setProfile(JSON.parse(stored) as UserProfile);
    }
  }, []);

  const plan: MealPlan | null = useMemo(() => (profile ? generateMealPlan(profile) : null), [profile]);

  if (!profile || !plan) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <Card className="text-center">
          <h1 className="text-3xl font-black text-ink">Nessun piano trovato</h1>
          <p className="mt-3 text-ink/65">Compila il planner per generare il piano alimentare dimostrativo.</p>
          <Button href="/planner" className="mt-6">
            Vai al planner
          </Button>
        </Card>
      </main>
    );
  }

  const firstDay = plan.days[0];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_360px]">
        <div>
          <p className="mb-3 inline-flex rounded-full bg-mint px-4 py-2 text-sm font-bold text-leaf">
            Piano generato
          </p>
          <h1 className="text-3xl font-black text-ink sm:text-5xl">La tua settimana DietaSprint.</h1>
          <p className="mt-3 max-w-3xl leading-7 text-ink/65">
            Piano locale deterministico, pensato come MVP. Le calorie sono approssimative e non sostituiscono
            una valutazione professionale.
          </p>
        </div>
        <Card>
          <p className="text-sm font-semibold text-ink/60">Target giornaliero</p>
          <p className="mt-1 text-4xl font-black text-ink">{plan.dailyCalories} kcal</p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-[8px] bg-cream p-3">
              <span className="block text-ink/55">BMR</span>
              <strong>{plan.calorieResult.bmr}</strong>
            </div>
            <div className="rounded-[8px] bg-cream p-3">
              <span className="block text-ink/55">TDEE</span>
              <strong>{plan.calorieResult.tdee}</strong>
            </div>
          </div>
        </Card>
      </div>

      {plan.warnings.length ? (
        <div className="mb-6 space-y-3">
          {plan.warnings.map((warning) => (
            <WarningBox key={warning} tone={warning.includes("forte") ? "strong" : "soft"}>
              {warning}
            </WarningBox>
          ))}
        </div>
      ) : null}

      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <Card>
          <ShieldCheck className="h-6 w-6 text-leaf" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-bold text-ink">Tendenza macro</h2>
          <p className="mt-2 text-sm leading-6 text-ink/65">{dietCopy[profile.dietType]}</p>
        </Card>
        <Card>
          <CalendarDays className="h-6 w-6 text-leaf" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-bold text-ink">Piano 7 Giorni</h2>
          <p className="mt-2 text-sm leading-6 text-ink/65">
            {profile.mealsPerDay} pasti al giorno, con lista spesa aggregata e pasti compatibili.
          </p>
        </Card>
        <Card>
          <HeartPulse className="h-6 w-6 text-leaf" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-bold text-ink">Coach Anti-Fame</h2>
          <p className="mt-2 text-sm leading-6 text-ink/65">
            Strategie pratiche per aumentare sazieta senza trasformare il piano in una gabbia.
          </p>
        </Card>
      </section>

      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-ink">Piano 1 giorno</h2>
            <p className="text-sm text-ink/60">{firstDay.label}: {firstDay.calories} kcal circa</p>
          </div>
          <Button type="button" variant="secondary" size="sm">
            <RefreshCw size={16} aria-hidden="true" />
            Rigenera
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {firstDay.meals.map((meal, index) => (
            <MealCard key={`${firstDay.day}-${meal.id}-${index}`} meal={meal} />
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-black text-ink">Piano 7 giorni</h2>
        <div className="space-y-4">
          {plan.days.map((day) => (
            <Card key={day.day}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-black text-ink">{day.label}</h3>
                  <p className="text-sm text-ink/60">
                    {day.calories} kcal circa - P {day.protein} g / C {day.carbs} g / G {day.fats} g
                  </p>
                </div>
                <Button type="button" variant="ghost" size="sm" className="ring-1 ring-ink/10">
                  <Download size={16} aria-hidden="true" />
                  PDF placeholder
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                {day.meals.map((meal, index) => (
                  <MealCard key={`${day.day}-${meal.id}-${meal.mealType}-${index}`} meal={meal} />
                ))}
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="mb-8 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-xl font-black text-ink">Sostituzioni</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-ink/70">
            {substitutions.map((substitution) => (
              <li key={substitution}>{substitution}</li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="text-xl font-black text-ink">Strategia anti-fame</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-ink/70">
            {hungerTips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </Card>
      </section>

      <section className="mb-8">
        <GroceryList items={plan.groceryList} />
      </section>

      <WarningBox>{disclaimerText}</WarningBox>
    </main>
  );
}
