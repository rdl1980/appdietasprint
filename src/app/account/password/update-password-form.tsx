"use client";

import { FormEvent, useState } from "react";
import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { WarningBox } from "@/components/WarningBox";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function UpdatePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus("");

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

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setIsSubmitting(false);
      return;
    }

    setStatus("Password aggiornata. Puoi continuare a usare il tuo account.");
    setPassword("");
    setConfirmPassword("");
    setIsSubmitting(false);
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <Card>
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-mint text-leaf">
            <LockKeyhole size={22} aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-leaf">Sicurezza</p>
            <h1 className="text-2xl font-black text-ink">Aggiorna password</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nuova password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            helper="Usa almeno 8 caratteri."
          />
          <Input
            label="Conferma nuova password"
            type="password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
          {error ? <WarningBox tone="strong">{error}</WarningBox> : null}
          {status ? <WarningBox>{status}</WarningBox> : null}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Aggiornamento" : "Salva nuova password"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
