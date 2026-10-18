"use client";

import { useState } from "react";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/Button";

type CheckoutButtonProps = {
  className?: string;
};

type CheckoutResponse = {
  url?: string;
  error?: string;
  loginUrl?: string;
};

export function CheckoutButton({ className = "" }: CheckoutButtonProps) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function startCheckout() {
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = (await response.json().catch(() => ({}))) as CheckoutResponse;

      if (response.status === 401 && data.loginUrl) {
        window.location.assign(data.loginUrl);
        return;
      }

      if (!response.ok || !data.url) {
        setError(data.error || "Checkout non disponibile. Riprova tra poco.");
        return;
      }

      window.location.assign(data.url);
    } catch {
      setError("Connessione al checkout non riuscita.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      <Button type="button" onClick={startCheckout} disabled={loading} className="w-full">
        <CreditCard size={18} aria-hidden="true" />
        {loading ? "Apro Stripe..." : "Acquista Premium"}
      </Button>
      {error ? (
        <p className="mt-3 rounded-[8px] border border-coral/30 bg-coral/10 px-3 py-2 text-sm font-semibold text-coral">
          {error}
        </p>
      ) : null}
    </div>
  );
}
