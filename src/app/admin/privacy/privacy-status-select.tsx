"use client";

import { useState } from "react";

const statusLabels: Record<string, string> = {
  open: "Aperta",
  in_review: "In revisione",
  completed: "Completata",
  rejected: "Respinta",
};

type PrivacyStatusSelectProps = {
  requestId: string;
  initialStatus: string;
};

export function PrivacyStatusSelect({ requestId, initialStatus }: PrivacyStatusSelectProps) {
  const [status, setStatus] = useState(initialStatus);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function updateStatus(nextStatus: string) {
    setStatus(nextStatus);
    setError("");
    setIsSaving(true);
    const response = await fetch("/api/admin/privacy-requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, status: nextStatus }),
    });
    setIsSaving(false);

    if (!response.ok) {
      setStatus(status);
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error || "Stato non aggiornato.");
    }
  }

  return (
    <div className="space-y-1">
      <select
        value={status}
        onChange={(event) => updateStatus(event.target.value)}
        disabled={isSaving}
        className="h-10 rounded-[8px] border border-ink/10 bg-white px-3 text-sm font-semibold text-ink outline-none focus:border-leaf focus:ring-4 focus:ring-leaf/20"
      >
        {Object.entries(statusLabels).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      {error ? <p className="text-xs font-semibold text-coral">{error}</p> : null}
    </div>
  );
}
