"use client";

import { FormEvent, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import type { MealPlan, UserProfile } from "@/lib/types";

type AiCoachPanelProps = {
  profile: UserProfile;
  plan: MealPlan;
  locked?: boolean;
};

type CoachResponse = {
  answer?: string;
  blocked?: boolean;
  fallback?: boolean;
  error?: string;
};

export function AiCoachPanel({ profile, plan, locked = false }: AiCoachPanelProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function askCoach(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (locked) {
      setStatus("Il coach AI e' disponibile con Premium.");
      return;
    }

    setStatus("");
    setAnswer("");
    setLoading(true);

    try {
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question, profile, plan }),
      });
      const data = (await response.json().catch(() => ({}))) as CoachResponse;

      if (!response.ok || !data.answer) {
        setStatus(data.error || "Coach AI non disponibile.");
        return;
      }

      setAnswer(data.answer);
      setStatus(data.fallback ? "Risposta locale: configura OpenAI per il coach generativo." : "");
    } catch {
      setStatus("Connessione al coach non riuscita.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <div className="flex items-center gap-3">
        <Sparkles className="h-5 w-5 text-leaf" aria-hidden="true" />
        <h2 className="text-xl font-black text-ink">Coach AI</h2>
      </div>
      <form className="mt-4 space-y-3" onSubmit={askCoach}>
        <label className="block">
          <span className="sr-only">Domanda per il coach AI</span>
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            minLength={8}
            maxLength={600}
            disabled={locked || loading}
            placeholder="Es. Come gestisco la fame serale restando nel piano?"
            className="min-h-28 w-full resize-y rounded-[8px] border border-ink/10 bg-cream px-4 py-3 text-sm text-ink outline-none transition focus:border-leaf focus:bg-white focus:ring-2 focus:ring-leaf/20 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </label>
        <Button type="submit" disabled={locked || loading || question.trim().length < 8} size="sm">
          <Sparkles size={16} aria-hidden="true" />
          {loading ? "Elaboro..." : "Chiedi al coach"}
        </Button>
      </form>
      {status ? <p className="mt-3 text-sm font-semibold text-coral">{status}</p> : null}
      {answer ? (
        <div className="mt-4 rounded-[8px] border border-leaf/15 bg-mint p-4 text-sm leading-6 text-ink/75">
          {answer}
        </div>
      ) : null}
    </Card>
  );
}
