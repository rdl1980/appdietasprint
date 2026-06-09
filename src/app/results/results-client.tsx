"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { AiCoachPanel } from "@/components/AiCoachPanel";
import { GroceryList } from "@/components/GroceryList";
import { MealCard } from "@/components/MealCard";
import { SavePlanButton } from "@/components/SavePlanButton";
import { WarningBox } from "@/components/WarningBox";
import { disclaimerText } from "@/components/DisclaimerText";
import { generateMealPlan, getMealSubstitutions, regenerateMeal } from "@/lib/generateMealPlan";
import type { PlanTier } from "@/lib/entitlements";
import { MealPlan, UserProfile } from "@/lib/types";
import { CalendarDays, Crown, Download, HeartPulse, RefreshCw, ShieldCheck } from "lucide-react";

const dietCopy: Record<UserProfile["dietType"], string> = {
  ketogenic: "Carboidrati molto bassi, proteine moderate/alte, grassi moderati. Evita pane, pasta, riso, patate e zuccheri.",
  mediterranean: "Schema bilanciato con cereali integrali, legumi, pesce, verdure e olio extravergine.",
  lowCarb: "Carboidrati ridotti ma non chetogenici, con piu spazio a proteine e verdure.",
  balanced: "Deficit calorico semplice, con tutti i gruppi alimentari permessi.",
  vegetarian: "Opzioni con uova, latticini, legumi e tofu per sostenere proteine e sazieta.",
};

const hungerTips = [
  "Inserisci verdure voluminose a pranzo e cena prima di aumentare le calorie.",
  "Tieni una quota proteica in ogni pasto: aiuta a gestire fame e snack impulsivi.",
  "Per fame serale, sposta lo snack nel dopocena invece di eliminarlo.",
  "Bevi acqua e pianifica pasti semplici: la costanza batte il piano perfetto.",
];

type ResultsClientProps = {
  planTier: PlanTier;
};

const profileStorageKey = "dietSprintProfile";
const legacyProfileStorageKey = "dietaSprintProfile";

export function ResultsClient({ planTier }: ResultsClientProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const isPremium = planTier === "premium";

  useEffect(() => {
    const stored = window.localStorage.getItem(profileStorageKey) || window.localStorage.getItem(legacyProfileStorageKey);
    if (stored) {
      const nextProfile = JSON.parse(stored) as UserProfile;
      window.localStorage.setItem(profileStorageKey, JSON.stringify(nextProfile));
      window.localStorage.removeItem(legacyProfileStorageKey);
      setProfile(nextProfile);
      setPlan(generateMealPlan(nextProfile, { days: isPremium ? 7 : 1 }));
    }
  }, [isPremium]);

  function regenerateSingleMeal(dayNumber: number, mealIndex: number) {
    if (!profile || !plan) {
      return;
    }

    if (isPremium) {
      setPlan(regenerateMeal(plan, profile, dayNumber, mealIndex));
    }
  }

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
          <h1 className="text-3xl font-black text-ink sm:text-5xl">
            {isPremium ? "La tua settimana Diet Sprint AI." : "Il tuo giorno Diet Sprint AI."}
          </h1>
          <p className="mt-3 max-w-3xl leading-7 text-ink/65">
            {isPremium
              ? "Piano settimanale completo. Le calorie sono approssimative e non sostituiscono una valutazione professionale."
              : "Piano giornaliero Free. Premium sblocca settimana completa, salvataggio, sostituzioni e lista spesa estesa."}
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

      {!isPremium ? (
        <div className="mb-6">
          <WarningBox>
            Free genera solo il piano giornaliero e non consente salvataggio. Premium e' un acquisto una tantum che sblocca tutte le funzioni.
          </WarningBox>
        </div>
      ) : null}

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
          <p className="mt-2 text-sm font-semibold text-ink">
            P {plan.macroTarget.proteinGrams[0]}-{plan.macroTarget.proteinGrams[1]} g / C{" "}
            {plan.macroTarget.carbsGrams[0]}-{plan.macroTarget.carbsGrams[1]} g / G{" "}
            {plan.macroTarget.fatsGrams[0]}-{plan.macroTarget.fatsGrams[1]} g
          </p>
        </Card>
        <Card>
          <CalendarDays className="h-6 w-6 text-leaf" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-bold text-ink">{isPremium ? "Piano 7 giorni" : "Piano giornaliero"}</h2>
          <p className="mt-2 text-sm leading-6 text-ink/65">
            {isPremium
              ? `${profile.mealsPerDay} pasti al giorno, con lista spesa aggregata e pasti compatibili.`
              : `${profile.mealsPerDay} pasti in un giorno dimostrativo.`}
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
          <Button type="button" variant="secondary" size="sm" disabled={!isPremium}>
            <RefreshCw size={16} aria-hidden="true" />
            {isPremium ? "Rigenera" : "Premium"}
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {firstDay.meals.map((meal, index) => (
            <MealCard
              key={`${firstDay.day}-${meal.id}-${index}`}
              meal={meal}
              substitutions={getMealSubstitutions(meal, profile)}
              onRegenerate={() => regenerateSingleMeal(firstDay.day, index)}
              locked={!isPremium}
            />
          ))}
        </div>
      </section>

      {isPremium ? (
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
                    <MealCard
                      key={`${day.day}-${meal.id}-${meal.mealType}-${index}`}
                      meal={meal}
                      substitutions={getMealSubstitutions(meal, profile)}
                      onRegenerate={() => regenerateSingleMeal(day.day, index)}
                    />
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </section>
      ) : (
        <section className="mb-8">
          <Card>
            <Crown className="h-6 w-6 text-leaf" aria-hidden="true" />
            <h2 className="mt-3 text-xl font-black text-ink">Premium sblocca la settimana completa</h2>
            <p className="mt-2 text-sm leading-6 text-ink/65">
              Con l'acquisto una tantum ottieni piano 7 giorni, rigenerazione pasti, sostituzioni, lista spesa completa e salvataggio account.
            </p>
            <Button href="/pricing" className="mt-5" size="sm">
              Vedi Premium
            </Button>
          </Card>
        </section>
      )}

      <section className="mb-8 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-xl font-black text-ink">Sostituzioni</h2>
          <p className="mt-4 text-sm leading-6 text-ink/70">
            {isPremium
              ? "Ogni card pasto mostra alternative compatibili per dieta, allergie e cibi esclusi. Il pulsante rigenera sostituisce solo quel pasto e aggiorna lista spesa e totali del giorno."
              : "Le sostituzioni sono una funzione Premium."}
          </p>
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

      {isPremium ? (
        <section className="mb-8">
          <AiCoachPanel profile={profile} plan={plan} />
        </section>
      ) : null}

      {isPremium ? (
        <section className="mb-8">
          <GroceryList items={plan.groceryList} />
        </section>
      ) : null}

      <section className="mb-8">
        <Card>
          <h2 className="text-xl font-black text-ink">Salva nel tuo account</h2>
          <p className="mt-2 text-sm leading-6 text-ink/65">
            {isPremium
              ? "Con Supabase configurato puoi salvare profilo, piano settimanale e lista spesa in modo persistente."
              : "Il salvataggio e' disponibile solo con Premium."}
          </p>
          <div className="mt-5">
            <SavePlanButton profile={profile} plan={plan} disabled={!isPremium} />
          </div>
        </Card>
      </section>

      <WarningBox>{disclaimerText}</WarningBox>
    </main>
  );
}
