# CI/CD e Playwright

La pipeline GitHub Actions esegue, a ogni push su `main` e pull request:

- `npm ci`
- `npm run lint`
- `npm test`
- `npm run build`
- `npm run test:e2e`

La suite Playwright avvia Next.js in locale e copre desktop Chrome e mobile Chrome.

## Secret consigliati

Configura questi secret nel repository GitHub quando vuoi una pipeline vicina alla produzione:

- `AUTH_SECRET`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`
- `RESEND_API_KEY`

Per attivare anche i test E2E autenticati aggiungi:

- `E2E_TEST_EMAIL`
- `E2E_TEST_PASSWORD`

Se `E2E_TEST_EMAIL` o `E2E_TEST_PASSWORD` mancano, i test autenticati vengono saltati in modo esplicito. I test pubblici restano obbligatori.
