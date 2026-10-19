# Ripristino Supabase (ottobre 2026)

## Stato: progetto ricreato il 19 ottobre 2026

- Progetto `DietSprintAI`, ref `vmruiihtdjimcjbyzscs`, regione `eu-central-1`, URL `https://vmruiihtdjimcjbyzscs.supabase.co`.
- Schema applicato come migrazioni `diet_sprint_foundation_schema` e `rls_performance_and_fk_indexes` (equivalenti a `supabase/schema.sql`): 7 tabelle, RLS attiva, 14 policy, advisor sicurezza pulito.
- Per liberare lo slot del piano Free e' stato messo in pausa `RDLSelfPublishing`.
- `.env.local` contiene gia' URL e anon key; restano da inserire a mano `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET` e `AUTH_SECRET`.
- Fatti anche: Site URL e redirect URL (19 ottobre), variabili Vercel, utenti admin/premium. SMTP Resend e template email configurati il 19 ottobre. Resta la verifica di registrazione reale.

## Contesto

Stato rilevato il 18 ottobre 2026: il progetto Supabase usato da Diet Sprint AI non esiste piu' nell'organizzazione `rdl1980's Org` (restano solo EconomiaDomestica, RDLproductivity, RDLSelfPublishing, AstaLive). Le variabili di produzione su Vercel (`appdietasprint`) puntano ancora al progetto scomparso, quindi login, registrazione e salvataggio piani in produzione falliscono.

Il codice resta funzionante senza database: planner, risultati Free e pagine pubbliche non dipendono da Supabase.

## 1. Creare il progetto

1. Dashboard Supabase > New project nell'organizzazione `rdl1980's Org`.
2. Nome consigliato `DietSprintAI`, regione `eu-central-1` (Francoforte), piano Free. Il piano Free consente al massimo due progetti attivi: se necessario mettere in pausa `AstaLive` o `EconomiaDomestica` (gia' inattivi) prima di crearne uno nuovo.
3. Salvare la password database fuori dal repository.

In alternativa, con il connettore Supabase di Claude Code e' sufficiente autorizzare `create_project` e poi `apply_migration`.

## 2. Applicare lo schema

Opzione rapida: SQL editor > incollare l'intero contenuto di `supabase/schema.sql` ed eseguirlo. Il file e' idempotente (`create table if not exists`, `drop policy if exists`) e include:

- `user_profiles` (con `medical_flags`, `allergy_flags`, `cooking_time`)
- `meal_plans`, `privacy_consents`, `data_subject_requests`, `stripe_purchases`
- `data_subject_request_audit_events`, `admin_meal_templates`
- RLS e policy per tutte le tabelle, indici

Opzione CLI, con migrazioni versionate:

```bash
npx supabase link --project-ref <PROJECT_REF>
npx supabase db push
```

Le migrazioni in `supabase/migrations` sono quattro e vanno applicate in ordine cronologico (il CLI lo fa da solo).

## 3. Configurare Auth

Authentication > Providers > Email:

- Email provider attivo, Confirm email attivo, Secure email change attivo.
- Magic link non esposto nel prodotto (il login e' email + password).

Authentication > Email templates (vedi README per i template completi):

- Confirm signup -> `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup`
- Reset password -> `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/account/password`

Authentication > URL configuration:

- Site URL `https://dietsprintai.com`
- Redirect URL: `https://dietsprintai.com/auth/confirm`, `https://www.dietsprintai.com/auth/confirm`, `https://appdietasprint.vercel.app/auth/confirm`, `http://127.0.0.1:3000/auth/confirm`

Project settings > Auth > SMTP: host `smtp.resend.com`, porta 465, user `resend`, password = API key Resend, mittente `Diet Sprint AI <no-reply@dietsprintai.com>`.

## 4. Variabili ambiente

Da Project settings > API copiare e impostare, su Vercel (Production e Preview) e in `.env.local`:

| Variabile | Dove |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key (legacy) |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key, solo server |
| `SUPABASE_JWT_SECRET` | Settings > JWT Keys > tab "Legacy JWT Secret", solo server: firma i token RLS lato app |
| `SUPABASE_JWT_KEY_ID` | Settings > JWT Keys: key id della riga HS256 (Shared Secret). Serve perche' il progetto firma con chiavi JWKS |
| `POSTGRES_URL_NON_POOLING` | Connection string diretta, usata solo da `npm run db:backup` |

Su Vercel vanno rimosse le vecchie variabili create dall'integrazione precedente (`SUPABASE_*`, `POSTGRES_*`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) e aggiunte quelle mancanti: `AUTH_SECRET` (gia' presente), `STRIPE_*`, `ANTHROPIC_API_KEY` o `OPENAI_API_KEY`, `PREMIUM_EMAILS`, `ADMIN_EMAILS`, `PRIVACY_NOTIFICATION_EMAIL`.

## 5. Ricreare l'admin

```bash
set NEXT_PUBLIC_SUPABASE_URL=https://<PROJECT_REF>.supabase.co
set SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
set ADMIN_EMAIL=<email-admin>
set ADMIN_USERNAME=rdladmin
npm run admin:create
```

Lo script chiede la password in modo interattivo e imposta `role=admin` negli app metadata.

## 6. Verifica

1. `GET /api/health` deve riportare `supabaseConfigured: true` e `supabaseRlsTokenOk: true`. Se e' `false`, i token RLS firmati dall'app vengono rifiutati da PostgREST (segreto o key id sbagliati): l'app continua a funzionare con la service role e filtri espliciti per utente, ma conviene correggere il segreto.
2. Registrazione con email reale -> conferma -> login -> `/account`.
3. Dal planner salvare un piano con un utente in `PREMIUM_EMAILS` -> `/account/plans`.
4. `/admin/backlog` e `/admin/users` con l'utente admin.
5. `npm run db:backup` con `POSTGRES_URL_NON_POOLING` impostata, per provare il runbook di backup.
6. Impostare i GitHub Secrets (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `AUTH_SECRET`, `E2E_TEST_EMAIL`, `E2E_TEST_PASSWORD`) per attivare gli E2E autenticati in CI.
