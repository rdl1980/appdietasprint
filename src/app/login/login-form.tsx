"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { WarningBox } from "@/components/WarningBox";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";
import { LogIn } from "lucide-react";

function translateAuthError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "Email o password non corretti.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Email non confermata. Controlla la posta e completa la registrazione.";
  }

  if (normalized.includes("too many requests") || normalized.includes("rate limit")) {
    return "Troppi tentativi in poco tempo. Aspetta qualche minuto prima di riprovare.";
  }

  return message;
}

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
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

    if (params.get("registered") === "1") {
      setStatus("Registrazione avviata. Se Supabase richiede conferma email, completa il passaggio dalla tua casella di posta.");
    }
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus("");
    setIsSubmitting(true);

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase non e' ancora configurato.");
      setIsSubmitting(false);
      return;
    }

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(translateAuthError(authError.message));
      setIsSubmitting(false);
      return;
    }

    await supabase.auth.getSession();
    window.location.replace("/account");
  }

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

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="nome@email.it"
          />
          <Input
            label="Password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="La tua password"
          />
          {error ? <WarningBox tone="strong">{error}</WarningBox> : null}
          {status ? <WarningBox>{status}</WarningBox> : null}
          <Button type="submit" className="w-full" disabled={!configured || isSubmitting}>
            {isSubmitting ? "Accesso in corso" : "Accedi"}
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
