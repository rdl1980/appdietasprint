"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { WarningBox } from "@/components/WarningBox";
import { isSupabaseConfigured } from "@/lib/env";
import { LogIn } from "lucide-react";

export function LoginForm() {
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const configured = isSupabaseConfigured();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authError = params.get("authError");

    if (authError === "link_invalid_or_expired") {
      setError("Il link di accesso non e' valido o e' scaduto. Richiedi una nuova email e usa l'ultimo link ricevuto.");
    }

    if (authError === "supabase_not_configured") {
      setError("Supabase non e' ancora configurato.");
    }

    if (authError === "admin_login_required") {
      setError("Per aprire il backlog admin devi accedere con l'account amministratore.");
    }

    if (authError === "login_failed") {
      setError(params.get("message") || "Accesso non riuscito.");
    }

    if (params.get("registered") === "1") {
      setStatus("Registrazione avviata. Se Supabase richiede conferma email, completa il passaggio dalla tua casella di posta.");
    }
  }, []);

  return (
    <main className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <Card>
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-mint text-leaf">
            <LogIn size={22} aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-leaf">Accesso</p>
            <h1 className="text-2xl font-black text-ink">Accedi al tuo account</h1>
          </div>
        </div>

        {!configured ? (
          <div className="mb-5">
            <WarningBox tone="strong">
              Login disattivato finche' non configuri NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.
            </WarningBox>
          </div>
        ) : null}

        <form action="/api/auth/login" method="post" className="space-y-4">
          <Input
            label="Email"
            name="email"
            type="email"
            required
            placeholder="nome@email.it"
          />
          <Input
            label="Password"
            name="password"
            type="password"
            required
            minLength={8}
            placeholder="La tua password"
          />
          {error ? <WarningBox tone="strong">{error}</WarningBox> : null}
          {status ? <WarningBox>{status}</WarningBox> : null}
          <Button type="submit" className="w-full" disabled={!configured}>
            Accedi
          </Button>
        </form>

        <div className="mt-5 flex flex-col gap-2 text-sm text-ink/65 sm:flex-row sm:items-center sm:justify-between">
          <Link className="font-bold text-leaf hover:text-ink" href="/forgot-password">
            Password dimenticata?
          </Link>
          <span>
            Non hai un account?{" "}
            <Link className="font-bold text-leaf hover:text-ink" href="/register">
              Registrati
            </Link>
          </span>
        </div>
      </Card>
    </main>
  );
}
