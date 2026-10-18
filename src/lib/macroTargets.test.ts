import { describe, expect, it } from "vitest";
import { getMacroTarget } from "./macroTargets";
import { allDietTypes } from "../../tests/fixtures/profiles";

describe("getMacroTarget", () => {
  it.each(allDietTypes)("returns coherent percent ranges for %s", (dietType) => {
    const target = getMacroTarget(dietType, 2000);

    expect(target.proteinPercent[0]).toBeLessThanOrEqual(target.proteinPercent[1]);
    expect(target.carbsPercent[0]).toBeLessThanOrEqual(target.carbsPercent[1]);
    expect(target.fatsPercent[0]).toBeLessThanOrEqual(target.fatsPercent[1]);

    const minSum = target.proteinPercent[0] + target.carbsPercent[0] + target.fatsPercent[0];
    const maxSum = target.proteinPercent[1] + target.carbsPercent[1] + target.fatsPercent[1];

    expect(minSum).toBeLessThanOrEqual(100);
    expect(maxSum).toBeGreaterThanOrEqual(100);
    expect(target.note.length).toBeGreaterThan(10);
  });

  it("converts percentages into grams using 4/4/9 kcal per gram", () => {
    const target = getMacroTarget("mediterranean", 2000);

    expect(target.proteinGrams).toEqual([100, 125]);
    expect(target.carbsGrams).toEqual([200, 250]);
    expect(target.fatsGrams).toEqual([56, 78]);
  });

  it("keeps ketogenic carbs very low and fats high", () => {
    const target = getMacroTarget("ketogenic", 1800);

    expect(target.carbsPercent[1]).toBeLessThanOrEqual(10);
    expect(target.fatsPercent[0]).toBeGreaterThanOrEqual(60);
    expect(target.carbsGrams[1]).toBeLessThanOrEqual(45);
  });

  it("scales linearly with calories", () => {
    const small = getMacroTarget("balanced", 1000);
    const large = getMacroTarget("balanced", 2000);

    expect(Math.abs(large.proteinGrams[0] - small.proteinGrams[0] * 2)).toBeLessThanOrEqual(1);
    expect(Math.abs(large.carbsGrams[1] - small.carbsGrams[1] * 2)).toBeLessThanOrEqual(1);
  });
});
