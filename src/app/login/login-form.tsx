"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { WarningBox } from "@/components/WarningBox";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";
import { MailCheck } from "lucide-react";

const loginCooldownKey = "dietaSprintLoginCooldownUntil";
const loginCooldownMs = 60 * 1000;

function translateAuthError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("rate limit")) {
    return "Hai richiesto troppi link in poco tempo. Aspetta qualche minuto prima di riprovare. Per la produzione configura un SMTP personalizzato in Supabase.";
  }

  if (normalized.includes("error sending magic link email")) {
    return "Supabase non riesce a inviare l'email di accesso. Controlla in Supabase Auth che SMTP Resend sia attivo, che host/porta/utente/password siano corretti e che l'indirizzo mittente usi un dominio verificato in Resend.";
  }

  if (normalized.includes("email address not authorized")) {
    return "Questa email non e' autorizzata dal servizio email di test di Supabase. Attiva SMTP personalizzato oppure aggiungi l'email al team del progetto Supabase.";
  }

  return message;
}

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const configured = isSupabaseConfigured();
  const isCoolingDown = cooldownUntil > Date.now();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authError = params.get("authError");

    if (authError === "link_invalid_or_expired") {
      setError("Il link di accesso non e' valido o e' scaduto. Richiedi una nuova email e usa l'ultimo link ricevuto.");
    }

    if (authError === "supabase_not_configured") {
      setError("Supabase non e' ancora configurato.");
    }
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus("");

    const storedCooldown = Number(window.localStorage.getItem(loginCooldownKey) || 0);
    if (storedCooldown > Date.now()) {
      setCooldownUntil(storedCooldown);
      setError("Link gia' richiesto da poco. Attendi un minuto prima di inviarne un altro.");
      return;
    }

    if (!accepted) {
      setError("Per creare un account devi accettare privacy policy e termini.");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase non e' ancora configurato.");
      return;
    }

    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError) {
      setError(translateAuthError(authError.message));
      return;
    }

    const nextCooldown = Date.now() + loginCooldownMs;
    window.localStorage.setItem(loginCooldownKey, String(nextCooldown));
    setCooldownUntil(nextCooldown);
    setStatus("Controlla la tua email: ti abbiamo inviato un link di accesso.");
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <Card>
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-mint text-leaf">
            <MailCheck size={22} aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-leaf">Accesso</p>
            <h1 className="text-2xl font-black text-ink">Entra con email</h1>
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
          <label className="flex items-start gap-3 rounded-[8px] border border-ink/10 bg-cream p-4 text-sm leading-6 text-ink/70">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(event) => setAccepted(event.target.checked)}
              className="mt-1 h-4 w-4 accent-leaf"
            />
            <span>
              Accetto <Link className="font-bold text-leaf" href="/legal/privacy">privacy policy</Link>,{" "}
              <Link className="font-bold text-leaf" href="/legal/terms">termini</Link> e trattamento dei dati
              necessari a salvare profili alimentari e piani.
            </span>
          </label>
          {error ? <WarningBox tone="strong">{error}</WarningBox> : null}
          {status ? <WarningBox>{status}</WarningBox> : null}
          <Button type="submit" className="w-full" disabled={!configured || isCoolingDown}>
            {isCoolingDown ? "Attendi prima di reinviare" : "Invia link di accesso"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
