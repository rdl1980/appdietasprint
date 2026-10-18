import { describe, expect, it } from "vitest";
import { consentDocuments, legalDocumentVersions } from "./legalVersions";

describe("legal versions", () => {
  it("uses dated version identifiers for every document", () => {
    for (const [document, version] of Object.entries(legalDocumentVersions)) {
      expect(version, document).toMatch(new RegExp(`^${document}-\\d{4}-\\d{2}-\\d{2}$`));
    }
  });

  it("requires privacy, terms and disclaimer consents when saving a plan", () => {
    expect(consentDocuments.map((document) => document.document)).toEqual(["privacy", "terms", "disclaimer"]);

    for (const document of consentDocuments) {
      expect(document.version).toBe(legalDocumentVersions[document.document]);
      expect(document.label.length).toBeGreaterThan(3);
    }
  });
});
