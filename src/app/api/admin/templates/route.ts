import { NextRequest, NextResponse } from "next/server";
import { isAdminUser } from "@/lib/admin";
import { rateLimit, readJsonBody } from "@/lib/api";
import { validateAdminMealTemplate, type AdminMealTemplateInput } from "@/lib/adminMealTemplates";
import { createAuthenticatedSupabaseClient, createSupabaseAdminClient } from "@/lib/supabase/data";

type DeleteTemplateBody = {
  id?: string;
};

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, {
    key: "admin-templates",
    limit: 60,
    windowMs: 10 * 60 * 1000,
  });

  if (limited) {
    return limited;
  }

  const { user } = await createAuthenticatedSupabaseClient(request);

  if (!isAdminUser(user)) {
    return NextResponse.json({ error: "Admin richiesto" }, { status: 403 });
  }

  const body = await readJsonBody<AdminMealTemplateInput>(request);
  const validated = validateAdminMealTemplate(body || {});

  if (!validated.ok) {
    return NextResponse.json({ error: validated.errors.join(" ") }, { status: 400 });
  }

  const supabase = await createSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({ error: "Servizio admin non configurato." }, { status: 503 });
  }

  const template = validated.template;
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("admin_meal_templates")
    .upsert(
      {
        id: template.id,
        name: template.name,
        meal_type: template.mealType,
        diet_types: template.dietTypes,
        ingredients: template.ingredients,
        calories: template.calories,
        protein: template.protein,
        carbs: template.carbs,
        fats: template.fats,
        tags: template.tags,
        active: template.active,
        updated_by: user?.id,
        updated_at: now,
        created_by: user?.id,
      },
      { onConflict: "id" },
    )
    .select("id,name,active")
    .single();

  if (error || !data) {
    console.error("admin_template_upsert_failed", { templateId: template.id, error: error?.message });
    return NextResponse.json({ error: "Template non salvato." }, { status: 500 });
  }

  return NextResponse.json({ template: data });
}

export async function DELETE(request: NextRequest) {
  const limited = rateLimit(request, {
    key: "admin-templates-delete",
    limit: 30,
    windowMs: 10 * 60 * 1000,
  });

  if (limited) {
    return limited;
  }

  const { user } = await createAuthenticatedSupabaseClient(request);

  if (!isAdminUser(user)) {
    return NextResponse.json({ error: "Admin richiesto" }, { status: 403 });
  }

  const body = await readJsonBody<DeleteTemplateBody>(request);

  if (!body?.id) {
    return NextResponse.json({ error: "ID template richiesto." }, { status: 400 });
  }

  const supabase = await createSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({ error: "Servizio admin non configurato." }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("admin_meal_templates")
    .update({ active: false, updated_by: user?.id, updated_at: new Date().toISOString() })
    .eq("id", body.id)
    .select("id,active")
    .single();

  if (error || !data) {
    console.error("admin_template_deactivate_failed", { templateId: body.id, error: error?.message });
    return NextResponse.json({ error: "Template non disattivato." }, { status: 500 });
  }

  return NextResponse.json({ template: data });
}
