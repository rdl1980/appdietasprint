"use client";

import { FormEvent, useMemo, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/Button";
import { FormSection } from "@/components/FormSection";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { WarningBox } from "@/components/WarningBox";
import { calculateCalories } from "@/lib/calories";
import type { ActivityLevel, DietType, Goal, Sex, SimplicityLevel, UserProfile } from "@/lib/types";

type ProfileFormProps = {
  profileId: string;
  initialProfile: UserProfile;
};

export function ProfileForm({ profileId, initialProfile }: ProfileFormProps) {
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [excludedText, setExcludedText] = useState(initialProfile.excludedFoods.join(", "));
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const calorieResult = useMemo(() => calculateCalories(profile), [profile]);

  function updateProfile<Key extends keyof UserProfile>(key: Key, value: UserProfile[Key]) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    setError("");

    const nextProfile = {
      ...profile,
      excludedFoods: excludedText
        .split(",")
        .map((food) => food.trim())
        .filter(Boolean),
    };

    setIsSaving(true);
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId, profile: nextProfile }),
    });
    const data = (await response.json().catch(() => null)) as { error?: string; loginUrl?: string } | null;
    setIsSaving(false);

    if (response.status === 401 && data?.loginUrl) {
      window.location.assign(data.loginUrl);
      return;
    }

    if (!response.ok) {
      setError(data?.error || "Profilo non aggiornato.");
      return;
    }

    setProfile(nextProfile);
    setStatus("Profilo aggiornato.");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-[8px] border border-ink/10 bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-ink/60">Stima corrente</p>
        <p className="mt-1 text-3xl font-black text-ink">
          {profile.targetCalories || calorieResult.suggestedCalories} kcal
        </p>
        <p className="mt-1 text-sm text-ink/55">
          BMR {calorieResult.bmr} - TDEE {calorieResult.tdee}
        </p>
      </div>

      <FormSection title="Profilo" description="Modifica i dati usati per il calcolo calorie.">
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

      <FormSection title="Obiettivo" description="Aggiorna target, dieta e stile di preparazione.">
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
          helper="separati da virgola"
          value={excludedText}
          onChange={(event) => setExcludedText(event.target.value)}
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
      {status ? <WarningBox>{status}</WarningBox> : null}

      <Button type="submit" disabled={isSaving}>
        <Save size={16} aria-hidden="true" />
        {isSaving ? "Salvataggio..." : "Salva modifiche"}
      </Button>
    </form>
  );
}
