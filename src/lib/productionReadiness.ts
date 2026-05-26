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
      status: "blocked",
      owner: "Legale",
      detail: "Le pagine MVP esistono. Serve titolare, email, fornitori reali, basi giuridiche e revisione legale.",
    },
    {
      id: "auth",
      title: "Autenticazione utenti",
      status: supabaseReady ? "ready" : "blocked",
      owner: "Tech",
      detail: supabaseReady
        ? "Variabili Supabase presenti: si puo' attivare il flusso login."
        : "Scaffold Supabase presente. Mancano NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    },
    {
      id: "database",
      title: "Database profili e piani",
      status: supabaseReady ? "ready" : "blocked",
      owner: "Tech",
      detail: supabaseReady
        ? "Schema SQL pronto da applicare in Supabase."
        : "Schema SQL pronto, ma serve un progetto Supabase configurato.",
    },
  ];
}
