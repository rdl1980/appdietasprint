import Link from "next/link";
import { Button } from "./Button";

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-ink/10 bg-cream/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="text-lg font-black text-ink">
          DietaSprint AI
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-semibold text-ink/70 sm:flex">
          <Link href="/planner" className="hover:text-ink">
            Planner
          </Link>
          <Link href="/pricing" className="hover:text-ink">
            Prezzi
          </Link>
          <Link href="/legal/disclaimer" className="hover:text-ink">
            Disclaimer
          </Link>
        </nav>
        <Button href="/planner" size="sm">
          Inizia
        </Button>
      </div>
    </header>
  );
}
