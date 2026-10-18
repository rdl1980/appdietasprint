import { CalendarDays, FileText, Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { DeletePlanButton } from "@/components/DeletePlanButton";
import { WarningBox } from "@/components/WarningBox";
import { createAuthenticatedSupabaseClient } from "@/lib/supabase/data";

export const dynamic = "force-dynamic";

type PlanRow = {
  id: string;
  daily_calories: number;
  warnings: string[] | null;
  created_at: string;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function AccountPlansPage() {
  const { supabase, user } = await createAuthenticatedSupabaseClient();

  if (!user) {
    redirect("/login?from=/account/plans");
  }

  const { data: plans, error } =
    supabase && user
      ? await supabase
          .from("meal_plans")
          .select("id,daily_calories,warnings,created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(30)
      : { data: [] as PlanRow[], error: null };

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <section className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 inline-flex rounded-full bg-mint px-4 py-2 text-sm font-bold text-leaf">
              Account
            </p>
            <h1 className="text-3xl font-black text-ink sm:text-5xl">Storico piani salvati</h1>
            <p className="mt-3 max-w-3xl leading-7 text-ink/65">
              Apri, duplica o elimina i piani generati dal planner.
            </p>
          </div>
          <Button href="/planner">
            <Plus size={18} aria-hidden="true" />
            Nuovo piano
          </Button>
        </section>

        {error ? (
          <div className="mb-5">
            <WarningBox tone="strong">Storico piani non disponibile.</WarningBox>
          </div>
        ) : null}

        {user && plans?.length ? (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {plans.map((plan) => (
              <Card key={plan.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.12em] text-leaf">
                      {formatDate(plan.created_at)}
                    </p>
                    <h2 className="mt-2 text-2xl font-black text-ink">{plan.daily_calories} kcal</h2>
                  </div>
                  <CalendarDays className="h-6 w-6 shrink-0 text-leaf" aria-hidden="true" />
                </div>

                {plan.warnings?.length ? (
                  <p className="mt-3 text-sm font-semibold text-coral">
                    {plan.warnings.length} avviso calorie/sicurezza
                  </p>
                ) : (
                  <p className="mt-3 text-sm text-ink/60">Nessun avviso registrato.</p>
                )}

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <Button href={`/account/plans/${plan.id}`} size="sm">
                    <FileText size={16} aria-hidden="true" />
                    Apri
                  </Button>
                  <DeletePlanButton planId={plan.id} />
                </div>
              </Card>
            ))}
          </section>
        ) : null}

        {user && !plans?.length ? (
          <Card>
            <h2 className="text-xl font-black text-ink">Nessun piano salvato</h2>
            <p className="mt-2 text-sm leading-6 text-ink/65">
              Genera un piano dal planner e salvalo con il consenso privacy.
            </p>
            <Button href="/planner" className="mt-5">
              Crea il primo piano
            </Button>
          </Card>
        ) : null}
      </main>
    </>
  );
}
