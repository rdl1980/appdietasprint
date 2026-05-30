import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { Button } from "./Button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/admin";

export async function Header() {
  const supabase = await createSupabaseServerClient();
  const { data } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const isAdmin = isAdminUser(data.user);

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
          <Link href="/account" className="hover:text-ink">
            Account
          </Link>
          <Link href="/pricing" className="hover:text-ink">
            Prezzi
          </Link>
          <Link href="/legal/disclaimer" className="hover:text-ink">
            Disclaimer
          </Link>
          <Link href="/legal/privacy" className="hover:text-ink">
            Privacy
          </Link>
          <Link href="/backlog" className="inline-flex items-center gap-1.5 font-bold text-leaf hover:text-ink">
            Backlog
            <span className="rounded-full bg-lemon/70 px-1.5 py-0.5 text-[10px] font-black uppercase text-ink">temp</span>
          </Link>
          {isAdmin ? (
            <Link href="/admin/backlog" className="hover:text-ink">
              Admin
            </Link>
          ) : null}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/backlog"
            className="grid h-10 w-10 place-items-center rounded-full bg-white text-leaf shadow-sm ring-1 ring-ink/10 sm:hidden"
            aria-label="Apri backlog temporaneo"
            title="Backlog temporaneo"
          >
            <ClipboardList className="h-5 w-5" aria-hidden="true" />
          </Link>
          <Button href="/login" size="sm">
            Accedi / Registrati
          </Button>
        </div>
      </div>
    </header>
  );
}
