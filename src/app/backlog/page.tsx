import { ClipboardList } from "lucide-react";
import { Header } from "@/components/Header";
import { BacklogClient } from "./backlog-client";

export default function BacklogRedirectPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <section className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-lemon/70 px-3 py-1.5 text-xs font-black uppercase text-ink">
              <ClipboardList className="h-4 w-4" aria-hidden="true" />
              Tab temporanea
            </p>
            <h1 className="mt-4 max-w-4xl text-3xl font-black leading-tight text-ink sm:text-5xl">
              Backlog completo DietaSprint AI.
            </h1>
            <p className="mt-4 max-w-3xl leading-7 text-ink/65">
              Inventario operativo delle funzionalità: dal nucleo MVP fino a premium, AI e app mobile.
            </p>
          </div>
          <div className="max-w-sm rounded-[8px] border border-ink/10 bg-white p-4 text-sm leading-6 text-ink/65 shadow-sm">
            Questa vista serve durante lo sviluppo. Prima del lancio commerciale verrà rimossa dalla navigazione o resa privata.
          </div>
        </section>

        <BacklogClient />
      </main>
    </>
  );
}
