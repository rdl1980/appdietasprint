// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MealCard } from "@/components/MealCard";
import { mealTemplates } from "@/lib/mealTemplates";

const meal = mealTemplates[0];
const substitutions = mealTemplates.filter((item) => item.mealType === meal.mealType && item.id !== meal.id).slice(0, 2);

describe("MealCard", () => {
  it("renders meal type, name, ingredients and macros", () => {
    render(<MealCard meal={meal} />);

    expect(screen.getByText("Colazione")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: meal.name })).toBeInTheDocument();
    expect(screen.getByText(`${meal.calories} kcal`)).toBeInTheDocument();

    for (const ingredient of meal.ingredients) {
      expect(screen.getByText(`${ingredient.name} - ${ingredient.grams} g`)).toBeInTheDocument();
    }
  });

  it("shows substitutions and triggers regeneration when unlocked", async () => {
    const onRegenerate = vi.fn();
    render(<MealCard meal={meal} substitutions={substitutions} onRegenerate={onRegenerate} />);

    expect(screen.getByText("Sostituzioni")).toBeInTheDocument();
    expect(screen.getByText(`${substitutions[0].name} - ${substitutions[0].calories} kcal`)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /rigenera pasto/i }));

    expect(onRegenerate).toHaveBeenCalledTimes(1);
  });

  it("hides substitutions and disables regeneration when locked", () => {
    render(<MealCard meal={meal} substitutions={substitutions} onRegenerate={vi.fn()} locked />);

    expect(screen.queryByText("Sostituzioni")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /premium per rigenerare/i })).toBeDisabled();
  });

  it("omits the regenerate button without a handler", () => {
    render(<MealCard meal={meal} />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
