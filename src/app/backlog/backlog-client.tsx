"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, CircleDot, Clock3, ListFilter, Search, Sparkles } from "lucide-react";
import { backlogAreas, backlogItems, backlogStatusLabels, BacklogStatus } from "@/lib/productBacklog";

const statusOptions: Array<{ value: "all" | BacklogStatus; label: string }> = [
  { value: "all", label: "Tutto" },
  { value: "done", label: "Fatto" },
  { value: "next", label: "Prossimo" },
  { value: "planned", label: "Pianificato" },
  { value: "later", label: "Più avanti" },
];

const statusStyles: Record<BacklogStatus, string> = {
  done: "bg-mint text-leaf",
  next: "bg-lemon/70 text-ink",
  planned: "bg-[#dce8f6] text-[#255080]",
  later: "bg-ink/8 text-ink/65",
};

const statusIcons = {
  done: CheckCircle2,
  next: CircleDot,
  planned: Clock3,
  later: Sparkles,
};

export function BacklogClient() {
  const [area, setArea] = useState("Tutte");
  const [status, setStatus] = useState<"all" | BacklogStatus>("all");
  const [query, setQuery] = useState("");

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return backlogItems.filter((item) => {
      const matchesArea = area === "Tutte" || item.area === area;
      const matchesStatus = status === "all" || item.status === status;
      const matchesQuery =
        !normalizedQuery ||
        `${item.title} ${item.detail} ${item.area} ${item.priority}`.toLowerCase().includes(normalizedQuery);

      return matchesArea && matchesStatus && matchesQuery;
    });
  }, [area, query, status]);

  const groupedItems = useMemo(
    () =>
      backlogAreas
        .map((areaName) => ({
          area: areaName,
          items: filteredItems.filter((item) => item.area === areaName),
        }))
        .filter((group) => group.items.length > 0),
    [filteredItems],
  );

  const summary = useMemo(
    () =>
      statusOptions.slice(1).map((option) => ({
        ...option,
        count: backlogItems.filter((item) => item.status === option.value).length,
      })),
    [],
  );

  return (
    <>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summary.map((item) => {
          const Icon = statusIcons[item.value as BacklogStatus];

          return (
            <button
              key={item.value}
              type="button"
              onClick={() => setStatus(item.value as BacklogStatus)}
              className={`flex min-h-24 items-center justify-between gap-4 rounded-[8px] border p-4 text-left transition ${
                status === item.value ? "border-leaf bg-white shadow-soft" : "border-ink/10 bg-white/75 hover:border-leaf/40"
              }`}
            >
              <div>
                <p className="text-xs font-bold uppercase text-ink/50">{item.label}</p>
                <p className="mt-1 text-3xl font-black text-ink">{item.count}</p>
              </div>
              <Icon className="h-6 w-6 text-leaf" aria-hidden="true" />
            </button>
          );
        })}
      </section>

      <section className="mt-6 border-y border-ink/10 bg-white/65 py-4">
        <div className="flex flex-col gap-4">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-ink/45" aria-hidden="true" />
            <span className="sr-only">Cerca nel backlog</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cerca funzionalità, area o priorità"
              className="h-12 w-full rounded-[8px] border border-ink/10 bg-white pl-11 pr-4 text-sm text-ink outline-none transition focus:border-leaf focus:ring-4 focus:ring-leaf/15"
            />
          </label>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <ListFilter className="h-4 w-4 shrink-0 text-leaf" aria-hidden="true" />
            <button
              type="button"
              onClick={() => setArea("Tutte")}
              className={`h-9 shrink-0 rounded-full px-4 text-sm font-bold transition ${
                area === "Tutte" ? "bg-leaf text-white" : "bg-white text-ink/65 ring-1 ring-ink/10 hover:bg-mint"
              }`}
            >
              Tutte
            </button>
            {backlogAreas.map((areaName) => (
              <button
                key={areaName}
                type="button"
                onClick={() => setArea(areaName)}
                className={`h-9 shrink-0 rounded-full px-4 text-sm font-bold transition ${
                  area === areaName ? "bg-leaf text-white" : "bg-white text-ink/65 ring-1 ring-ink/10 hover:bg-mint"
                }`}
              >
                {areaName}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setStatus(option.value)}
                className={`h-9 rounded-[8px] px-3 text-sm font-bold transition ${
                  status === option.value ? "bg-ink text-white" : "bg-white text-ink/65 ring-1 ring-ink/10 hover:bg-mint"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-7 space-y-8">
        {groupedItems.map((group) => (
          <div key={group.area}>
            <div className="mb-3 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase text-leaf">Area prodotto</p>
                <h2 className="mt-1 text-2xl font-black text-ink">{group.area}</h2>
              </div>
              <p className="text-sm font-bold text-ink/45">{group.items.length} voci</p>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {group.items.map((item) => {
                const Icon = statusIcons[item.status];

                return (
                  <article key={item.id} className="rounded-[8px] border border-ink/10 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-black ${statusStyles[item.status]}`}>
                        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                        {backlogStatusLabels[item.status]}
                      </span>
                      <span className="rounded-full bg-ink px-2.5 py-1 text-xs font-black text-white">{item.priority}</span>
                    </div>
                    <h3 className="mt-4 text-base font-black text-ink">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-ink/65">{item.detail}</p>
                  </article>
                );
              })}
            </div>
          </div>
        ))}

        {groupedItems.length === 0 ? (
          <div className="rounded-[8px] border border-dashed border-ink/20 bg-white/70 p-8 text-center">
            <p className="font-black text-ink">Nessuna voce trovata.</p>
            <p className="mt-2 text-sm text-ink/60">Modifica ricerca o filtri per ampliare i risultati.</p>
          </div>
        ) : null}
      </section>
    </>
  );
}
