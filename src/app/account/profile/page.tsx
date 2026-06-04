import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { WarningBox } from "@/components/WarningBox";
import { createAuthenticatedSupabaseClient } from "@/lib/supabase/data";
import { profileFromRow } from "@/lib/databaseMappers";
import { ProfileForm } from "./profile-form";

type ProfileRow = Parameters<typeof profileFromRow>[0] & {
  id: string;
};

export default async function AccountProfilePage() {
  const { supabase, user } = await createAuthenticatedSupabaseClient();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error } =
    supabase && user
      ? await supabase
          .from("user_profiles")
          .select(
            "id,sex,age,height_cm,weight_kg,activity_level,goal,diet_type,target_calories,meals_per_day,excluded_foods,simplicity_level,budget_mode",
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : { data: null, error: null };

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <section className="mb-6">
          <p className="mb-3 inline-flex rounded-full bg-mint px-4 py-2 text-sm font-bold text-leaf">
            Account
          </p>
          <h1 className="text-3xl font-black text-ink sm:text-5xl">Modifica profilo alimentare</h1>
          <p className="mt-3 max-w-3xl leading-7 text-ink/65">
            Aggiorna l'ultimo profilo salvato. I piani gia salvati restano invariati; le prossime generazioni useranno
            i nuovi dati se duplichi o ricompili il planner.
          </p>
        </section>

        {error ? (
          <div className="mb-5">
            <WarningBox tone="strong">Profilo non disponibile.</WarningBox>
          </div>
        ) : null}

        {profile ? (
          <ProfileForm profileId={(profile as ProfileRow).id} initialProfile={profileFromRow(profile as ProfileRow)} />
        ) : (
          <Card>
            <h2 className="text-xl font-black text-ink">Nessun profilo salvato</h2>
            <p className="mt-2 text-sm leading-6 text-ink/65">
              Salva un piano dal planner per creare il primo profilo alimentare.
            </p>
            <Button href="/planner" className="mt-5">
              Vai al planner
            </Button>
          </Card>
        )}
      </main>
    </>
  );
}
