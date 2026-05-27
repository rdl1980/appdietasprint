"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { WarningBox } from "@/components/WarningBox";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function translateSignupError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("already registered") || normalized.includes("already been registered")) {
    return "Esiste gia' un account con questa email. Accedi o recupera la password.";
  }

  if (normalized.includes("password")) {
    return "La password non rispetta i requisiti minimi. Usa almeno 8 caratteri.";
  }

  if (normalized.includes("rate limit") || normalized.includes("too many requests")) {
    return "Troppe richieste in poco tempo. Aspetta qualche minuto prima di riprovare.";
  }

  return message;
}

export function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const configured = isSupabaseConfigured();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus("");

    if (!accepted) {
      setError("Per registrarti devi accettare privacy policy e termini.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Le password non coincidono.");
      return;
    }

    setIsSubmitting(true);

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase non e' ancora configurato.");
      setIsSubmitting(false);
      return;
    }

    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    });

    if (signupError) {
      setError(translateSignupError(signupError.message));
      setIsSubmitting(false);
      return;
    }

    if (data.session) {
      window.location.replace("/account");
      return;
    }

    setStatus("Account creato. Controlla la tua email e conferma la registrazione prima di accedere.");
    setIsSubmitting(false);
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <Card>
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-mint text-leaf">
            <UserPlus size={22} aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-leaf">Registrazione</p>
            <h1 className="text-2xl font-black text-ink">Crea il tuo account</h1>
          </div>
        </div>

        {!configured ? (
          <div className="mb-5">
            <WarningBox tone="strong">
              Registrazione disattivata finche' non configuri NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.
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
            helper="Usa almeno 8 caratteri."
            placeholder="Crea una password"
          />
          <Input
            label="Conferma password"
            type="password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Ripeti la password"
          />
          <label className="flex items-start gap-3 rounded-[8px] border border-ink/10 bg-cream p-4 text-sm leading-6 text-ink/70">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(event) => setAccepted(event.target.checked)}
              className="mt-1 h-4 w-4 accent-leaf"
            />
            <span>
              Accetto <Link className="font-bold text-leaf" href="/legal/privacy">privacy policy</Link>,{" "}
              <Link className="font-bold text-leaf" href="/legal/terms">termini</Link> e il trattamento dei dati
              necessari a creare account, profili alimentari e piani.
            </span>
          </label>
          {error ? <WarningBox tone="strong">{error}</WarningBox> : null}
          {status ? <WarningBox>{status}</WarningBox> : null}
          <Button type="submit" className="w-full" disabled={!configured || isSubmitting}>
            {isSubmitting ? "Creazione account" : "Registrati"}
          </Button>
        </form>

        <p className="mt-5 text-sm text-ink/65">
          Hai gia' un account?{" "}
          <Link className="font-bold text-leaf hover:text-ink" href="/login">
            Accedi
          </Link>
        </p>
      </Card>
    </main>
  );
}
