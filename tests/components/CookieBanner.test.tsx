// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import { CookieBanner } from "@/components/CookieBanner";
import { legalDocumentVersions } from "@/lib/legalVersions";

const storageKey = "dietSprintCookieConsent";

vi.mock("next/navigation", () => ({ usePathname: () => "/pricing" }));

beforeEach(() => {
  window.localStorage.clear();
});

describe("CookieBanner", () => {
  it("shows the banner without stored consent and stores granular choices", async () => {
    render(<CookieBanner />);

    expect(await screen.findByText("Preferenze cookie")).toBeInTheDocument();

    await userEvent.click(screen.getByLabelText(/analytics privacy-first/i));
    await userEvent.click(screen.getByRole("button", { name: /salva scelte/i }));

    await waitFor(() => expect(screen.queryByText("Preferenze cookie")).not.toBeInTheDocument());

    const consent = JSON.parse(window.localStorage.getItem(storageKey)!);
    expect(consent).toMatchObject({ version: legalDocumentVersions.cookies, essential: true, analytics: true, marketing: false });
  });

  it("accepts everything or only necessary cookies", async () => {
    const { unmount } = render(<CookieBanner />);
    await userEvent.click(await screen.findByRole("button", { name: /accetta tutto/i }));
    expect(JSON.parse(window.localStorage.getItem(storageKey)!)).toMatchObject({ analytics: true, marketing: true });
    unmount();

    window.localStorage.clear();
    render(<CookieBanner />);
    await userEvent.click(await screen.findByRole("button", { name: /solo necessari/i }));
    expect(JSON.parse(window.localStorage.getItem(storageKey)!)).toMatchObject({ analytics: false, marketing: false });
  });

  it("stays hidden with current consent and reappears when the cookie policy version changes", async () => {
    window.localStorage.setItem(storageKey, JSON.stringify({ version: legalDocumentVersions.cookies, essential: true, analytics: false, marketing: false, acceptedAt: "x" }));
    const { unmount } = render(<CookieBanner />);
    await waitFor(() => expect(screen.queryByText("Preferenze cookie")).not.toBeInTheDocument());
    unmount();

    window.localStorage.setItem(storageKey, JSON.stringify({ version: "cookies-2020-01-01", essential: true, analytics: false, marketing: false, acceptedAt: "x" }));
    render(<CookieBanner />);
    expect(await screen.findByText("Preferenze cookie")).toBeInTheDocument();
  });

  it("migrates the legacy storage key", async () => {
    window.localStorage.setItem("dietaSprintCookieConsent", JSON.stringify({ version: legalDocumentVersions.cookies, essential: true, analytics: true, marketing: false, acceptedAt: "x" }));
    render(<CookieBanner />);

    await waitFor(() => expect(window.localStorage.getItem(storageKey)).not.toBeNull());
    expect(window.localStorage.getItem("dietaSprintCookieConsent")).toBeNull();
  });
});

describe("AnalyticsTracker", () => {
  it("does not send events without analytics consent", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    render(<AnalyticsTracker />);
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends a page view once analytics consent is stored", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    window.localStorage.setItem(storageKey, JSON.stringify({ version: legalDocumentVersions.cookies, essential: true, analytics: true, marketing: false, acceptedAt: "x" }));

    render(<AnalyticsTracker />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock.mock.calls[0][0]).toBe("/api/analytics");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ event: "page_view", path: "/pricing" });
  });
});
