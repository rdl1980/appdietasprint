# Diet Sprint AI - riepilogo progetto e backlog

Aggiornato al 18 ottobre 2026.

## Visione

Diet Sprint AI e' una web app per creare piani alimentari realistici, pratici e sostenibili. La prima versione e' web, con architettura pensata per arrivare in seguito a iOS e Android usando gli stessi servizi backend.

Il posizionamento resta prudente: planner alimentare orientativo, non dispositivo medico, non diagnosi e non sostituzione di medico, dietista o nutrizionista.

## Stack e servizi

- Frontend e backend: Next.js 16 App Router, React 19, Tailwind.
- Autenticazione: Auth.js / NextAuth v5 con provider credentials collegato a Supabase Auth.
- Database: Supabase Postgres con Row Level Security (schema in `supabase/schema.sql`, migrazioni in `supabase/migrations`).
- AI: layer multi-provider (`src/lib/ai/provider.ts`) con Anthropic o OpenAI, guardrail salute e fallback deterministico.
- Pagamenti: Stripe Checkout una tantum + webhook.
- Email: Resend per invii applicativi e SMTP Supabase Auth.
- Deploy: Vercel (`appdietasprint`) con dominio `dietsprintai.com`.
- CI/CD: GitHub Actions con typecheck, Vitest, build e Playwright.
- Test: Vitest (unit, API route, componenti jsdom) e Playwright (desktop + mobile).

## Sorgente backlog

Questo documento e' il riepilogo markdown unico del progetto. La vista applicativa usa `src/lib/productBacklog.ts`; non mantenere altri file markdown di backlog paralleli.

## Stato rilevato il 18 ottobre 2026

### Cosa e' stato fatto in questa passata

- Repository clonato e analizzato; branch `codex/priority-features` (3 commit non ancora in `main`: admin utenti, admin template, audit trail GDPR, redirect login da API, screening salute con warning) integrato in `main` locale.
- Fix: gate Premium anche su `POST /api/plans` (prima un utente Free poteva salvare via API), validazione server-side dei range profilo con risposta 400 (prima errore 500 dal database), header con stato login reale (account + esci), copy home non piu' "mock", health endpoint con flag di configurazione e build id reale.
- Profilo: nuove colonne `medical_flags`, `allergy_flags`, `cooking_time` su `user_profiles` (migrazione `20261018120000_profile_preferences.sql`), mapper e form profilo aggiornati.
- AI: layer provider-agnostico pronto per la chiave reale (Anthropic o OpenAI), coach riscritto sopra il layer, nuova generazione piano AI con validazione rigorosa e fallback (`/api/plans/generate`).
- Test: da 37 a oltre 320 test Vitest (unit, API route con Supabase finto, componenti jsdom) e suite Playwright pubblica estesa (auth pages, legal, 404, contratto API, redirect admin).
- Documentazione: runbook `docs/supabase-restore.md`, README aggiornato, `.env.example` con variabili AI.

### Cosa manca o e' rotto

| Area | Problema | Impatto |
| --- | --- | --- |
| Supabase | Progetto ricreato il 19 ottobre (`vmruiihtdjimcjbyzscs`) con schema applicato; mancano Auth/SMTP, admin e variabili ambiente. | Login e salvataggio tornano a funzionare solo dopo i passi 3-6 di `docs/supabase-restore.md`. |
| Vercel | Le variabili Production puntano al vecchio progetto; mancano Stripe, AI, `PREMIUM_EMAILS`, `ADMIN_EMAILS`, `SUPABASE_JWT_SECRET` aggiornato. | Deploy verde ma funzioni autenticate fuori uso. |
| AI | Nessuna chiave provider configurata. | Coach e generazione piani usano solo il fallback deterministico. |
| Stripe | Nessuna chiave in Vercel. | Checkout risponde 503; Premium attivabile solo via `PREMIUM_EMAILS` o admin. |
| Nutrizione | 16 template statici; i template admin su DB non alimentano il generatore. | Piani ripetitivi, poca varieta' per keto e vegetariana. |
| Nutrizione | Le condizioni mediche generano una bozza con warning invece di bloccare (decisione presa sul branch codex). | Da confermare con legale e nutrizionista. |
| Qualita | Rate limit in memoria per istanza serverless. | Protezione debole in produzione multi-istanza. |
| Prodotto | Tab `/backlog` pubblica, bottone "PDF placeholder", pagina `/auth/callback` legacy. | Da rimuovere o completare prima del lancio. |

## Backlog prioritizzato

### P0 - Sbloccare la produzione (prossimi giorni)

1. **Completare il ripristino Supabase**: progetto e schema fatti; restano Auth (SMTP Resend, template email, redirect URL), service role e JWT secret negli ambienti, admin (`docs/supabase-restore.md`).
2. **Riallineare le variabili Vercel** (Production e Preview): Supabase nuove, `AUTH_SECRET`, `SUPABASE_JWT_SECRET`, `PREMIUM_EMAILS`, `ADMIN_EMAILS`, `PRIVACY_NOTIFICATION_EMAIL`; rimuovere le variabili dell'integrazione precedente.
3. **Attivare il provider AI reale**: `ANTHROPIC_API_KEY` (o `OPENAI_API_KEY`), verifica coach e `/api/plans/generate` con la chiave, taratura prompt ed eval.
4. **Decidere lo screening salute**: confermare bozza + warning di review oppure ripristinare il blocco. Allineare copy, test e pacchetto legale.
5. **Verifica end-to-end in produzione**: registrazione, conferma email, login, salvataggio piano, export dati, cancellazione account, admin. Attivare i GitHub Secrets per gli E2E autenticati.
6. **Stripe in produzione**: chiavi, price id, webhook `checkout.session.completed` e test di un acquisto reale in test mode.

### P1 - Prossimo sprint prodotto

1. Generazione piano AI in UI: risultati Premium collegati a `/api/plans/generate`, loading, badge fonte (AI o template), rigenerazione singolo pasto via AI.
2. Catalogo pasti piu' ampio (60+ ricette) e uso dei template admin DB nel generatore.
3. Rate limit distribuito (Upstash/Redis o tabella Supabase).
4. Rimuovere la tab `/backlog` pubblica e la pagina `/auth/callback` legacy; completare o togliere il bottone "PDF placeholder".
5. Pagina dettaglio piano: rigenerazione e salvataggio modifiche sul piano salvato.
6. Dashboard richieste privacy: scadenze 30 giorni e note admin visibili all'utente.
7. Monitoraggio errori reale (Sentry o simile) al posto del solo `console.error`.

### P2 - Dopo beta

1. Export PDF reale del piano e della lista spesa.
2. SEO tecnico: metadata per pagina, sitemap, robots, Open Graph.
3. PWA installabile.
4. Budget stimato della spesa e meal prep settimanale.
5. Pasti preferiti e feedback rapido sui pasti (input per personalizzazione AI).
6. Dispensa disponibile.
7. Indicatori fibre e idratazione non medicali.
8. Newsletter e onboarding email.
9. Trial, coupon, fatturazione e ricevute.
10. Metriche prodotto e supporto utenti admin.

### P3 - Espansioni

1. Profili famiglia.
2. Chat coach contestuale sul piano attivo con memoria conversazione.
3. Personalizzazione progressiva da feedback e preferiti.
4. Referral e contenuti educativi.
5. App Expo React Native per iOS e Android, notifiche push, consultazione offline.

## Caratteristiche gia' implementate

### Esperienza pubblica

- Homepage, pricing Free/Premium, pagine legali (privacy, termini, cookie, GDPR, disclaimer), cookie banner granulare, onboarding guidato.

### Planner e motore nutrizionale

- Profilo, stile alimentare (5 diete), pasti al giorno, budget, semplicita', tempo cucina, cibi esclusi, allergie strutturate, screening salute.
- BMR/TDEE Mifflin-St Jeor, range calorico, warning di sicurezza, macro per dieta.
- Piano giornaliero (Free) e settimanale (Premium) deterministico, rigenerazione singolo pasto, sostituzioni, lista spesa aggregata e categorizzata.
- Bozza planner locale e migrazione chiavi legacy.

### AI

- Provider Anthropic/OpenAI selezionabile, prompt protetti, guardrail prima/dopo, fallback deterministico, dataset di regressione coach.
- Generazione piano AI validata contro schema, esclusioni, calorie e claim medici.

### Account, privacy, pagamenti

- Registrazione, conferma email, login, logout, recupero e cambio password, notifiche sicurezza.
- Profilo alimentare modificabile (incluse allergie e tempo cucina), storico e dettaglio piani, duplica/elimina piano.
- Export dati JSON, consensi versionati, richieste GDPR, eliminazione account self-service.
- Checkout Stripe una tantum e webhook che sblocca Premium.

### Admin e operativita'

- Backlog, gestione utenti (Free/Premium), coda GDPR con audit trail, template pasti su DB.
- Script creazione admin, backup/restore, runbook Supabase, preview/staging, security checklist.

### Qualita'

- Typecheck, Vitest (unit, API, componenti), Playwright desktop e mobile, CI GitHub Actions, header di sicurezza, rate limit, error monitoring MVP con sanitizzazione.

## Definition of Done per beta pubblica

- Supabase ripristinato e variabili Vercel allineate.
- Validazione legale e nutrizionista completate, inclusa la decisione sullo screening salute.
- CI/CD verde su ogni push, E2E autenticati attivi con account test in GitHub Secrets.
- Provider AI attivo con eval superate.
- Stripe testato in test mode e webhook verificato.
- Nessuna chiave sensibile esposta al browser.
- Backup database provato con restore su staging.
- Flusso mobile planner -> risultato -> salvataggio fluido.
- Copy senza claim medici o promesse non dimostrabili.
