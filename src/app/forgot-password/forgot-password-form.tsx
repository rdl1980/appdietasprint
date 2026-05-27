"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { WarningBox } from "@/components/WarningBox";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const configured = isSupabaseConfigured();

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

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm?next=/account/password`,
    });

    if (resetError) {
      setError(resetError.message);
      setIsSubmitting(false);
      return;
    }

    setStatus("Se l'email e' registrata, riceverai un link per impostare una nuova password.");
    setIsSubmitting(false);
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <Card>
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-mint text-leaf">
            <KeyRound size={22} aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-leaf">Recupero</p>
            <h1 className="text-2xl font-black text-ink">Reimposta password</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="nome@email.it"
          />
          {error ? <WarningBox tone="strong">{error}</WarningBox> : null}
          {status ? <WarningBox>{status}</WarningBox> : null}
          <Button type="submit" className="w-full" disabled={!configured || isSubmitting}>
            {isSubmitting ? "Invio in corso" : "Invia link di recupero"}
          </Button>
        </form>

        <p className="mt-5 text-sm text-ink/65">
          Ricordi la password?{" "}
          <Link className="font-bold text-leaf hover:text-ink" href="/login">
            Accedi
          </Link>
        </p>
      </Card>
    </main>
  );
}
