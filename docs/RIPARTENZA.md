# Diet Sprint AI: ripartire da zero

Documento per ricominciare il progetto con un perimetro piccolo, verificabile dal telefono a ogni passo, riusando quello che oggi funziona davvero (infrastruttura, schema dati, contenuti) e lasciando indietro il codice che ha generato i problemi.

Data: 24 ottobre 2026. Stato di partenza: repo `github.com/rdl1980/appdietasprint`, ultimo commit `b70f4ef`, produzione su https://dietsprintai.com.

---

## 1. Diagnosi onesta: perché "non funziona niente"

Il codice attuale è un MVP cresciuto senza mai essere usato davvero da un telefono: 47 rotte, circa 11.000 righe di codice applicativo, 7 tabelle, pannelli admin, workflow GDPR, Stripe, analytics, pagina backlog. Troppa superficie per un prodotto che non ha ancora un flusso base solido.

I problemi trovati negli ultimi giorni, in ordine di gravità:

| Problema | Causa reale | Stato |
| --- | --- | --- |
| Login "perdeva" la sessione, utente visto come non Premium | Due layer di autenticazione (Auth.js sopra Supabase Auth) con cookie limitati all'host: `www` e apice avevano sessioni diverse; inoltre il link "Esci" era una GET che Next prefetchava, cancellando la sessione appena la pagina si apriva | Corretto, ma la doppia autenticazione resta fragile |
| Stesso pasto per 7 giorni, "Rigenera" senza effetto | Solo 16 template, 5 per la chetogenica: una sola opzione per slot | Corretto (46 template, rotazione), ma il catalogo è ancora piccolo |
| Bottone "Rigenera" del giorno 1 non faceva nulla | Nessun handler collegato | Corretto |
| Header rotto su telefono da loggati | Email + bottoni non entravano in 375 px | Corretto |
| Salvataggio piano e dati profilo "non tenuti" | Non riprodotto: nel DB i piani risultano salvati. Il planner però leggeva solo la memoria del browser, quindi su un telefono nuovo partiva vuoto | Parzialmente corretto, mai confermato dal telefono |
| Token RLS applicativo rifiutato da Supabase | L'app firma i propri JWT con il vecchio segreto HS256, il progetto usa chiavi ECC | Aggirato con fallback alla service role |
| Chiave AI | La prima chiave è finita in chat ed è stata revocata; ora si usa la federazione OIDC Vercel → Anthropic | Configurata, mai esercitata con una chiamata reale |
| Database Supabase sparito | Progetto cancellato; ricreato il 19 ottobre | Risolto |

Conclusione: l'infrastruttura è a posto e va tenuta. Il codice va rifatto più piccolo, con un solo sistema di autenticazione, dati sul server e verifica sul telefono dopo ogni tappa.

---

## 2. Cosa tenere (già pagato, già funzionante)

### Infrastruttura e account

| Cosa | Valore | Note |
| --- | --- | --- |
| Dominio | `dietsprintai.com` (+ `www` che reindirizza) | DNS su Vercel |
| Vercel | progetto `appdietasprint`, id `prj_ucmeLJh9uzx8Y9MbCU6In2iURpJE`, team `rdl1980s-projects` | Deploy automatico da `main`, OIDC federation attiva |
| Supabase | progetto `DietSprintAI`, ref `vmruiihtdjimcjbyzscs`, `eu-central-1`, Free plan | URL `https://vmruiihtdjimcjbyzscs.supabase.co`. Auth configurata: Site URL, redirect, SMTP Resend, template email italiani |
| Resend | SMTP `smtp.resend.com:465`, mittente `no-reply@dietsprintai.com` | Dominio verificato |
| Anthropic | org `563d9b37-74f3-4748-871c-5ddca9f34bbf`, emittente `fdis_01WaYifgG6DWHZ22vYMymmX1`, service account `svac_01PJvA2ZVEuBcditZHc9LNRs`, regola `fdrl_01LYfrQHT1KQ8hmZRJxhH7E9` | Nessuna chiave API: le funzioni Vercel si autenticano con il token OIDC (`docs/anthropic-federation.md`) |
| Utenti Auth | rosario.dileva e abbonamenti.dileva (admin + premium), rdl1980 e ilariapastore77 (premium) | Metadati `app_metadata.plan = premium`, `role = admin` |

Variabili già presenti su Vercel (Production e Preview): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `AUTH_SECRET`, `ADMIN_EMAILS`, `PREMIUM_EMAILS`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `NEXT_PUBLIC_SITE_URL`, `ANTHROPIC_FEDERATION_RULE_ID`, `ANTHROPIC_SERVICE_ACCOUNT_ID`, `ANTHROPIC_ORGANIZATION_ID`, `ANTHROPIC_MODEL`.

### Contenuti e logica da copiare nel nuovo progetto

| File attuale | Cosa contiene | Perché tenerlo |
| --- | --- | --- |
| `src/lib/calories.ts`, `src/lib/macroTargets.ts` | BMR, TDEE, range calorico, macro per dieta | Logica nutrizionale testata |
| `src/lib/mealTemplates.ts` | 46 template pasto con ingredienti e macro | Contenuto, non codice |
| `src/lib/generateMealPlan.ts` | Generatore deterministico con rotazione e sostituzioni | Funziona, ha 30 test |
| `src/lib/medicalScreening.ts`, `src/lib/plannerPreferences.ts` | Screening salute, allergie, esclusioni | Decisioni già prese |
| `src/lib/ai/provider.ts`, `src/lib/aiCoach.ts`, `src/lib/ai/mealPlanGeneration.ts` | Chiamate Anthropic via federazione, guardrail, parsing piano AI | Da riusare quasi tale e quale |
| `src/app/legal/*` | Privacy, cookie, disclaimer, termini, GDPR in italiano | Testi legali |
| `supabase/schema.sql` | Schema completo con RLS | Da ridurre, vedi sotto |
| `docs/anthropic-federation.md`, `docs/go-live-checklist.md`, `docs/supabase-restore.md` | Runbook infrastruttura | Validi |
| `tests/e2e/production-smoke.spec.ts`, `tests/e2e/authenticated.spec.ts` | Smoke e flusso autenticato in produzione | Da adattare alle nuove rotte |

---

## 3. Cosa non rifare

- **Auth.js (NextAuth) sopra Supabase Auth.** Un solo sistema: Supabase Auth con `@supabase/ssr`, cookie gestiti dal middleware ufficiale. Elimina `AUTH_SECRET`, i JWT firmati dall'app, il probe RLS, il fallback alla service role.
- **Piano generato nel browser e tenuto in `localStorage`.** Il piano si genera sul server e si salva subito nel DB per gli utenti loggati; il browser non è la fonte dei dati.
- **Pannelli admin, workflow GDPR con audit, Stripe, analytics, pagina backlog, template admin su DB, rate limit in memoria.** Non nella v1. Il backlog resta un file markdown nel repo.
- **Premium via lista email + metadati + Stripe.** Nella v1 Premium è solo `app_metadata.plan = "premium"` impostato a mano da SQL. I pagamenti arrivano quando il prodotto è usato.
- **Due generatori paralleli (deterministico e AI) con fallback silenzioso.** La v1 usa il generatore deterministico; l'AI entra prima nel coach (testo), poi nella generazione quando il flusso base è stabile.

---

## 4. Perimetro della v1 (massimo 8 pagine)

Un utente apre il sito dal telefono, si registra, compila il profilo, ottiene una settimana di pasti vari, può sostituire un pasto, salva, ritrova il piano. Fine.

| Pagina | Funzione |
| --- | --- |
| `/` | Presentazione e CTA |
| `/login`, `/register`, `/forgot-password` | Supabase Auth, email di conferma via Resend |
| `/planner` | Form profilo: dati, obiettivo, dieta, pasti al giorno, esclusioni, allergie, screening salute. Precompilato dal profilo salvato |
| `/plan` | Piano della settimana (Free: 1 giorno), sostituzione pasto, lista spesa, salvataggio, coach AI (Premium) |
| `/plans` | Storico piani salvati, apri e rigenera |
| `/account` | Email, piano Free/Premium, cambio password, elimina account |
| `/legal/*` | Testi legali esistenti |

Navigazione mobile sempre visibile (menu a tendina), nessuna azione che scompare sotto i 640 px.

### Dati (3 tabelle)

```sql
profiles        (user_id pk → auth.users, dati profilo, updated_at)
meal_plans      (id, user_id, profile_snapshot jsonb, plan jsonb, created_at)
consents        (user_id, document, version, accepted_at)
```

RLS: ogni riga visibile e modificabile solo da `auth.uid() = user_id`. Nessun service role lato app.

---

## 5. Architettura

- **Next.js 16 App Router, React 19, TypeScript, Tailwind.** Server Components per le pagine, Server Actions per salvare profilo e piano, Route Handlers solo per `/api/health` e per le chiamate AI.
- **Supabase Auth + Postgres** via `@supabase/ssr`: client server-side per pagina, middleware che rinfresca la sessione. Nessun JWT custom.
- **Generazione piano sul server**: `generateMealPlan(profile)` dentro una Server Action, risultato salvato nel DB e mostrato per id (`/plan?id=...`). Le sostituzioni aggiornano la riga.
- **AI**: `@anthropic-ai/sdk` con federazione OIDC Vercel (codice esistente). Modello `claude-opus-5-5`. In locale `ANTHROPIC_API_KEY` in `.env.local`, mai in chat né nel repo.
- **Email**: Supabase Auth via SMTP Resend (già configurato). Nessuna email applicativa nella v1.
- **Test**: Vitest per logica (calorie, generatore, template), Playwright per smoke pubblico e flusso autenticato in produzione. Si rilascia solo con la suite verde.
- **Osservabilità minima**: `/api/health` con build, Supabase, AI; log strutturati `console.error` con chiave evento.

---

## 6. Piano a tappe (ogni tappa finisce con una prova dal telefono)

| Tappa | Contenuto | Fatto quando |
| --- | --- | --- |
| 0. Scheletro | Nuovo repo, Next 16, Tailwind, layout mobile-first, header con menu, `/api/health`, deploy su Vercel sul dominio | La home si apre dal telefono senza scroll orizzontale, health risponde |
| 1. Auth | Supabase Auth SSR: registrazione, conferma email, login, logout, recupero password, `/account` | Dal telefono: registrazione con email vera, login, chiusura e riapertura del browser con sessione mantenuta, logout |
| 2. Profilo | Tabella `profiles`, form `/planner`, Server Action di salvataggio, precompilazione | Compilo dal telefono, ricarico da un altro dispositivo, i dati ci sono |
| 3. Piano | Generatore (copiato), tabella `meal_plans`, pagina `/plan`, `/plans`, sostituzione pasto, lista spesa | 7 giorni senza ripetizioni consecutive, sostituzione cambia il pasto, piano ritrovato in `/plans` |
| 4. Premium | `app_metadata.plan` via SQL, limiti Free (1 giorno, nessun salvataggio) | Account premium vede 7 giorni, account free vede 1 |
| 5. Coach AI | `/api/coach` con federazione, guardrail esistenti | Risposta reale dal modello dal telefono, evento visibile in Console Anthropic |
| 6. Generazione AI | Piano generato dal modello con validazione e fallback dichiarato in UI | Badge "AI" visibile, fallback segnalato |

Tempo stimato con Claude Code: tappe 0-3 in una giornata di lavoro con verifiche; 4-6 in un'altra.

---

## 7. Setup del nuovo progetto

```bash
# 1. cartella nuova, repo nuovo (il vecchio resta come archivio)
npx create-next-app@latest dietsprint --typescript --tailwind --app --src-dir --eslint
cd dietsprint
npm i @supabase/ssr @supabase/supabase-js @anthropic-ai/sdk @vercel/oidc lucide-react
npm i -D vitest @testing-library/react @testing-library/jest-dom jsdom @playwright/test
```

`.env.local` (valori dal dashboard Supabase > Project Settings > API; la chiave Anthropic la inserisci tu):

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://vmruiihtdjimcjbyzscs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
ANTHROPIC_API_KEY=...
ANTHROPIC_MODEL=claude-opus-5-5
```

Supabase: applicare il nuovo schema (3 tabelle + RLS) con il SQL editor dopo aver esportato i dati attuali con `npm run db:backup` nel vecchio repo (i piani salvati finora sono di prova, si possono perdere).

Vercel: collegare il nuovo repo allo stesso progetto `appdietasprint` (Settings > Git) oppure creare un progetto nuovo e spostare il dominio. Rimuovere `AUTH_SECRET`, `SUPABASE_JWT_SECRET`, `SUPABASE_JWT_KEY_ID`, `STRIPE_*`, `ADMIN_USERNAMES`, `PREMIUM_EMAILS`.

Supabase Auth: Site URL e redirect URL restano quelli attuali (`https://dietsprintai.com`, `/auth/confirm`, `/auth/callback`); se cambiano le rotte, aggiornarli.

---

## 8. Regole di lavoro (imparate a caro prezzo)

1. **Ogni tappa si prova dal telefono prima di passare alla successiva.** Non da desktop, non da test automatici soltanto.
2. **Un cambiamento per deploy.** Se qualcosa si rompe, si sa cosa.
3. **Niente segreti in chat, in file del repo o nel terminale.** Chiavi solo nelle variabili Vercel e in `.env.local`. Se una chiave finisce in chat, si revoca subito.
4. **Una sola fonte dei dati: il database.** Il browser conserva al massimo una bozza.
5. **Mobile-first**: ogni componente nuovo si guarda prima a 375 px.
6. **Un solo sistema di autenticazione.**
7. **Nessuna funzione "placeholder" visibile** (bottoni senza handler, "PDF placeholder", pagine demo). Se non funziona, non si mostra.
8. **Copy in italiano, senza apostrofi tipografici strani**, coerente con lo stile esistente.
9. **Test minimi ma veri**: logica nutrizionale e generatore con Vitest; smoke pubblico e flusso autenticato in produzione con Playwright, lanciati dal terminale con le credenziali di un account di prova.

---

## 9. Prompt da incollare in una nuova sessione Claude Code

```
Sto ricostruendo da zero Diet Sprint AI, un planner alimentare mobile-first in italiano.
Leggi docs/RIPARTENZA.md nel repo vecchio (D:\Sviluppo\Progetti Claude\App DIeta Sprint) e
usalo come specifica: infrastruttura da riusare (Supabase vmruiihtdjimcjbyzscs, Vercel
appdietasprint, Resend, federazione Anthropic), perimetro v1 (sezione 4), architettura
(sezione 5), tappe (sezione 6), regole (sezione 8).

Crea il nuovo progetto nella cartella D:\Sviluppo\Progetti Claude\DietSprint con Next.js 16,
Supabase Auth SSR come unico sistema di autenticazione, Server Actions per profilo e piani,
generatore deterministico copiato da src/lib del vecchio repo (calories, macroTargets,
mealTemplates, generateMealPlan, medicalScreening, plannerPreferences) con i relativi test.

Procedi una tappa alla volta partendo dalla tappa 0. Alla fine di ogni tappa fermati e
dimmi cosa devo verificare dal telefono. Non passare alla tappa successiva senza il mio ok.
Le chiavi (Supabase anon key, Anthropic API key per il locale) le inserisco io in .env.local:
dimmi solo quali servono e dove si prendono.
```

---

## 10. Riferimenti rapidi

- Produzione: https://dietsprintai.com, health: https://dietsprintai.com/api/health
- Supabase dashboard: https://supabase.com/dashboard/project/vmruiihtdjimcjbyzscs
- Vercel: https://vercel.com/rdl1980s-projects/appdietasprint
- Console Anthropic (federazione): https://platform.claude.com/settings/workload-identity-federation
- Repo attuale (archivio): https://github.com/rdl1980/appdietasprint
- Runbook esistenti: `docs/anthropic-federation.md`, `docs/go-live-checklist.md`, `docs/supabase-restore.md`
