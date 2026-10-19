import { describe, expect, it } from "vitest";
import { env } from "./env";
import {
  getMedicalReviewWarning,
  getMedicalScreeningBlock,
  getMedicalScreeningMode,
  medicalScreeningBlockMessage,
  medicalScreeningOptions,
  selectedMedicalLabels,
} from "./medicalScreening";

describe("getMedicalScreeningMode", () => {
  it("defaults to warn and accepts only block as the alternative", () => {
    expect(getMedicalScreeningMode()).toBe("warn");

    env.medicalScreeningMode = "block";
    expect(getMedicalScreeningMode()).toBe("block");

    env.medicalScreeningMode = "anything-else";
    expect(getMedicalScreeningMode()).toBe("warn");
  });
});

describe("getMedicalScreeningBlock", () => {
  it("never blocks in warn mode", () => {
    expect(getMedicalScreeningBlock(["diabetes"])).toBeNull();
    expect(getMedicalScreeningBlock([])).toBeNull();
  });

  it("blocks flagged profiles in block mode and lists the conditions", () => {
    env.medicalScreeningMode = "block";

    expect(getMedicalScreeningBlock([])).toBeNull();
    const message = getMedicalScreeningBlock(["pregnancy", "diabetes"]);
    expect(message).toContain(medicalScreeningBlockMessage);
    expect(message).toContain("Gravidanza");
    expect(message).toContain("Diabete");
  });
});

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

  it("lists every selected condition", () => {
    expect(selectedMedicalLabels(["pregnancy", "kidneyDisease"])).toBe("Gravidanza, Patologie renali");
    expect(selectedMedicalLabels(["unknown" as never])).toBe("");
  });

  it("keeps every configured option covered by the review warning", () => {
    expect(medicalScreeningOptions).toHaveLength(8);

    for (const option of medicalScreeningOptions) {
      expect(getMedicalReviewWarning([option.value])).toContain(option.label);
    }
  });
});
