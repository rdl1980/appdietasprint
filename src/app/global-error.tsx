"use client";

import { useEffect } from "react";
import { Button } from "@/components/Button";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    fetch("/api/errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: error.message,
        digest: error.digest,
        stack: error.stack,
        path: window.location.pathname,
        source: "global-error",
      }),
    }).catch(() => undefined);
  }, [error]);

  return (
    <html lang="it">
      <body>
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-4 py-12 text-center">
          <p className="mx-auto mb-4 inline-flex rounded-full bg-mint px-4 py-2 text-sm font-bold text-leaf">
            Errore applicazione
          </p>
          <h1 className="text-3xl font-black text-ink">Qualcosa non ha funzionato.</h1>
          <p className="mt-3 leading-7 text-ink/65">
            Abbiamo registrato un evento tecnico senza includere dati sensibili. Puoi riprovare o tornare alla home.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button type="button" onClick={reset}>
              Riprova
            </Button>
            <Button href="/" variant="secondary">
              Home
            </Button>
          </div>
        </main>
      </body>
    </html>
  );
}
