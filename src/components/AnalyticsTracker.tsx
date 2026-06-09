"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type CookieConsent = {
  analytics?: boolean;
};

const storageKey = "dietSprintCookieConsent";
const legacyStorageKey = "dietaSprintCookieConsent";
const consentEventName = "dietSprintCookieConsent";
const legacyConsentEventName = "dietaSprintCookieConsent";

function hasAnalyticsConsent() {
  try {
    const stored = window.localStorage.getItem(storageKey) || window.localStorage.getItem(legacyStorageKey);
    const consent = stored ? (JSON.parse(stored) as CookieConsent) : null;
    return Boolean(consent?.analytics);
  } catch {
    return false;
  }
}

export function AnalyticsTracker() {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(hasAnalyticsConsent());

    function handleConsentChange() {
      setEnabled(hasAnalyticsConsent());
    }

    window.addEventListener(consentEventName, handleConsentChange);
    window.addEventListener(legacyConsentEventName, handleConsentChange);
    window.addEventListener("storage", handleConsentChange);

    return () => {
      window.removeEventListener(consentEventName, handleConsentChange);
      window.removeEventListener(legacyConsentEventName, handleConsentChange);
      window.removeEventListener("storage", handleConsentChange);
    };
  }, []);

  useEffect(() => {
    if (!enabled || !pathname) {
      return;
    }

    void fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "page_view", path: pathname }),
      keepalive: true,
    }).catch(() => null);
  }, [enabled, pathname]);

  return null;
}
