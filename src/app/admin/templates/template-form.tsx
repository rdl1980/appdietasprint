"use client";

import { FormEvent, useState } from "react";
import { Save, Trash2 } from "lucide-react";
import { Button } from "@/components/Button";
import { parseCsvList, parseIngredientsText } from "@/lib/adminMealTemplates";
import type { DietType, MealType } from "@/lib/types";

const dietOptions: Array<{ value: DietType; label: string }> = [
  { value: "ketogenic", label: "Chetogenica" },
  { value: "mediterranean", label: "Mediterranea" },
  { value: "lowCarb", label: "Low carb" },
  { value: "balanced", label: "Bilanciata" },
  { value: "vegetarian", label: "Vegetariana" },
];

type TemplateFormProps = {
  defaultId?: string;
};

export function TemplateForm({ defaultId = "" }: TemplateFormProps) {
  const [status, setStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function saveTemplate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    setIsSaving(true);

    const form = new FormData(event.currentTarget);
    const dietTypes = dietOptions
      .filter((option) => form.get(`diet-${option.value}`) === "on")
      .map((option) => option.value);
    const body = {
      id: String(form.get("id") || ""),
      name: String(form.get("name") || ""),
      mealType: String(form.get("mealType") || "") as MealType,
      dietTypes,
      ingredients: parseIngredientsText(String(form.get("ingredients") || "")),
      calories: Number(form.get("calories")),
      protein: Number(form.get("protein")),
      carbs: Number(form.get("carbs")),
      fats: Number(form.get("fats")),
      tags: parseCsvList(String(form.get("tags") || "")),
      active: form.get("active") === "on",
    };

    const response = await fetch("/api/admin/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    setIsSaving(false);

    if (!response.ok) {
      setStatus(data?.error || "Template non salvato.");
      return;
    }

    setStatus("Template salvato. Aggiorna la pagina per rivedere il catalogo.");
  }

  async function deactivateTemplate(form: HTMLFormElement) {
    const id = String(new FormData(form).get("id") || "");

    if (!id) {
      setStatus("Inserisci l'ID del template da disattivare.");
      return;
    }

    setIsSaving(true);
    const response = await fetch("/api/admin/templates", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    setIsSaving(false);
    setStatus(response.ok ? "Template disattivato." : data?.error || "Template non disattivato.");
  }

  return (
    <form className="space-y-4 rounded-[8px] border border-ink/10 bg-white p-4 shadow-soft" onSubmit={saveTemplate}>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-black uppercase text-ink/50">ID</span>
          <input name="id" defaultValue={defaultId} className="h-10 w-full rounded-[8px] border border-ink/10 px-3 text-sm" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-black uppercase text-ink/50">Nome</span>
          <input name="name" className="h-10 w-full rounded-[8px] border border-ink/10 px-3 text-sm" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-black uppercase text-ink/50">Tipo pasto</span>
          <select name="mealType" className="h-10 w-full rounded-[8px] border border-ink/10 px-3 text-sm">
            <option value="breakfast">Colazione</option>
            <option value="lunch">Pranzo</option>
            <option value="dinner">Cena</option>
            <option value="snack">Snack</option>
          </select>
        </label>
        <label className="flex items-center gap-2 pt-6 text-sm font-semibold text-ink">
          <input name="active" type="checkbox" defaultChecked className="h-4 w-4 accent-leaf" />
          Attivo
        </label>
      </div>

      <div className="grid gap-2 md:grid-cols-5">
        {dietOptions.map((option) => (
          <label key={option.value} className="flex items-center gap-2 rounded-[8px] bg-cream px-3 py-2 text-xs font-bold text-ink">
            <input name={`diet-${option.value}`} type="checkbox" className="h-4 w-4 accent-leaf" />
            {option.label}
          </label>
        ))}
      </div>

      <label className="block">
        <span className="mb-1 block text-xs font-black uppercase text-ink/50">Ingredienti</span>
        <textarea
          name="ingredients"
          placeholder={"Yogurt greco:170\nNoci:25"}
          className="min-h-24 w-full rounded-[8px] border border-ink/10 px-3 py-2 text-sm"
        />
      </label>

      <div className="grid gap-3 md:grid-cols-5">
        {["calories", "protein", "carbs", "fats"].map((field) => (
          <label key={field} className="block">
            <span className="mb-1 block text-xs font-black uppercase text-ink/50">{field}</span>
            <input name={field} type="number" min="0" className="h-10 w-full rounded-[8px] border border-ink/10 px-3 text-sm" />
          </label>
        ))}
        <label className="block">
          <span className="mb-1 block text-xs font-black uppercase text-ink/50">Tag</span>
          <input name="tags" placeholder="budget, semplice" className="h-10 w-full rounded-[8px] border border-ink/10 px-3 text-sm" />
        </label>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit" disabled={isSaving} size="sm">
          <Save size={16} aria-hidden="true" />
          Salva template
        </Button>
        <Button type="button" variant="secondary" disabled={isSaving} size="sm" onClick={(event) => deactivateTemplate(event.currentTarget.form!)}>
          <Trash2 size={16} aria-hidden="true" />
          Disattiva ID
        </Button>
      </div>
      {status ? <p className="text-sm font-semibold text-ink/70">{status}</p> : null}
    </form>
  );
}
