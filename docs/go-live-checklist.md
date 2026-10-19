# Go-live checklist (P0 residue, 19 ottobre 2026)

Stato: codice, database, utenti admin/premium e variabili Vercel sono allineati. Restano quattro attivita' che richiedono dashboard esterne o chiavi.

## 1. Supabase Auth

Fatto il 19 ottobre 2026 via dashboard: Site URL, le quattro redirect URL, signup abilitato, conferma email attiva, SMTP Resend (smtp.resend.com:465, mittente no-reply@dietsprintai.com, limite 30 email/ora) e template "Confirm sign up" e "Reset password" in italiano con link `token_hash` verso `/auth/confirm`, che funzionano anche se il link viene aperto su un altro dispositivo.

Dashboard: https://supabase.com/dashboard/project/vmruiihtdjimcjbyzscs/auth/url-configuration

- Site URL: `https://dietsprintai.com`
- Redirect URLs: `https://dietsprintai.com/auth/confirm`, `https://www.dietsprintai.com/auth/confirm`, `https://appdietasprint.vercel.app/auth/confirm`, `http://127.0.0.1:3000/auth/confirm`

Email templates (https://supabase.com/dashboard/project/vmruiihtdjimcjbyzscs/auth/templates):

- Confirm signup, corpo del link:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup">Conferma account</a>
```

- Reset password, corpo del link:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/account/password">Reimposta password</a>
```

SMTP (Project settings > Auth > SMTP): host `smtp.resend.com`, porta 465, user `resend`, password = API key Resend, mittente `Diet Sprint AI <no-reply@dietsprintai.com>`. Facoltativo all'inizio: senza SMTP custom Supabase invia con il proprio mittente, con limite di 2 email/ora.

Verifica: registrazione con una email nuova da https://dietsprintai.com/register, click sul link, login, poi "Password dimenticata" e cambio password.

## 2. Verifica end-to-end in produzione

Verificato il 19 ottobre (npm run test:e2e:production con account Premium, 9 test verdi): login, planner chetogenico, salvataggio con profilo, piano a 7 giorni, lista spesa e 3 consensi su DB, storico, profilo, area privacy. Due bug trovati e corretti lungo la strada: il link GET di logout veniva prefetchato da Next.js e cancellava la sessione (ora POST, prefetch ignorato) e www non reindirizzava all'apex (ora 308).

Nota 19 ottobre: `/api/health` riporta `supabaseRlsTokenOk: false`. PostgREST rifiuta i token HS256 firmati dall'app anche con `SUPABASE_JWT_KEY_ID`; probabile valore errato in `SUPABASE_JWT_SECRET` su Vercel. L'app usa automaticamente la service role con filtri per utente, quindi account e salvataggi funzionano; ricopiare il segreto dalla tab "Legacy JWT Secret" e fare redeploy finche' il flag diventa `true`.

Verificato il 19 ottobre: registrazione dal sito, email di conferma inviata via Resend, link `token_hash` gestito da `/auth/confirm`, login con password riuscito (utente di prova confermato in `auth.users`).

Anonima, da terminale:

```bash
npm run test:e2e:production
```

Autenticata (usa un account dedicato ai test, non quello personale):

```powershell
$env:E2E_TEST_EMAIL="<email account test>"
$env:E2E_TEST_PASSWORD="<password>"
npm run test:e2e:production
```

Copre login, generazione piano chetogenico, salvataggio, storico, profilo e area privacy.

Manuale, una volta: export JSON da `/account/privacy`, richiesta GDPR, `/admin/users`, `/admin/privacy`, `/admin/templates`, eliminazione di un account di prova.

## 3. Provider AI

Su Vercel (Production e Preview, Sensitive) e in `.env.local`:

```bash
ANTHROPIC_API_KEY=<chiave>
ANTHROPIC_MODEL=claude-opus-5-5
```

Oppure `OPENAI_API_KEY` + `OPENAI_MODEL`. Con `AI_PROVIDER=auto` vince Anthropic se presente. Dopo il redeploy, `/api/health` deve riportare `aiConfigured: true` e `aiProvider`. Poi: domanda al coach da `/results` con un account Premium, e `POST /api/plans/generate` deve restituire `source: "ai"`.

## 4. Stripe

Dashboard Stripe (test mode prima, live poi):

1. Prodotto "Diet Sprint AI Premium", prezzo una tantum 29 euro -> `STRIPE_PREMIUM_PRICE_ID`.
2. Developers > API keys -> `STRIPE_SECRET_KEY`.
3. Developers > Webhooks > Add endpoint `https://dietsprintai.com/api/stripe/webhook`, eventi `checkout.session.completed` e `checkout.session.async_payment_succeeded` -> `STRIPE_WEBHOOK_SECRET`.
4. Variabili su Vercel (Sensitive) e redeploy; `/api/health` deve riportare `stripeCheckoutConfigured: true` e `stripeWebhookConfigured: true`.
5. Acquisto di prova con carta test `4242 4242 4242 4242` da un account Free: dopo il webhook l'account diventa Premium e compare una riga in `stripe_purchases`.

## 5. Decisione screening salute

Comportamento attuale: `NEXT_PUBLIC_MEDICAL_SCREENING_MODE=warn` (bozza con avviso di review medica). Per tornare al blocco totale basta impostare `block` su Vercel e fare redeploy: planner, salvataggio e generazione AI rifiutano i profili con condizioni selezionate. La scelta va confermata con legale e nutrizionista e riportata nel pacchetto legale.
