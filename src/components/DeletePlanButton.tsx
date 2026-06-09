"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "./Button";

type DeletePlanButtonProps = {
  planId: string;
};

export function DeletePlanButton({ planId }: DeletePlanButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  async function deletePlan() {
    const confirmed = window.confirm("Eliminare questo piano salvato?");

    if (!confirmed) {
      return;
    }

    setError("");
    setIsDeleting(true);
    const response = await fetch(`/api/plans/${planId}`, { method: "DELETE" });
    setIsDeleting(false);
    const data = (await response.json().catch(() => null)) as { error?: string; loginUrl?: string } | null;

    if (response.status === 401 && data?.loginUrl) {
      window.location.assign(data.loginUrl);
      return;
    }

    if (!response.ok) {
      setError(data?.error || "Piano non eliminato.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="ghost" size="sm" onClick={deletePlan} disabled={isDeleting}>
        <Trash2 size={16} aria-hidden="true" />
        {isDeleting ? "Elimino..." : "Elimina"}
      </Button>
      {error ? <p className="text-xs font-semibold text-coral">{error}</p> : null}
    </div>
  );
}
