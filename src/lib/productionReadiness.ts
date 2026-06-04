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
      status: "done",
      owner: "Tech",
      detail: "Deploy automatico da GitHub a Vercel attivo e dominio produzione pubblicato.",
    },
    {
      id: "domain",
      title: "Dominio custom",
      status: "done",
      owner: "Business",
      detail: "dietsprintai.com e www.dietsprintai.com sono collegati alla produzione Vercel.",
    },
    {
      id: "privacy-gdpr",
      title: "Privacy/GDPR definitivo",
      status: "ready",
      owner: "Legale",
      detail: "Pacchetto revisione, registro trattamenti, pagine legali e richieste privacy sono pronti. Serve validazione professionale con dati reali.",
    },
    {
      id: "auth",
      title: "Autenticazione utenti",
      status: supabaseReady ? "done" : "ready",
      owner: "Tech",
      detail: supabaseReady
        ? "Login email/password, registrazione, recupero password, cambio password e logout attivi."
        : "Login email/password, registrazione, recupero password e logout implementati. Mancano le variabili Supabase per attivarli.",
    },
    {
      id: "database",
      title: "Database profili e piani",
      status: supabaseReady ? "done" : "ready",
      owner: "Tech",
      detail: supabaseReady
        ? "API salvataggio profili/piani verificata con sessione Auth.js e filtri utente."
        : "Schema SQL, RLS e API salvataggio implementati. Serve creare Supabase ed eseguire lo schema.",
    },
  ];
}
