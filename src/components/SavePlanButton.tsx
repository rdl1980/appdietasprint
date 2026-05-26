"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { WarningBox } from "@/components/WarningBox";
import { MealPlan, UserProfile } from "@/lib/types";
import { Save } from "lucide-react";

type SavePlanButtonProps = {
  profile: UserProfile;
  plan: MealPlan;
};

export function SavePlanButton({ profile, plan }: SavePlanButtonProps) {
  const [accepted, setAccepted] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function savePlan() {
    setStatus("");
    setError("");

    if (!accepted) {
      setError("Per salvare profilo e piano devi confermare il trattamento privacy.");
      return;
    }

    setIsSaving(true);
    const response = await fetch("/api/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile, plan, privacyConsent: accepted }),
    });
    const data = (await response.json()) as { error?: string; planId?: string };
    setIsSaving(false);

    if (!response.ok) {
      setError(data.error || "Salvataggio non riuscito.");
      return;
    }

    setStatus(`Piano salvato. ID: ${data.planId}`);
  }

  return (
    <div className="space-y-3">
      <label className="flex items-start gap-3 rounded-[8px] border border-ink/10 bg-cream p-4 text-sm leading-6 text-ink/70">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(event) => setAccepted(event.target.checked)}
          className="mt-1 h-4 w-4 accent-leaf"
        />
        <span>
          Ho letto privacy e disclaimer e voglio salvare profilo alimentare, piano e lista spesa nel mio account.
        </span>
      </label>
      {error ? (
        <WarningBox tone="strong">
          {error} {error.includes("Login") ? <Link className="font-bold text-leaf" href="/login">Vai al login</Link> : null}
        </WarningBox>
      ) : null}
      {status ? <WarningBox>{status}</WarningBox> : null}
      <Button type="button" onClick={savePlan} disabled={isSaving} className="w-full sm:w-auto">
        <Save size={16} aria-hidden="true" />
        {isSaving ? "Salvataggio..." : "Salva piano"}
      </Button>
    </div>
  );
}
