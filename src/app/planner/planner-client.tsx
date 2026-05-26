"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { FormSection } from "@/components/FormSection";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { WarningBox } from "@/components/WarningBox";
import { calculateCalories } from "@/lib/calories";
import { ActivityLevel, DietType, Goal, Sex, SimplicityLevel, UserProfile } from "@/lib/types";
import { Calculator, CheckCircle2 } from "lucide-react";

const initialProfile: UserProfile = {
  sex: "female",
  age: 35,
  heightCm: 165,
  weightKg: 70,
  activityLevel: "light",
  goal: "standard",
  dietType: "mediterranean",
  mealsPerDay: 4,
  excludedFoods: [],
  simplicityLevel: "zeroSbatti",
  budgetMode: false,
};

export function PlannerClient() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [excludedText, setExcludedText] = useState("");
  const [error, setError] = useState("");

  const calorieResult = useMemo(() => calculateCalories(profile), [profile]);

  function updateProfile<Key extends keyof UserProfile>(key: Key, value: UserProfile[Key]) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (profile.age < 18) {
      setError("Questo MVP e' pensato per adulti. Per minorenni serve un professionista.");
      return;
    }

    if (profile.heightCm < 120 || profile.weightKg < 35) {
      setError("Controlla altezza e peso: sembrano fuori scala per un planner standard.");
      return;
    }

    const finalProfile = {
      ...profile,
      excludedFoods: excludedText
        .split(",")
        .map((food) => food.trim())
        .filter(Boolean),
    };

    window.localStorage.setItem("dietaSprintProfile", JSON.stringify(finalProfile));
    router.push("/results");
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8 grid gap-4 lg:grid-cols-[1fr_360px] lg:items-end">
        <div>
          <p className="mb-3 inline-flex rounded-full bg-mint px-4 py-2 text-sm font-bold text-leaf">
            Planner guidato
          </p>
          <h1 className="text-3xl font-black text-ink sm:text-5xl">Costruiamo il tuo piano realistico.</h1>
          <p className="mt-3 max-w-2xl leading-7 text-ink/65">
            Inserisci dati essenziali, preferenze e vincoli. La versione MVP usa template locali,
            non diagnosi e non raccomandazioni mediche.
          </p>
        </div>
        <Card>
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-leaf text-white">
              <Calculator size={20} aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink/60">Stima corrente</p>
              <p className="text-2xl font-black text-ink">{profile.targetCalories || calorieResult.suggestedCalories} kcal</p>
            </div>
          </div>
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
        </Card>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <FormSection title="Profilo" description="Dati usati per Mifflin-St Jeor e stima TDEE.">
          <Select
            label="Sesso"
            value={profile.sex}
            onChange={(event) => updateProfile("sex", event.target.value as Sex)}
            options={[
              { value: "female", label: "Donna" },
              { value: "male", label: "Uomo" },
            ]}
          />
          <Input
            label="Eta"
            type="number"
            min={18}
            value={profile.age}
            onChange={(event) => updateProfile("age", Number(event.target.value))}
          />
          <Input
            label="Altezza"
            helper="in centimetri"
            type="number"
            min={120}
            value={profile.heightCm}
            onChange={(event) => updateProfile("heightCm", Number(event.target.value))}
          />
          <Input
            label="Peso"
            helper="in kg"
            type="number"
            min={35}
            value={profile.weightKg}
            onChange={(event) => updateProfile("weightKg", Number(event.target.value))}
          />
        </FormSection>

        <FormSection title="Obiettivo e calorie" description="Puoi usare il suggerimento o impostare un target manuale.">
          <Select
            label="Attivita"
            value={profile.activityLevel}
            onChange={(event) => updateProfile("activityLevel", event.target.value as ActivityLevel)}
            options={[
              { value: "sedentary", label: "Sedentaria" },
              { value: "light", label: "Leggera" },
              { value: "moderate", label: "Moderata" },
              { value: "active", label: "Attiva" },
            ]}
          />
          <Select
            label="Deficit"
            value={profile.goal}
            onChange={(event) => updateProfile("goal", event.target.value as Goal)}
            options={[
              { value: "mild", label: "Mild -15%" },
              { value: "standard", label: "Standard -20%" },
              { value: "aggressive", label: "Aggressivo -25%" },
              { value: "maintain", label: "Mantenimento" },
            ]}
          />
          <Input
            label="Target calorie"
            helper={`Suggerito: ${calorieResult.suggestedRange[0]}-${calorieResult.suggestedRange[1]} kcal`}
            type="number"
            min={0}
            placeholder={`${calorieResult.suggestedCalories}`}
            value={profile.targetCalories || ""}
            onChange={(event) =>
              updateProfile("targetCalories", event.target.value ? Number(event.target.value) : undefined)
            }
          />
          <Select
            label="Pasti al giorno"
            value={String(profile.mealsPerDay)}
            onChange={(event) => updateProfile("mealsPerDay", Number(event.target.value))}
            options={[
              { value: "2", label: "2 pasti" },
              { value: "3", label: "3 pasti" },
              { value: "4", label: "4 pasti" },
              { value: "5", label: "5 pasti" },
            ]}
          />
        </FormSection>

        <FormSection title="Preferenze" description="I template vengono filtrati per compatibilita ed esclusioni.">
          <Select
            label="Tipo dieta"
            value={profile.dietType}
            onChange={(event) => updateProfile("dietType", event.target.value as DietType)}
            options={[
              { value: "ketogenic", label: "Chetogenica" },
              { value: "mediterranean", label: "Mediterranea" },
              { value: "lowCarb", label: "Low carb" },
              { value: "balanced", label: "Ipocalorica bilanciata" },
              { value: "vegetarian", label: "Vegetariana" },
            ]}
          />
          <Select
            label="Semplicita"
            value={profile.simplicityLevel}
            onChange={(event) => updateProfile("simplicityLevel", event.target.value as SimplicityLevel)}
            options={[
              { value: "zeroSbatti", label: "Zero Sbatti" },
              { value: "standard", label: "Standard" },
              { value: "mealPrep", label: "Meal prep" },
            ]}
          />
          <Input
            label="Cibi esclusi"
            helper="separati da virgola, es. tonno, latte"
            value={excludedText}
            onChange={(event) => setExcludedText(event.target.value)}
            placeholder="Nessuna esclusione"
          />
          <label className="flex min-h-12 items-center gap-3 rounded-[8px] border border-ink/10 bg-white px-4">
            <input
              type="checkbox"
              checked={profile.budgetMode}
              onChange={(event) => updateProfile("budgetMode", event.target.checked)}
              className="h-5 w-5 accent-leaf"
            />
            <span className="text-sm font-semibold text-ink">Modalita Budget</span>
          </label>
        </FormSection>

        {calorieResult.warnings.length ? (
          <WarningBox tone="strong">
            <ul className="space-y-1">
              {calorieResult.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </WarningBox>
        ) : null}

        {error ? <WarningBox tone="strong">{error}</WarningBox> : null}

        <div className="flex flex-col gap-3 rounded-[8px] bg-white/70 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink/70">
            <CheckCircle2 size={18} className="text-leaf" aria-hidden="true" />
            Nessuna diagnosi, solo pianificazione alimentare orientativa.
          </div>
          <Button type="submit" size="lg">
            Genera piano
          </Button>
        </div>
      </form>
    </main>
  );
}
