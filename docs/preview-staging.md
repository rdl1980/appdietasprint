# Preview e staging

Obiettivo: testare branch e pull request senza toccare dati o variabili di produzione.

## Setup consigliato

1. Creare un secondo progetto Supabase per staging.
2. Applicare `supabase/schema.sql` o le migrazioni in `supabase/migrations`.
3. Configurare su Vercel le variabili dell'ambiente Preview con URL e chiavi staging.
4. Creare un account test dedicato e inserirlo nei GitHub Secrets per gli E2E autenticati.
5. Usare `NEXT_PUBLIC_SITE_URL` della preview Vercel per link email e callback.

## Variabili preview

- `AUTH_SECRET`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`
- `RESEND_API_KEY`, solo se si testano email reali
- `E2E_TEST_EMAIL`
- `E2E_TEST_PASSWORD`

## Regole operative

- Non riusare database o service role key di produzione.
- Non inviare email marketing da preview.
- Non usare utenti reali nei test automatici.
- Prima di promuovere una release, verificare build, test pubblici, test autenticati e flusso planner mobile.
