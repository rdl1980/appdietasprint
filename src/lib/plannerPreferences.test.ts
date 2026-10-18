import { describe, expect, it } from "vitest";
import { allergyOptions, cookingTimeOptions, excludedFoodsFromAllergies } from "./plannerPreferences";

describe("planner preferences", () => {
  it("covers every allergy flag with a label and at least one excluded food", () => {
    expect(allergyOptions.map((option) => option.value)).toEqual(["gluten", "lactose", "eggs", "fish", "soy", "nuts"]);

    for (const option of allergyOptions) {
      expect(option.label.length).toBeGreaterThan(2);
      expect(option.excludedFoods.length).toBeGreaterThan(0);
    }
  });

  it("covers every cooking time preference", () => {
    expect(cookingTimeOptions.map((option) => option.value)).toEqual(["ready", "quick", "standard", "batch"]);
  });

  it("returns no exclusions by default", () => {
    expect(excludedFoodsFromAllergies()).toEqual([]);
    expect(excludedFoodsFromAllergies([])).toEqual([]);
  });

  it("merges excluded foods for the selected allergies", () => {
    const foods = excludedFoodsFromAllergies(["fish", "nuts"]);

    expect(foods).toContain("salmone");
    expect(foods).toContain("mandorle");
    expect(foods).not.toContain("uova");
  });
});
