"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "./Button";
import { legalDocumentVersions } from "@/lib/legalVersions";

type CookieConsent = {
  version: string;
  essential: true;
  analytics: boolean;
  marketing: boolean;
  acceptedAt: string;
};

const storageKey = "dietSprintCookieConsent";
const legacyStorageKey = "dietaSprintCookieConsent";
const consentEventName = "dietSprintCookieConsent";
const legacyConsentEventName = "dietaSprintCookieConsent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey) || window.localStorage.getItem(legacyStorageKey);

    if (!stored) {
      setVisible(true);
      return;
    }

    try {
      const consent = JSON.parse(stored) as CookieConsent;
      window.localStorage.setItem(storageKey, JSON.stringify(consent));
      window.localStorage.removeItem(legacyStorageKey);
      setVisible(consent.version !== legalDocumentVersions.cookies);
    } catch {
      setVisible(true);
    }
  }, []);

  function saveConsent(next: Pick<CookieConsent, "analytics" | "marketing">) {
    const consent: CookieConsent = {
      version: legalDocumentVersions.cookies,
      essential: true,
      analytics: next.analytics,
      marketing: next.marketing,
      acceptedAt: new Date().toISOString(),
    };

    window.localStorage.setItem(storageKey, JSON.stringify(consent));
    window.localStorage.removeItem(legacyStorageKey);
    window.dispatchEvent(new CustomEvent(consentEventName, { detail: consent }));
    window.dispatchEvent(new CustomEvent(legacyConsentEventName, { detail: consent }));
    setVisible(false);
  }

  if (!visible) {
    return null;
  }

  return (
    <aside className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-4xl rounded-[8px] border border-ink/10 bg-white p-4 shadow-soft">
      <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <h2 className="text-base font-black text-ink">Preferenze cookie</h2>
          <p className="mt-2 text-sm leading-6 text-ink/65">
            Usiamo cookie tecnici necessari. Analytics e marketing restano spenti finche' non li abiliti.
            Puoi cambiare idea dalla pagina{" "}
            <Link className="font-bold text-leaf" href="/legal/cookies">
              cookie
            </Link>.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <label className="flex items-center gap-3 rounded-[8px] bg-cream px-3 py-2 text-sm font-semibold text-ink">
              <input
                type="checkbox"
                checked={analytics}
                onChange={(event) => setAnalytics(event.target.checked)}
                className="h-4 w-4 accent-leaf"
              />
              Analytics privacy-first
            </label>
            <label className="flex items-center gap-3 rounded-[8px] bg-cream px-3 py-2 text-sm font-semibold text-ink">
              <input
                type="checkbox"
                checked={marketing}
                onChange={(event) => setMarketing(event.target.checked)}
                className="h-4 w-4 accent-leaf"
              />
              Marketing
            </label>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row md:flex-col">
          <Button type="button" size="sm" onClick={() => saveConsent({ analytics: true, marketing: true })}>
            Accetta tutto
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={() => saveConsent({ analytics, marketing })}>
            Salva scelte
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => saveConsent({ analytics: false, marketing: false })}>
            Solo necessari
          </Button>
        </div>
      </div>
    </aside>
  );
}
