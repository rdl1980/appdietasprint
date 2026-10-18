// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AiCoachPanel } from "@/components/AiCoachPanel";
import { CheckoutButton } from "@/components/CheckoutButton";
import { generateMealPlan } from "@/lib/generateMealPlan";
import { baseProfile } from "../fixtures/profiles";

const plan = generateMealPlan(baseProfile, { days: 1 });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AiCoachPanel", () => {
  it("keeps the submit disabled until the question is long enough", async () => {
    render(<AiCoachPanel profile={baseProfile} plan={plan} />);
    const button = screen.getByRole("button", { name: /chiedi al coach/i });

    expect(button).toBeDisabled();
    await userEvent.type(screen.getByLabelText(/domanda per il coach ai/i), "Fame sera");
    expect(button).toBeEnabled();
  });

  it("shows the answer and the fallback notice", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ answer: "Bevi acqua.", fallback: true }) });
    vi.stubGlobal("fetch", fetchMock);
    render(<AiCoachPanel profile={baseProfile} plan={plan} />);

    await userEvent.type(screen.getByLabelText(/domanda per il coach ai/i), "Come gestisco la fame?");
    await userEvent.click(screen.getByRole("button", { name: /chiedi al coach/i }));

    expect(await screen.findByText("Bevi acqua.")).toBeInTheDocument();
    expect(screen.getByText(/risposta locale/i)).toBeInTheDocument();
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ question: "Come gestisco la fame?", profile: baseProfile });
  });

  it("surfaces API errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: "Il coach AI e' disponibile solo con Premium." }) }));
    render(<AiCoachPanel profile={baseProfile} plan={plan} />);

    await userEvent.type(screen.getByLabelText(/domanda per il coach ai/i), "Come gestisco la fame?");
    await userEvent.click(screen.getByRole("button", { name: /chiedi al coach/i }));

    expect(await screen.findByText(/solo con premium/i)).toBeInTheDocument();
  });

  it("does not call the API when locked", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<AiCoachPanel profile={baseProfile} plan={plan} locked />);

    expect(screen.getByLabelText(/domanda per il coach ai/i)).toBeDisabled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("CheckoutButton", () => {
  it("redirects to the Stripe url", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ url: "https://checkout.stripe.com/x" }) }));
    const assign = vi.fn();
    vi.stubGlobal("location", { ...window.location, assign });
    render(<CheckoutButton />);

    await userEvent.click(screen.getByRole("button", { name: /acquista premium/i }));

    expect(assign).toHaveBeenCalledWith("https://checkout.stripe.com/x");
  });

  it("redirects to login when the API asks for authentication", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({ error: "Login", loginUrl: "https://dietsprintai.com/login?from=%2Fpricing" }) }));
    const assign = vi.fn();
    vi.stubGlobal("location", { ...window.location, assign });
    render(<CheckoutButton />);

    await userEvent.click(screen.getByRole("button", { name: /acquista premium/i }));

    expect(assign).toHaveBeenCalledWith("https://dietsprintai.com/login?from=%2Fpricing");
  });

  it("shows a message when checkout is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({ error: "Checkout Stripe non configurato." }) }));
    render(<CheckoutButton />);

    await userEvent.click(screen.getByRole("button", { name: /acquista premium/i }));

    expect(await screen.findByText(/checkout stripe non configurato/i)).toBeInTheDocument();
  });
});
