import Link from "next/link";
import { ClipboardList, Menu, UserRound } from "lucide-react";
import { Button } from "./Button";
import { isAdminUser } from "@/lib/admin";
import { getAuthenticatedUser } from "@/lib/supabase/data";

const publicLinks = [
  { href: "/planner", label: "Planner" },
  { href: "/onboarding", label: "Onboarding" },
  { href: "/account", label: "Account" },
  { href: "/pricing", label: "Prezzi" },
  { href: "/legal/disclaimer", label: "Disclaimer" },
  { href: "/legal/privacy", label: "Privacy" },
];

const adminLinks = [
  { href: "/backlog", label: "Backlog" },
  { href: "/admin/backlog", label: "Admin" },
  { href: "/admin/users", label: "Utenti" },
  { href: "/admin/privacy", label: "GDPR" },
  { href: "/admin/templates", label: "Template" },
];

export async function Header() {
  const user = await getAuthenticatedUser();
  const isAdmin = isAdminUser(user);
  const email = user?.email || "Account";

  return (
    <header className="sticky top-0 z-20 border-b border-ink/10 bg-cream/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6">
        <Link href="/" className="shrink-0 whitespace-nowrap text-lg font-black text-ink">
          Diet Sprint AI
        </Link>
        <nav aria-label="Navigazione principale" className="hidden items-center gap-6 text-sm font-semibold text-ink/70 sm:flex">
          {publicLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-ink">
              {link.label}
            </Link>
          ))}
          {isAdmin
            ? adminLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={link.href === "/backlog" ? "font-bold text-leaf hover:text-ink" : "hover:text-ink"}
                >
                  {link.label}
                </Link>
              ))
            : null}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          {user ? (
            <>
              <Link
                href="/account"
                className="grid h-10 w-10 place-items-center rounded-full bg-white text-ink shadow-sm ring-1 ring-ink/10 sm:hidden"
                aria-label={`Account ${email}`}
                title={email}
              >
                <UserRound className="h-5 w-5" aria-hidden="true" />
              </Link>
              <Button href="/account" size="sm" variant="secondary" className="hidden sm:inline-flex">
                <UserRound size={16} aria-hidden="true" />
                <span className="max-w-[140px] truncate">{email}</span>
              </Button>
              <form action="/auth/logout" method="post">
                <Button type="submit" size="sm" variant="ghost" className="ring-1 ring-ink/10">
                  Esci
                </Button>
              </form>
            </>
          ) : (
            <Button href="/login" size="sm">
              Accedi / Registrati
            </Button>
          )}
          {/* Mobile navigation: the desktop nav is hidden under 640px, so every link lives here too. */}
          <details className="relative sm:hidden">
            <summary
              className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-full bg-white text-ink shadow-sm ring-1 ring-ink/10 [&::-webkit-details-marker]:hidden"
              aria-label="Apri menu"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </summary>
            <nav
              aria-label="Navigazione mobile"
              className="absolute right-0 top-12 z-30 flex w-60 flex-col rounded-[8px] bg-white p-2 text-sm font-semibold text-ink shadow-soft ring-1 ring-ink/10"
            >
              {publicLinks.map((link) => (
                <Link key={link.href} href={link.href} className="rounded-[6px] px-3 py-2 hover:bg-mint">
                  {link.label}
                </Link>
              ))}
              {isAdmin ? (
                <>
                  <p className="mt-1 border-t border-ink/10 px-3 pb-1 pt-2 text-xs font-bold uppercase tracking-[0.12em] text-leaf">
                    Admin
                  </p>
                  {adminLinks.map((link) => (
                    <Link key={link.href} href={link.href} className="flex items-center gap-2 rounded-[6px] px-3 py-2 hover:bg-mint">
                      {link.href === "/backlog" ? <ClipboardList className="h-4 w-4 text-leaf" aria-hidden="true" /> : null}
                      {link.label}
                    </Link>
                  ))}
                </>
              ) : null}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
