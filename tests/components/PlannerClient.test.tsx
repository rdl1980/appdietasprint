// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlannerClient } from "@/app/planner/planner-client";
import { env } from "@/lib/env";
import { ResultsClient } from "@/app/results/results-client";
import { baseProfile } from "../fixtures/profiles";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh: vi.fn() }),
  usePathname: () => "/planner",
}));

beforeEach(() => {
  window.localStorage.clear();
  push.mockClear();
});

describe("PlannerClient", () => {
  it("renders every section with the default profile estimate", () => {
    render(<PlannerClient />);

    expect(screen.getByRole("heading", { name: /costruiamo il tuo piano realistico/i })).toBeInTheDocument();
    expect(screen.getByText("Screening salute")).toBeInTheDocument();
    expect(screen.getByText("Allergie e intolleranze")).toBeInTheDocument();
    expect(screen.getByLabelText("Tipo dieta")).toHaveValue("mediterranean");
    expect(screen.getAllByText(/kcal$/).length).toBeGreaterThan(0);
  });

  it("blocks minors and out-of-scale measurements", async () => {
    render(<PlannerClient />);

    await userEvent.clear(screen.getByLabelText("Eta"));
    await userEvent.type(screen.getByLabelText("Eta"), "16");
    await userEvent.click(screen.getByRole("button", { name: /genera piano/i }));

    // Native constraint validation (min=18) stops the submit before the JS guard.
    expect(screen.getByLabelText("Eta")).toBeInvalid();
    expect(push).not.toHaveBeenCalled();
    expect(window.localStorage.getItem("dietSprintProfile")).toBeNull();
  });

  it("shows the medical review warning while still allowing generation", async () => {
    render(<PlannerClient />);

    await userEvent.click(screen.getByLabelText(/diabete/i));

    expect(screen.getByText(/review medica necessaria/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /genera piano/i }));

    expect(push).toHaveBeenCalledWith("/results");
    const stored = JSON.parse(window.localStorage.getItem("dietSprintProfile")!);
    expect(stored.medicalFlags).toEqual(["diabetes"]);
  });

  it("blocks generation for flagged profiles when the screening mode is block", async () => {
    env.medicalScreeningMode = "block";
    render(<PlannerClient />);

    expect(screen.getByText(/il piano automatico viene bloccato/i)).toBeInTheDocument();

    await userEvent.click(screen.getByLabelText(/gravidanza/i));
    await userEvent.click(screen.getByRole("button", { name: /genera piano/i }));

    expect(screen.getByText(/non genera un piano automatico/i)).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
    expect(window.localStorage.getItem("dietSprintProfile")).toBeNull();
  });

  it("stores the final profile with parsed excluded foods and allergies", async () => {
    render(<PlannerClient />);

    await userEvent.selectOptions(screen.getByLabelText("Tipo dieta"), "ketogenic");
    await userEvent.type(screen.getByLabelText(/cibi esclusi/i), "tonno, latte ,");
    await userEvent.click(screen.getByLabelText(/frutta a guscio/i));
    await userEvent.click(screen.getByRole("button", { name: /genera piano/i }));

    const stored = JSON.parse(window.localStorage.getItem("dietSprintProfile")!);
    expect(stored.dietType).toBe("ketogenic");
    expect(stored.excludedFoods).toEqual(["tonno", "latte"]);
    expect(stored.allergyFlags).toEqual(["nuts"]);
    expect(push).toHaveBeenCalledWith("/results");
  });

  it("prefills the form from the account profile when no local draft exists", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ profileId: "p1", profile: { ...baseProfile, age: 51, dietType: "ketogenic", excludedFoods: ["cipolla"] } }) }),
    );
    render(<PlannerClient />);

    await waitFor(() => expect(screen.getByLabelText("Eta")).toHaveValue(51));
    expect(screen.getByLabelText("Tipo dieta")).toHaveValue("ketogenic");
    expect(screen.getByText("Profilo caricato dal tuo account.")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith("/api/profile", expect.anything());
    vi.unstubAllGlobals();
  });

  it("keeps the defaults for anonymous visitors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({ error: "Login richiesto" }) }));
    render(<PlannerClient />);

    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(screen.getByLabelText("Eta")).toHaveValue(35);
    expect(screen.queryByText("Profilo caricato dal tuo account.")).toBeNull();
    vi.unstubAllGlobals();
  });

  it("saves and reloads drafts, migrating legacy keys", async () => {
    window.localStorage.setItem("dietaSprintDraftProfile", JSON.stringify({ ...baseProfile, age: 44 }));
    render(<PlannerClient />);

    await waitFor(() => expect(screen.getByLabelText("Eta")).toHaveValue(44));
    expect(screen.getByText("Bozza caricata.")).toBeInTheDocument();
    expect(window.localStorage.getItem("dietaSprintDraftProfile")).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: /salva bozza/i }));

    expect(screen.getByText(/bozza salvata/i)).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem("dietSprintDraftProfile")!).age).toBe(44);
  });
});

describe("ResultsClient", () => {
  it("asks to fill the planner when no profile is stored", () => {
    render(<ResultsClient planTier="free" />);

    expect(screen.getByRole("heading", { name: /nessun piano trovato/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /vai al planner/i })).toHaveAttribute("href", "/planner");
  });

  it("renders a one-day locked plan for free users", () => {
    window.localStorage.setItem("dietSprintProfile", JSON.stringify(baseProfile));
    render(<ResultsClient planTier="free" />);

    expect(screen.getByRole("heading", { name: /il tuo giorno diet sprint ai/i })).toBeInTheDocument();
    expect(screen.getByText(/free genera solo il piano giornaliero/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /premium sblocca la settimana completa/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /lista spesa/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Coach AI" })).not.toBeInTheDocument();
  });

  it("renders the full week, grocery list and coach for premium users", () => {
    window.localStorage.setItem("dietSprintProfile", JSON.stringify(baseProfile));
    render(<ResultsClient planTier="premium" />);

    expect(screen.getByRole("heading", { name: /la tua settimana diet sprint ai/i })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: "Piano 7 giorni" }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("heading", { name: "Domenica" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /lista spesa 7 giorni/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Coach AI" })).toBeInTheDocument();
  });

  it("lets a logged-in user leave the plan towards the account without logging out", async () => {
    window.localStorage.setItem("dietSprintProfile", JSON.stringify(baseProfile));
    window.localStorage.setItem("dietSprintDraftProfile", JSON.stringify(baseProfile));
    render(<ResultsClient planTier="premium" isLoggedIn />);

    expect(screen.getByRole("link", { name: /modifica dati/i })).toHaveAttribute("href", "/planner");
    expect(screen.getByRole("link", { name: /i miei piani/i })).toHaveAttribute("href", "/account/plans");

    await userEvent.click(screen.getByRole("button", { name: /chiudi piano/i }));

    expect(push).toHaveBeenCalledWith("/account");
    expect(window.localStorage.getItem("dietSprintProfile")).toBeNull();
    expect(window.localStorage.getItem("dietSprintDraftProfile")).not.toBeNull();
  });

  it("sends anonymous visitors to the home when closing the plan", async () => {
    window.localStorage.setItem("dietSprintProfile", JSON.stringify(baseProfile));
    render(<ResultsClient planTier="free" />);

    expect(screen.queryByRole("link", { name: /i miei piani/i })).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: /chiudi piano/i }));

    expect(push).toHaveBeenCalledWith("/");
  });

  it("regenerates the whole first day for premium users", async () => {
    window.localStorage.setItem("dietSprintProfile", JSON.stringify(baseProfile));
    render(<ResultsClient planTier="premium" />);

    const headingsBefore = screen.getAllByRole("button", { name: /rigenera pasto/i }).slice(0, 3).map((button) => button.closest("article")!.querySelector("h3")!.textContent);

    await userEvent.click(screen.getByRole("button", { name: /rigenera giorno/i }));

    const headingsAfter = screen.getAllByRole("button", { name: /rigenera pasto/i }).slice(0, 3).map((button) => button.closest("article")!.querySelector("h3")!.textContent);
    expect(headingsAfter).not.toEqual(headingsBefore);
    expect(screen.queryByText(/nessuna alternativa compatibile/i)).toBeNull();
  });

  it("regenerates a single meal for premium users", async () => {
    window.localStorage.setItem("dietSprintProfile", JSON.stringify(baseProfile));
    render(<ResultsClient planTier="premium" />);

    const buttons = screen.getAllByRole("button", { name: /rigenera pasto/i });
    const firstMealHeading = buttons[0].closest("article")!.querySelector("h3")!.textContent;

    await userEvent.click(buttons[0]);

    const nextHeading = screen.getAllByRole("button", { name: /rigenera pasto/i })[0].closest("article")!.querySelector("h3")!.textContent;
    expect(nextHeading).not.toBe(firstMealHeading);
  });
});
