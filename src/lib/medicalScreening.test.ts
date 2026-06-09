import { describe, expect, it } from "vitest";
import { getMedicalReviewWarning, medicalScreeningOptions } from "./medicalScreening";

describe("getMedicalReviewWarning", () => {
  it("does not add a review warning when no flags are selected", () => {
    expect(getMedicalReviewWarning([])).toBeNull();
    expect(getMedicalReviewWarning()).toBeNull();
  });

  it("requires medical review for selected screening flags without blocking generation", () => {
    const warning = getMedicalReviewWarning(["diabetes"]);

    expect(warning).toContain("Review medica necessaria");
    expect(warning).toContain("Diabete");
    expect(warning).not.toContain("non genera");
  });

  it("keeps every configured option covered by the review warning", () => {
    for (const option of medicalScreeningOptions) {
      expect(getMedicalReviewWarning([option.value])).toContain(option.label);
    }
  });
});
