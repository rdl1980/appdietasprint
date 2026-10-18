// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { GroceryList } from "@/components/GroceryList";

const items = [
  { name: "Petto di pollo", grams: 450 },
  { name: "Zucchine", grams: 300 },
  { name: "Yogurt greco intero", grams: 340 },
  { name: "Cannella", grams: 5 },
];

describe("GroceryList", () => {
  it("groups items by supermarket category", () => {
    render(<GroceryList items={items} />);

    expect(screen.getByRole("heading", { name: "Lista spesa 7 giorni" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Proteine" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Ortofrutta" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Freschi" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Altro" })).toBeInTheDocument();

    const proteins = screen.getByRole("heading", { name: "Proteine" }).parentElement!;
    expect(within(proteins).getByText("Petto di pollo")).toBeInTheDocument();
    expect(within(proteins).getByText("450 g")).toBeInTheDocument();
  });

  it("lets the user check items off", async () => {
    render(<GroceryList items={items} />);

    const checkbox = screen.getByRole("checkbox", { name: /zucchine/i });
    expect(checkbox).not.toBeChecked();

    await userEvent.click(checkbox);

    expect(checkbox).toBeChecked();
    expect(screen.getByText("Zucchine")).toHaveClass("line-through");
  });

  it("renders nothing dangerous for an empty list", () => {
    render(<GroceryList items={[]} />);

    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
  });
});
