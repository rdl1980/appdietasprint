"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/Button";
import { WarningBox } from "@/components/WarningBox";

export function PrivacyRequestForm() {
  const [requestType, setRequestType] = useState("access");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    setError("");
    setIsSubmitting(true);

    const response = await fetch("/api/privacy-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestType, notes }),
    });
    const data = (await response.json()) as { error?: string; requestId?: string };
    setIsSubmitting(false);

    if (!response.ok) {
      setError(data.error || "Richiesta non salvata.");
      return;
    }

    setStatus(`Richiesta registrata. ID: ${data.requestId}`);
    setNotes("");
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-ink">Tipo richiesta</span>
        <select
          value={requestType}
          onChange={(event) => setRequestType(event.target.value)}
          className="h-12 w-full rounded-[8px] border border-ink/10 bg-white px-4 text-ink outline-none transition focus:border-leaf focus:ring-4 focus:ring-leaf/20"
        >
          <option value="access">Accesso</option>
          <option value="rectification">Rettifica</option>
          <option value="export">Export dati</option>
          <option value="erasure">Cancellazione</option>
          <option value="objection">Opposizione</option>
        </select>
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-ink">Note</span>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          className="min-h-28 w-full rounded-[8px] border border-ink/10 bg-white px-4 py-3 text-ink outline-none transition focus:border-leaf focus:ring-4 focus:ring-leaf/20"
          placeholder="Dettagli utili per gestire la richiesta"
        />
      </label>
      {error ? <WarningBox tone="strong">{error}</WarningBox> : null}
      {status ? <WarningBox>{status}</WarningBox> : null}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Invio..." : "Registra richiesta"}
      </Button>
    </form>
  );
}
