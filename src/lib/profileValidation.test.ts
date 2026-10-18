import { describe, expect, it } from "vitest";
import { profileLimits, validateProfile } from "./profileValidation";
import { baseProfile } from "../../tests/fixtures/profiles";

function expectInvalid(input: unknown, fragment: string) {
  const result = validateProfile(input);

  expect(result.ok).toBe(false);

  if (!result.ok) {
    expect(result.errors.join(" ")).toContain(fragment);
  }
}

describe("validateProfile", () => {
  it("accepts a complete valid profile and normalizes optional fields", () => {
    const result = validateProfile({ ...baseProfile, medicalFlags: undefined, allergyFlags: undefined, cookingTime: undefined, excludedFoods: [" tonno ", ""] });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.profile.medicalFlags).toEqual([]);
      expect(result.profile.allergyFlags).toEqual([]);
      expect(result.profile.cookingTime).toBe("standard");
      expect(result.profile.excludedFoods).toEqual(["tonno"]);
    }
  });

  it("rejects non-object input", () => {
    expectInvalid(null, "mancante");
    expectInvalid("profile", "mancante");
    expectInvalid(undefined, "mancante");
  });

  it("enforces numeric ranges matching the database constraints", () => {
    expectInvalid({ ...baseProfile, age: profileLimits.age.min - 1 }, "Eta'");
    expectInvalid({ ...baseProfile, age: profileLimits.age.max + 1 }, "Eta'");
    expectInvalid({ ...baseProfile, age: 35.5 }, "Eta'");
    expectInvalid({ ...baseProfile, heightCm: 119 }, "Altezza");
    expectInvalid({ ...baseProfile, heightCm: 231 }, "Altezza");
    expectInvalid({ ...baseProfile, weightKg: 34.9 }, "Peso");
    expectInvalid({ ...baseProfile, weightKg: 250.1 }, "Peso");
    expectInvalid({ ...baseProfile, mealsPerDay: 1 }, "Pasti");
    expectInvalid({ ...baseProfile, mealsPerDay: 6 }, "Pasti");
    expectInvalid({ ...baseProfile, targetCalories: 700 }, "Target");
    expectInvalid({ ...baseProfile, targetCalories: 6001 }, "Target");
    expectInvalid({ ...baseProfile, targetCalories: "1800" }, "Target");
  });

  it("accepts boundary values", () => {
    expect(validateProfile({ ...baseProfile, age: 18, heightCm: 120, weightKg: 35, mealsPerDay: 2, targetCalories: 800 }).ok).toBe(true);
    expect(validateProfile({ ...baseProfile, age: 100, heightCm: 230, weightKg: 250, mealsPerDay: 5, targetCalories: 6000 }).ok).toBe(true);
    expect(validateProfile({ ...baseProfile, targetCalories: null }).ok).toBe(true);
  });

  it("rejects invalid enum values", () => {
    expectInvalid({ ...baseProfile, sex: "other" }, "Sesso");
    expectInvalid({ ...baseProfile, activityLevel: "extreme" }, "attivita'");
    expectInvalid({ ...baseProfile, goal: "bulk" }, "Obiettivo");
    expectInvalid({ ...baseProfile, dietType: "paleo" }, "dieta");
    expectInvalid({ ...baseProfile, simplicityLevel: "chef" }, "semplicita'");
    expectInvalid({ ...baseProfile, cookingTime: "slow" }, "Tempo cucina");
    expectInvalid({ ...baseProfile, budgetMode: "yes" }, "budget");
  });

  it("rejects invalid flag arrays", () => {
    expectInvalid({ ...baseProfile, medicalFlags: ["flu"] }, "Screening");
    expectInvalid({ ...baseProfile, medicalFlags: "diabetes" }, "Screening");
    expectInvalid({ ...baseProfile, allergyFlags: ["peanuts"] }, "Allergie");
    expectInvalid({ ...baseProfile, excludedFoods: "tonno" }, "Cibi esclusi");
  });

  it("bounds excluded foods size", () => {
    expectInvalid({ ...baseProfile, excludedFoods: Array.from({ length: profileLimits.excludedFoodsMax + 1 }, () => "x") }, "Troppi");
    expectInvalid({ ...baseProfile, excludedFoods: ["x".repeat(profileLimits.excludedFoodLengthMax + 1)] }, "Troppi");
  });

  it("dedupes flags", () => {
    const result = validateProfile({ ...baseProfile, medicalFlags: ["diabetes", "diabetes"], allergyFlags: ["nuts", "nuts"] });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.profile.medicalFlags).toEqual(["diabetes"]);
      expect(result.profile.allergyFlags).toEqual(["nuts"]);
    }
  });

  it("reports every problem at once", () => {
    const result = validateProfile({ ...baseProfile, age: 5, sex: "x", dietType: "y" });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.errors.length).toBe(3);
    }
  });
});
