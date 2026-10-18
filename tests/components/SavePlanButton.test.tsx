// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SavePlanButton } from "@/components/SavePlanButton";
import { generateMealPlan } from "@/lib/generateMealPlan";
import { baseProfile } from "../fixtures/profiles";

const plan = generateMealPlan(baseProfile, { days: 1 });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("SavePlanButton", () => {
  it("requires the privacy checkbox before saving", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<SavePlanButton profile={baseProfile} plan={plan} />);

    await userEvent.click(screen.getByRole("button", { name: /salva piano/i }));

    expect(screen.getByText(/confermare il trattamento privacy/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts profile, plan and consent and shows the saved id", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ planId: "plan-42" }) });
    vi.stubGlobal("fetch", fetchMock);
    render(<SavePlanButton profile={baseProfile} plan={plan} />);

    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: /salva piano/i }));

    expect(await screen.findByText(/piano salvato\. id: plan-42/i)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/plans", expect.objectContaining({ method: "POST" }));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ privacyConsent: true, profile: baseProfile });
  });

  it("shows API errors with a login link when authentication is required", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({ error: "Login richiesto" }) }));
    render(<SavePlanButton profile={baseProfile} plan={plan} />);

    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: /salva piano/i }));

    expect(await screen.findByText(/login richiesto/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /vai al login/i })).toHaveAttribute("href", "/login");
  });

  it("is disabled for free users and offers the upgrade", () => {
    render(<SavePlanButton profile={baseProfile} plan={plan} disabled />);

    expect(screen.getByRole("button", { name: /salva piano/i })).toBeDisabled();
    expect(screen.getByRole("link", { name: /sblocca premium/i })).toHaveAttribute("href", "/pricing");
  });
});
