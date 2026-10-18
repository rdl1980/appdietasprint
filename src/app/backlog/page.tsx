import { redirect } from "next/navigation";
import { CalendarClock, ClipboardList } from "lucide-react";
import { Header } from "@/components/Header";
import { isAdminUser } from "@/lib/admin";
import { backlogItems } from "@/lib/productBacklog";
import { getAuthenticatedUser } from "@/lib/supabase/data";
import { BacklogClient } from "./backlog-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const backlogUpdatedAt = "19 ott 2026";

export default async function BacklogPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login?authError=admin_login_required&from=/backlog");
  }

  if (!isAdminUser(user)) {
    redirect("/account?adminError=not_admin");
  }

  const openCount = backlogItems.filter((item) => item.status !== "done").length;
  const nextCount = backlogItems.filter((item) => item.status === "next").length;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <section className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-mint px-3 py-1.5 text-xs font-black uppercase text-leaf">
              <ClipboardList className="h-4 w-4" aria-hidden="true" />
              Backlog admin
            </p>
            <h1 className="mt-4 max-w-4xl text-3xl font-black leading-tight text-ink sm:text-5xl">
              Backlog completo Diet Sprint AI.
            </h1>
            <p className="mt-4 max-w-3xl leading-7 text-ink/65">
              Inventario operativo delle funzionalità: {openCount} voci aperte, di cui {nextCount} in corso o prossime.
              Le priorità P0 sbloccano la produzione, P1 è il prossimo sprint, P2 e P3 vengono dopo la beta.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-ink shadow-sm ring-1 ring-ink/10">
            <CalendarClock className="h-4 w-4 text-leaf" aria-hidden="true" />
            Aggiornato: {backlogUpdatedAt}
          </div>
        </section>

        <BacklogClient />
      </main>
    </>
  );
}
