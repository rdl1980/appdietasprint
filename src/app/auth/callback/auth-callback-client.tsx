"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/Card";
import { WarningBox } from "@/components/WarningBox";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { LoaderCircle } from "lucide-react";

export function AuthCallbackClient() {
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function finishLogin() {
      const supabase = createSupabaseBrowserClient();

      if (!supabase) {
        setError("Supabase non e' configurato.");
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setError(exchangeError.message);
          return;
        }
      }

      // Hash-token links are processed by the browser client on initialization.
      for (let attempt = 0; attempt < 10; attempt += 1) {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          setError(sessionError.message);
          return;
        }

        if (data.session) {
          window.location.replace("/account");
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      if (isMounted) {
        setError("Sessione non trovata. Richiedi un nuovo link di accesso e aprilo nello stesso browser.");
      }
    }

    finishLogin();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="mx-auto grid min-h-screen max-w-xl place-items-center px-4 py-10">
      <Card className="w-full text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-mint text-leaf">
          <LoaderCircle className="h-6 w-6 animate-spin" aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-2xl font-black text-ink">Accesso in corso</h1>
        <p className="mt-2 text-sm leading-6 text-ink/65">
          Stiamo completando il login e preparando il tuo account.
        </p>
        {error ? (
          <div className="mt-5 text-left">
            <WarningBox tone="strong">
              {error} <Link className="font-bold text-leaf" href="/login">Richiedi un nuovo link</Link>.
            </WarningBox>
          </div>
        ) : null}
      </Card>
    </main>
  );
}
