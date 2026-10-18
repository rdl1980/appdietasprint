import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CalendarDays, ShieldCheck } from "lucide-react";
import { Header } from "@/components/Header";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { DeletePlanButton } from "@/components/DeletePlanButton";
import { DuplicatePlanButton } from "@/components/DuplicatePlanButton";
import { GroceryList } from "@/components/GroceryList";
import { MealCard } from "@/components/MealCard";
import { WarningBox } from "@/components/WarningBox";
import { createAuthenticatedSupabaseClient } from "@/lib/supabase/data";
import { profileFromRow } from "@/lib/databaseMappers";
import { getMealSubstitutions } from "@/lib/generateMealPlan";
import { getMacroTarget } from "@/lib/macroTargets";
import type { CalorieResult, GroceryItem, MacroTarget, MealPlanDay, UserProfile } from "@/lib/types";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

type PlanPayload = {
  days?: MealPlanDay[];
  calorieResult?: CalorieResult;
  profile?: UserProfile;
  macroTarget?: MacroTarget;
};

type PlanRow = {
  id: string;
  profile_id: string | null;
  daily_calories: number;
  plan: PlanPayload;
  grocery_list: GroceryItem[];
  warnings: string[] | null;
  created_at: string;
};

type ProfileRow = Parameters<typeof profileFromRow>[0] & {
  id: string;
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
    month: "long",
    year: "numeric",
  });
}

export default async function AccountPlanDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { supabase, user } = await createAuthenticatedSupabaseClient();

  if (!user) {
    redirect(`/login?from=/account/plans/${encodeURIComponent(id)}`);
  }

  if (!supabase) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <WarningBox tone="strong">Dettaglio piano non disponibile.</WarningBox>
        </main>
      </>
    );
  }

  const { data: plan } = await supabase
    .from("meal_plans")
    .select("id,profile_id,daily_calories,plan,grocery_list,warnings,created_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!plan) {
    notFound();
  }

  const planRow = plan as PlanRow;
  const { data: profile } = planRow.profile_id
    ? await supabase
        .from("user_profiles")
        .select(
          "id,sex,age,height_cm,weight_kg,activity_level,goal,diet_type,target_calories,meals_per_day,excluded_foods,simplicity_level,budget_mode,created_at",
        )
        .eq("id", planRow.profile_id)
        .eq("user_id", user.id)
        .single()
    : { data: null };
  const userProfile = planRow.plan?.profile || (profile ? profileFromRow(profile as ProfileRow) : null);
  const days = planRow.plan?.days || [];
  const calorieResult = planRow.plan?.calorieResult;
  const macroTarget = planRow.plan?.macroTarget || (userProfile ? getMacroTarget(userProfile.dietType, planRow.daily_calories) : null);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <Button href="/account/plans" variant="ghost" size="sm" className="ring-1 ring-ink/10">
            <ArrowLeft size={16} aria-hidden="true" />
            Storico
          </Button>
        </div>

        <section className="mb-6 grid gap-4 lg:grid-cols-[1fr_340px]">
          <div>
            <p className="mb-3 inline-flex rounded-full bg-mint px-4 py-2 text-sm font-bold text-leaf">
              Piano salvato
            </p>
            <h1 className="text-3xl font-black text-ink sm:text-5xl">
              Piano da {planRow.daily_calories} kcal
            </h1>
            <p className="mt-3 max-w-3xl leading-7 text-ink/65">
              Salvato il {formatDate(planRow.created_at)}. Puoi consultarlo, eliminarlo o duplicare il profilo nel
              planner per creare una nuova versione.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {userProfile ? <DuplicatePlanButton profile={userProfile} /> : null}
              <DeletePlanButton planId={planRow.id} />
            </div>
          </div>
          <Card>
            <CalendarDays className="h-6 w-6 text-leaf" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold text-ink/60">Target giornaliero</p>
            <p className="mt-1 text-4xl font-black text-ink">{planRow.daily_calories} kcal</p>
            {calorieResult ? (
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-[8px] bg-cream p-3">
                  <span className="block text-ink/55">BMR</span>
                  <strong>{calorieResult.bmr}</strong>
                </div>
                <div className="rounded-[8px] bg-cream p-3">
                  <span className="block text-ink/55">TDEE</span>
                  <strong>{calorieResult.tdee}</strong>
                </div>
              </div>
            ) : null}
          </Card>
        </section>

        {planRow.warnings?.length ? (
          <div className="mb-6 space-y-3">
            {planRow.warnings.map((warning) => (
              <WarningBox key={warning} tone="strong">
                {warning}
              </WarningBox>
            ))}
          </div>
        ) : null}

        {userProfile ? (
          <section className="mb-6 grid gap-4 md:grid-cols-3">
            <Card>
              <ShieldCheck className="h-5 w-5 text-leaf" aria-hidden="true" />
              <h2 className="mt-3 text-lg font-black text-ink">Profilo usato</h2>
              <p className="mt-2 text-sm leading-6 text-ink/65">
                {dietLabels[userProfile.dietType]} - {userProfile.mealsPerDay} pasti al giorno
              </p>
            </Card>
            <Card>
              <h2 className="text-lg font-black text-ink">Dati</h2>
              <p className="mt-2 text-sm leading-6 text-ink/65">
                {userProfile.age} anni, {userProfile.heightCm} cm, {userProfile.weightKg} kg
              </p>
            </Card>
            <Card>
              <h2 className="text-lg font-black text-ink">Vincoli</h2>
              <p className="mt-2 text-sm leading-6 text-ink/65">
                {userProfile.excludedFoods.length ? userProfile.excludedFoods.join(", ") : "Nessuna esclusione"}
              </p>
            </Card>
          </section>
        ) : null}

        {macroTarget ? (
          <section className="mb-6">
            <Card>
              <h2 className="text-xl font-black text-ink">Macro coerenti</h2>
              <p className="mt-2 text-sm leading-6 text-ink/65">{macroTarget.note}</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <div className="rounded-[8px] bg-cream p-3 text-sm">
                  <span className="block text-ink/55">Proteine</span>
                  <strong>{macroTarget.proteinGrams[0]}-{macroTarget.proteinGrams[1]} g</strong>
                </div>
                <div className="rounded-[8px] bg-cream p-3 text-sm">
                  <span className="block text-ink/55">Carboidrati</span>
                  <strong>{macroTarget.carbsGrams[0]}-{macroTarget.carbsGrams[1]} g</strong>
                </div>
                <div className="rounded-[8px] bg-cream p-3 text-sm">
                  <span className="block text-ink/55">Grassi</span>
                  <strong>{macroTarget.fatsGrams[0]}-{macroTarget.fatsGrams[1]} g</strong>
                </div>
              </div>
            </Card>
          </section>
        ) : null}

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-black text-ink">Piano 7 giorni</h2>
          <div className="space-y-4">
            {days.map((day) => (
              <Card key={day.day}>
                <div className="mb-4">
                  <h3 className="text-xl font-black text-ink">{day.label}</h3>
                  <p className="text-sm text-ink/60">
                    {day.calories} kcal circa - P {day.protein} g / C {day.carbs} g / G {day.fats} g
                  </p>
                </div>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                  {day.meals.map((meal, index) => (
                    <MealCard
                      key={`${day.day}-${meal.id}-${meal.mealType}-${index}`}
                      meal={meal}
                      substitutions={userProfile ? getMealSubstitutions(meal, userProfile) : []}
                    />
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <GroceryList items={planRow.grocery_list || []} />
        </section>
      </main>
    </>
  );
}
