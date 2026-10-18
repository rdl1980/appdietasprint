import { describe, expect, it } from "vitest";
import { parseCsvList, parseIngredientsText, slugifyTemplateId, validateAdminMealTemplate } from "./adminMealTemplates";

describe("admin meal template helpers", () => {
  it("slugifies ids from names", () => {
    expect(slugifyTemplateId("  Pollo al limone & riso  ")).toBe("pollo-al-limone-riso");
    expect(slugifyTemplateId("Caffè Crème")).toBe("caffe-creme");
    expect(slugifyTemplateId("x".repeat(100))).toHaveLength(64);
  });

  it("parses csv lists ignoring blanks", () => {
    expect(parseCsvList("budget, semplice ,, keto")).toEqual(["budget", "semplice", "keto"]);
    expect(parseCsvList("")).toEqual([]);
  });

  it("parses ingredient lines and drops invalid ones", () => {
    expect(parseIngredientsText("Yogurt greco:170\nNoci: 25\nSenza grammi\nZero:0\n:10")).toEqual([
      { name: "Yogurt greco", grams: 170 },
      { name: "Noci", grams: 25 },
    ]);
  });

  it("validates a complete template and normalizes numbers", () => {
    const result = validateAdminMealTemplate({
      name: "Bowl test",
      mealType: "lunch",
      dietTypes: ["balanced"],
      ingredients: [{ name: "Riso", grams: 80 }],
      calories: 450.4,
      protein: 20.6,
      carbs: -3,
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.template).toMatchObject({
        id: "bowl-test",
        name: "Bowl test",
        calories: 450,
        protein: 21,
        carbs: 0,
        fats: 0,
        tags: [],
        active: true,
      });
    }
  });

  it("collects every validation error", () => {
    const result = validateAdminMealTemplate({ dietTypes: ["paleo" as never], mealType: "brunch" as never });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.errors).toEqual([
        "ID richiesto.",
        "Nome richiesto.",
        "Tipo pasto non valido.",
        "Almeno una dieta valida e' richiesta.",
        "Almeno un ingrediente valido e' richiesto.",
        "Calorie richieste.",
      ]);
    }
  });
});
