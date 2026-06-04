export const legalDocumentVersions = {
  privacy: "privacy-2026-06-04",
  terms: "terms-2026-06-04",
  disclaimer: "disclaimer-2026-06-04",
  cookies: "cookies-2026-06-04",
  marketing: "marketing-2026-06-04",
} as const;

export const consentDocuments = [
  {
    document: "privacy",
    label: "Privacy policy",
    version: legalDocumentVersions.privacy,
  },
  {
    document: "terms",
    label: "Termini di servizio",
    version: legalDocumentVersions.terms,
  },
  {
    document: "disclaimer",
    label: "Disclaimer salute",
    version: legalDocumentVersions.disclaimer,
  },
] as const;
