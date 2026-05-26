"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { WarningBox } from "@/components/WarningBox";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";
import { MailCheck } from "lucide-react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const configured = isSupabaseConfigured();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus("");

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
      setError(authError.message);
      return;
    }

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
          <Button type="submit" className="w-full" disabled={!configured}>
            Invia link di accesso
          </Button>
        </form>
      </Card>
    </main>
  );
}
