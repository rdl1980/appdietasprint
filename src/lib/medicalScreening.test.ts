import { describe, expect, it } from "vitest";
import { getMedicalScreeningBlock, medicalScreeningOptions } from "./medicalScreening";

describe("getMedicalScreeningBlock", () => {
  it("allows standard planner generation when no flags are selected", () => {
    expect(getMedicalScreeningBlock([])).toBeNull();
    expect(getMedicalScreeningBlock()).toBeNull();
  });

  it("blocks automatic plans for selected medical screening flags", () => {
    expect(getMedicalScreeningBlock(["diabetes"])).toContain("non genera un piano automatico");
  });

  it("keeps every configured option covered by the blocking rule", () => {
    for (const option of medicalScreeningOptions) {
      expect(getMedicalScreeningBlock([option.value])).toBeTruthy();
    }
  });
});
