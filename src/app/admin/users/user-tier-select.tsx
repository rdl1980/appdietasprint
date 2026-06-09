"use client";

import { useState } from "react";

type UserTierSelectProps = {
  userId: string;
  initialTier: "free" | "premium";
};

export function UserTierSelect({ userId, initialTier }: UserTierSelectProps) {
  const [tier, setTier] = useState(initialTier);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function updateTier(nextTier: "free" | "premium") {
    const previousTier = tier;
    setTier(nextTier);
    setError("");
    setIsSaving(true);

    const response = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, tier: nextTier }),
    });

    setIsSaving(false);

    if (!response.ok) {
      setTier(previousTier);
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error || "Utente non aggiornato.");
    }
  }

  return (
    <div className="space-y-1">
      <select
        value={tier}
        onChange={(event) => updateTier(event.target.value as "free" | "premium")}
        disabled={isSaving}
        className="h-10 rounded-[8px] border border-ink/10 bg-white px-3 text-sm font-semibold text-ink outline-none focus:border-leaf focus:ring-4 focus:ring-leaf/20"
      >
        <option value="free">Free</option>
        <option value="premium">Premium</option>
      </select>
      {error ? <p className="text-xs font-semibold text-coral">{error}</p> : null}
    </div>
  );
}
