# CI/CD e Playwright

La pipeline GitHub Actions esegue, a ogni push su `main` e pull request:

- `npm ci`
- `npm run lint`
- `npm test`
- `npm run build`
- `npm run test:e2e:public`
- `npm run test:e2e:authenticated`, se sono configurati i secret autenticati

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
- `PREMIUM_EMAILS`, di solito uguale a `E2E_TEST_EMAIL`

Se `E2E_TEST_EMAIL` o `E2E_TEST_PASSWORD` mancano, i test autenticati vengono saltati in modo esplicito. I test pubblici restano obbligatori.

Il test autenticato copre login, generazione piano con dieta chetogenica, consenso privacy, salvataggio piano, storico piani, profilo e pagina privacy. L'account test deve essere Premium per verificare le funzioni sbloccate.
