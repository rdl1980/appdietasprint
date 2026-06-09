import { redirect } from "next/navigation";
import { Database, Tags, Utensils } from "lucide-react";
import { Header } from "@/components/Header";
import { Card } from "@/components/Card";
import { WarningBox } from "@/components/WarningBox";
import { isAdminUser } from "@/lib/admin";
import type { AdminMealTemplate } from "@/lib/adminMealTemplates";
import { mealTemplates } from "@/lib/mealTemplates";
import { getAuthenticatedUser, createSupabaseAdminClient } from "@/lib/supabase/data";
import { TemplateForm } from "./template-form";

type AdminTemplateRow = {
  id: string;
  name: string;
  meal_type: AdminMealTemplate["mealType"];
  diet_types: AdminMealTemplate["dietTypes"];
  ingredients: AdminMealTemplate["ingredients"];
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  tags: string[];
  active: boolean;
  updated_at: string;
};

function fromRow(row: AdminTemplateRow): AdminMealTemplate {
  return {
    id: row.id,
    name: row.name,
    mealType: row.meal_type,
    dietTypes: row.diet_types,
    ingredients: row.ingredients,
    calories: row.calories,
    protein: row.protein,
    carbs: row.carbs,
    fats: row.fats,
    tags: row.tags,
    active: row.active,
    source: "database",
    updatedAt: row.updated_at,
  };
}

function TemplateCard({ template }: { template: AdminMealTemplate }) {
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-leaf">{template.mealType}</p>
          <h2 className="mt-1 text-lg font-black text-ink">{template.name}</h2>
          <p className="mt-1 break-all text-xs text-ink/45">{template.id}</p>
        </div>
        <span className="rounded-full bg-cream px-3 py-1 text-xs font-bold text-ink/60">
          {template.source} · {template.active ? "attivo" : "inattivo"}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2 text-sm">
        <div className="rounded-[8px] bg-cream p-2">
          <span className="block text-xs text-ink/50">kcal</span>
          <strong>{template.calories}</strong>
        </div>
        <div className="rounded-[8px] bg-cream p-2">
          <span className="block text-xs text-ink/50">P</span>
          <strong>{template.protein}</strong>
        </div>
        <div className="rounded-[8px] bg-cream p-2">
          <span className="block text-xs text-ink/50">C</span>
          <strong>{template.carbs}</strong>
        </div>
        <div className="rounded-[8px] bg-cream p-2">
          <span className="block text-xs text-ink/50">G</span>
          <strong>{template.fats}</strong>
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-ink/65">
        Diete: {template.dietTypes.join(", ")} · Tag: {template.tags.join(", ") || "nessuno"}
      </p>
      <p className="mt-2 text-xs leading-5 text-ink/50">
        Ingredienti: {template.ingredients.map((ingredient) => `${ingredient.name} ${ingredient.grams}g`).join(", ")}
      </p>
    </Card>
  );
}

export default async function AdminTemplatesPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login?authError=admin_login_required&from=/admin/templates");
  }

  if (!isAdminUser(user)) {
    redirect("/account?adminError=not_admin");
  }

  const supabase = await createSupabaseAdminClient();
  const { data: rows, error } = supabase
    ? await supabase
        .from("admin_meal_templates")
        .select("id,name,meal_type,diet_types,ingredients,calories,protein,carbs,fats,tags,active,updated_at")
        .order("updated_at", { ascending: false })
    : { data: [] as AdminTemplateRow[], error: null };
  const databaseTemplates = ((rows || []) as AdminTemplateRow[]).map(fromRow);
  const staticTemplates: AdminMealTemplate[] = mealTemplates.map((template) => ({
    ...template,
    active: true,
    source: "static",
  }));
  const allTemplates = [...databaseTemplates, ...staticTemplates];
  const dietTagCount = new Set(allTemplates.flatMap((template) => template.dietTypes)).size;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <section className="mb-6">
          <p className="mb-3 inline-flex rounded-full bg-mint px-4 py-2 text-sm font-bold text-leaf">
            Admin contenuti
          </p>
          <h1 className="text-3xl font-black text-ink sm:text-5xl">Template pasti</h1>
          <p className="mt-3 max-w-3xl leading-7 text-ink/65">
            Gestisci ricette operative, ingredienti, tag dieta e sostituzioni candidate.
          </p>
        </section>

        {!supabase ? (
          <div className="mb-5">
            <WarningBox tone="strong">Servizio admin non configurato: puoi vedere solo i template statici.</WarningBox>
          </div>
        ) : null}

        {error ? (
          <div className="mb-5">
            <WarningBox tone="strong">Template database non disponibili.</WarningBox>
          </div>
        ) : null}

        <section className="mb-5 grid gap-4 md:grid-cols-3">
          <Card>
            <Utensils className="h-5 w-5 text-leaf" aria-hidden="true" />
            <p className="mt-3 text-3xl font-black text-ink">{allTemplates.length}</p>
            <p className="text-sm text-ink/60">Template totali</p>
          </Card>
          <Card>
            <Database className="h-5 w-5 text-leaf" aria-hidden="true" />
            <p className="mt-3 text-3xl font-black text-ink">{databaseTemplates.length}</p>
            <p className="text-sm text-ink/60">Gestiti da admin</p>
          </Card>
          <Card>
            <Tags className="h-5 w-5 text-leaf" aria-hidden="true" />
            <p className="mt-3 text-3xl font-black text-ink">{dietTagCount}</p>
            <p className="text-sm text-ink/60">Diete coperte</p>
          </Card>
        </section>

        <section className="mb-6">
          <TemplateForm />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          {allTemplates.map((template) => (
            <TemplateCard key={`${template.source}-${template.id}`} template={template} />
          ))}
        </section>
      </main>
    </>
  );
}
