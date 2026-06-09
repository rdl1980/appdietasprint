"use client";

import { FormEvent, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/Button";
import { WarningBox } from "@/components/WarningBox";

export function DeleteAccountForm() {
  const [confirmation, setConfirmation] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    setError("");

    if (!accepted || confirmation !== "ELIMINA") {
      setError("Spunta la conferma e scrivi ELIMINA per cancellare l'account.");
      return;
    }

    setIsDeleting(true);
    const response = await fetch("/api/account", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmation }),
    });
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    setIsDeleting(false);

    if (!response.ok) {
      setError(data?.error || "Account non eliminato.");
      return;
    }

    setStatus("Account eliminato. Verrai reindirizzato alla chiusura sessione.");
    window.setTimeout(() => {
      window.location.href = "/auth/logout";
    }, 1200);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-ink">Conferma testuale</span>
        <input
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          placeholder="Scrivi ELIMINA"
          className="h-12 w-full rounded-[8px] border border-ink/10 bg-white px-4 text-ink outline-none transition placeholder:text-ink/35 focus:border-leaf focus:ring-4 focus:ring-leaf/20"
          autoComplete="off"
        />
      </label>
      <label className="flex items-start gap-3 rounded-[8px] border border-coral/25 bg-coral/5 p-4 text-sm leading-6 text-ink/70">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(event) => setAccepted(event.target.checked)}
          className="mt-1 h-4 w-4 accent-coral"
        />
        <span>Confermo di voler eliminare account, profili alimentari, piani salvati, lista spesa e consensi.</span>
      </label>
      {error ? <WarningBox tone="strong">{error}</WarningBox> : null}
      {status ? <WarningBox>{status}</WarningBox> : null}
      <Button type="submit" variant="ghost" disabled={isDeleting} className="w-full justify-center text-coral ring-1 ring-coral/25 sm:w-auto">
        <Trash2 size={16} aria-hidden="true" />
        {isDeleting ? "Eliminazione..." : "Elimina account"}
      </Button>
    </form>
  );
}
