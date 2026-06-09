import { redirect } from "next/navigation";
import { CalendarDays, Crown, MailCheck, Search, UserRound } from "lucide-react";
import { Header } from "@/components/Header";
import { Card } from "@/components/Card";
import { WarningBox } from "@/components/WarningBox";
import { isAdminUser } from "@/lib/admin";
import { getPlanTier } from "@/lib/entitlements";
import { getAuthenticatedUser, createSupabaseAdminClient, type AppUser } from "@/lib/supabase/data";
import { UserTierSelect } from "./user-tier-select";

type AdminUsersPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type UserListItem = {
  id: string;
  email?: string;
  created_at?: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
  app_metadata?: Record<string, unknown>;
};

function formatDate(value?: string) {
  if (!value) {
    return "Mai";
  }

  return new Date(value).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function toAppUser(user: UserListItem): AppUser {
  return {
    id: user.id,
    email: user.email,
    app_metadata: user.app_metadata,
  };
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const adminUser = await getAuthenticatedUser();

  if (!adminUser) {
    redirect("/login?authError=admin_login_required&from=/admin/users");
  }

  if (!isAdminUser(adminUser)) {
    redirect("/account?adminError=not_admin");
  }

  const params = searchParams ? await searchParams : {};
  const query = typeof params.q === "string" ? params.q.trim().toLowerCase() : "";
  const supabase = await createSupabaseAdminClient();
  const { data, error } = supabase
    ? await supabase.auth.admin.listUsers({ page: 1, perPage: 100 })
    : { data: { users: [] as UserListItem[] }, error: null };

  const users = ((data?.users || []) as UserListItem[])
    .filter((user) => !query || user.email?.toLowerCase().includes(query) || user.id.toLowerCase().includes(query))
    .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));

  const premiumCount = users.filter((user) => getPlanTier(toAppUser(user)) === "premium").length;
  const confirmedCount = users.filter((user) => Boolean(user.email_confirmed_at)).length;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <section className="mb-6">
          <p className="mb-3 inline-flex rounded-full bg-mint px-4 py-2 text-sm font-bold text-leaf">
            Admin utenti
          </p>
          <h1 className="text-3xl font-black text-ink sm:text-5xl">Gestione utenti</h1>
          <p className="mt-3 max-w-3xl leading-7 text-ink/65">
            Cerca account, verifica stato email e gestisci lo sblocco Premium manuale per supporto.
          </p>
        </section>

        {!supabase ? (
          <div className="mb-5">
            <WarningBox tone="strong">Servizio admin non configurato.</WarningBox>
          </div>
        ) : null}

        {error ? (
          <div className="mb-5">
            <WarningBox tone="strong">Utenti non disponibili.</WarningBox>
          </div>
        ) : null}

        <section className="mb-5 grid gap-4 md:grid-cols-3">
          <Card>
            <UserRound className="h-5 w-5 text-leaf" aria-hidden="true" />
            <p className="mt-3 text-3xl font-black text-ink">{users.length}</p>
            <p className="text-sm text-ink/60">Utenti mostrati</p>
          </Card>
          <Card>
            <Crown className="h-5 w-5 text-leaf" aria-hidden="true" />
            <p className="mt-3 text-3xl font-black text-ink">{premiumCount}</p>
            <p className="text-sm text-ink/60">Premium</p>
          </Card>
          <Card>
            <MailCheck className="h-5 w-5 text-leaf" aria-hidden="true" />
            <p className="mt-3 text-3xl font-black text-ink">{confirmedCount}</p>
            <p className="text-sm text-ink/60">Email confermate</p>
          </Card>
        </section>

        <form className="mb-5 flex gap-2" action="/admin/users">
          <label className="relative block flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/45" aria-hidden="true" />
            <span className="sr-only">Cerca utenti</span>
            <input
              name="q"
              defaultValue={query}
              placeholder="Cerca per email o ID"
              className="h-12 w-full rounded-full border border-ink/10 bg-white pl-10 pr-4 text-sm text-ink outline-none focus:border-leaf focus:ring-4 focus:ring-leaf/20"
            />
          </label>
          <button className="rounded-full bg-leaf px-5 text-sm font-bold text-white" type="submit">
            Cerca
          </button>
        </form>

        <section className="grid gap-4">
          {users.length ? (
            users.map((user) => {
              const tier = getPlanTier(toAppUser(user));

              return (
                <Card key={user.id}>
                  <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-mint px-3 py-1 text-xs font-black uppercase text-leaf">
                          <UserRound size={14} aria-hidden="true" />
                          {tier}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-cream px-3 py-1 text-xs font-bold text-ink/60">
                          <CalendarDays size={14} aria-hidden="true" />
                          Creato {formatDate(user.created_at)}
                        </span>
                      </div>
                      <h2 className="mt-3 break-words text-xl font-black text-ink">{user.email || "Email mancante"}</h2>
                      <p className="mt-1 break-all text-xs font-semibold text-ink/45">{user.id}</p>
                      <p className="mt-3 text-sm leading-6 text-ink/65">
                        Email: {user.email_confirmed_at ? "confermata" : "non confermata"} · Ultimo accesso:{" "}
                        {formatDate(user.last_sign_in_at)}
                      </p>
                    </div>
                    <UserTierSelect userId={user.id} initialTier={tier} />
                  </div>
                </Card>
              );
            })
          ) : (
            <Card>
              <p className="text-sm text-ink/60">Nessun utente trovato.</p>
            </Card>
          )}
        </section>
      </main>
    </>
  );
}
