// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getAuthenticatedUser = vi.fn();

vi.mock("@/lib/supabase/data", () => ({ getAuthenticatedUser: () => getAuthenticatedUser() }));
vi.mock("@/lib/admin", () => ({ isAdminUser: (user: { email?: string } | null) => user?.email === "admin@example.com" }));

const { Header } = await import("@/components/Header");

async function renderHeader() {
  render(await Header());
}

beforeEach(() => {
  getAuthenticatedUser.mockReset();
});

describe("Header", () => {
  it("offers login and a mobile menu with the public links when logged out", async () => {
    getAuthenticatedUser.mockResolvedValue(null);
    await renderHeader();

    expect(screen.getByRole("link", { name: /accedi \/ registrati/i })).toHaveAttribute("href", "/login");
    expect(screen.queryByRole("button", { name: /^esci$/i })).toBeNull();

    const mobileNav = screen.getByRole("navigation", { name: /navigazione mobile/i });
    expect(within(mobileNav).getByRole("link", { name: "Planner" })).toHaveAttribute("href", "/planner");
    expect(within(mobileNav).getByRole("link", { name: "Prezzi" })).toHaveAttribute("href", "/pricing");
    expect(within(mobileNav).queryByRole("link", { name: "Backlog" })).toBeNull();
  });

  it("shows a compact account control and a POST logout when logged in", async () => {
    getAuthenticatedUser.mockResolvedValue({ email: "user@example.com" });
    await renderHeader();

    // Mobile: icon-only link labelled with the email; desktop: the email button. Both go to /account.
    expect(screen.getByRole("link", { name: "Account user@example.com" })).toHaveAttribute("href", "/account");
    const logout = screen.getByRole("button", { name: /^esci$/i });
    expect(logout.closest("form")).toHaveAttribute("method", "post");
    expect(logout.closest("form")).toHaveAttribute("action", "/auth/logout");
    expect(screen.queryByRole("navigation", { name: /navigazione mobile/i })).not.toBeNull();
    expect(screen.queryByText("Backlog")).toBeNull();
  });

  it("lists the admin links in both navigations for admins", async () => {
    getAuthenticatedUser.mockResolvedValue({ email: "admin@example.com" });
    await renderHeader();

    const desktopNav = screen.getByRole("navigation", { name: /navigazione principale/i });
    const mobileNav = screen.getByRole("navigation", { name: /navigazione mobile/i });
    expect(within(desktopNav).getByRole("link", { name: "Backlog" })).toHaveAttribute("href", "/backlog");
    expect(within(mobileNav).getByRole("link", { name: "Backlog" })).toHaveAttribute("href", "/backlog");
    expect(within(mobileNav).getByRole("link", { name: "GDPR" })).toHaveAttribute("href", "/admin/privacy");
  });
});
