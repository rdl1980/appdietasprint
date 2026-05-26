import { isSupabaseConfigured } from "@/lib/env";

export type ReadinessStatus = "done" | "ready" | "blocked";

export type ReadinessItem = {
  id: string;
  title: string;
  status: ReadinessStatus;
  owner: string;
  detail: string;
};

export function getP0Readiness(): ReadinessItem[] {
  const supabaseReady = isSupabaseConfigured();

  return [
    {
      id: "deploy-vercel",
      title: "Deploy Vercel",
      status: "ready",
      owner: "Tech",
      detail: "Build e package-lock sono pronti. Collegare il repo GitHub a Vercel e impostare le variabili ambiente.",
    },
    {
      id: "domain",
      title: "Dominio custom",
      status: "blocked",
      owner: "Business",
      detail: "Serve scegliere e acquistare il dominio, poi configurare DNS su Vercel.",
    },
    {
      id: "privacy-gdpr",
      title: "Privacy/GDPR definitivo",
      status: "ready",
      owner: "Legale",
      detail: "Pagine legali, registro consensi e richieste privacy sono pronti. Serve revisione legale con dati reali.",
    },
    {
      id: "auth",
      title: "Autenticazione utenti",
      status: supabaseReady ? "done" : "ready",
      owner: "Tech",
      detail: supabaseReady
        ? "Login magic link Supabase attivo."
        : "Login magic link, callback e logout implementati. Mancano le variabili Supabase per attivarli.",
    },
    {
      id: "database",
      title: "Database profili e piani",
      status: supabaseReady ? "done" : "ready",
      owner: "Tech",
      detail: supabaseReady
        ? "API salvataggio profili/piani pronta con sessione utente."
        : "Schema SQL, RLS e API salvataggio implementati. Serve creare Supabase ed eseguire lo schema.",
    },
  ];
}
