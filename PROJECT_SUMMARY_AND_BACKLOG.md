# DietaSprint AI - riepilogo progetto e backlog

Aggiornato al 5 giugno 2026.

## Visione

DietaSprint AI e' una web app per creare piani alimentari realistici, pratici e sostenibili. La prima versione e' web, con architettura pensata per arrivare in seguito a iOS e Android usando gli stessi servizi backend.

Il posizionamento attuale e' volutamente prudente: planner alimentare orientativo, non dispositivo medico, non diagnosi e non sostituzione di medico, dietista o nutrizionista.

## Stack e servizi

- Frontend e backend: Next.js App Router.
- Autenticazione: Auth.js / NextAuth v5 con provider credentials collegato a Supabase Auth.
- Database: Supabase Postgres con Row Level Security.
- Email: Resend per invii applicativi e SMTP Supabase Auth.
- Deploy: Vercel con dominio `dietsprintai.com`.
- CI/CD: GitHub Actions con lint, unit test, build e Playwright E2E.
- Test: Vitest per logica applicativa, Playwright per flussi browser desktop e mobile.
- Admin: pannelli protetti per backlog e privacy.

## Caratteristiche gia implementate

### Esperienza pubblica

- Homepage prodotto con accesso al planner.
- Pricing mock Free, Premium e Pro.
- Pagine legali: privacy, termini, cookie, GDPR e disclaimer salute.
- Cookie banner granulare con consenso necessari / analytics / marketing.

### Planner alimentare

- Profilo utente: sesso, eta, altezza, peso, attivita, obiettivo.
- Scelta stile alimentare: chetogenica, mediterranea, low carb, bilanciata, vegetariana.
- Numero pasti, budget mode, semplicita e tempo disponibile per cucinare.
- Cibi esclusi, allergie e intolleranze strutturate.
- Salvataggio bozza locale.
- Screening salute prudenziale che blocca generazione automatica in casi sensibili.

### Motore nutrizionale MVP

- Calcolo BMR e TDEE con formula Mifflin-St Jeor.
- Range calorico e warning per target troppo restrittivi.
- Piano giornaliero e settimanale deterministico.
- Macro coerenti per tipo di dieta.
- Template pasti con ingredienti, quantita, calorie e macro indicative.
- Rigenerazione singolo pasto.
- Sostituzioni compatibili per dieta, calorie e preferenze.
- Lista spesa aggregata, categorizzata e spuntabile.
- Strategie anti-fame non medicali.

### Account e dati

- Registrazione email/password.
- Conferma email tramite Supabase Auth.
- Login, logout, recupero password e cambio password.
- Profilo alimentare modificabile.
- Salvataggio piani autenticato su Supabase.
- Storico piani salvati.
- Dettaglio piano salvato.
- Export dati utente in JSON.
- Storico consensi versionati.
- Workflow richieste GDPR lato utente.

### Admin e operativita

- Accesso admin protetto.
- Backlog interno visibile su `/admin/backlog`.
- Coda richieste privacy su `/admin/privacy`.
- Script creazione admin.
- Script backup e restore Supabase.
- Runbook backup/restore.

### Qualita e sicurezza

- Health endpoint `/api/health`.
- Debug auth disabilitabile in produzione.
- RLS Supabase sui dati utente.
- Rate limit su endpoint sensibili.
- Error monitoring MVP con sanitizzazione di email, token e dati sensibili.
- Guardrail AI salute prima/dopo generazione.
- Unit test su calorie, macro, piani, GDPR, error monitoring e guardrail salute.
- Playwright E2E su flussi pubblici, cookie banner, screening medico, endpoint health e flussi autenticati opzionali con secret.
- CI/CD GitHub Actions attiva.

## Stato P0

| Area | Elemento | Stato | Note |
| --- | --- | --- | --- |
| Fondamenta | Dominio e deploy automatico | Fatto | Vercel collegato a `main`. |
| Fondamenta | Supabase con RLS | Fatto | Schema MVP e policy attive. |
| Fondamenta | Resend e SMTP Auth | Fatto | Dominio email configurato. |
| Fondamenta | Backup/restore database | Fatto | Script e runbook presenti. |
| Account | Registrazione, login, logout | Fatto | Auth.js + Supabase Auth. |
| Account | Recupero/cambio password | Fatto | Flusso email configurabile. |
| Privacy | Pagine legali MVP | Fatto | Privacy, termini, cookie, GDPR, disclaimer. |
| Privacy | Revisione legale professionale | Prossimo | Pacchetto pronto, manca validazione esterna. |
| Planner | Planner guidato MVP | Fatto | Core flow operativo. |
| Planner | Screening salute | Fatto | Blocchi prudenziali presenti. |
| Nutrizione | BMR/TDEE e calorie | Fatto | Formula e warning testati. |
| Nutrizione | Guardrail calorie basse | Fatto | Avvisi e blocchi presenti. |
| Nutrizione | Revisione nutrizionista | Prossimo | Pacchetto pronto, manca validazione esterna. |
| Piani | Piano giornaliero/settimanale | Fatto | Generazione deterministica MVP. |
| Piani | Salvataggio autenticato | Fatto | Supabase + consensi. |
| Spesa | Lista spesa aggregata | Fatto | Categorie e checklist. |
| AI coach | Guardrail salute AI | Fatto | Regole deterministiche implementate. |
| Admin | Backlog admin protetto | Fatto | `/admin/backlog`. |
| Qualita | E2E flusso principale | Fatto | Playwright in CI/CD. |
| Qualita | Test motore calorie | Fatto | Vitest. |
| Qualita | Monitoraggio errori | Fatto | MVP server/client. |
| Qualita | Hardening sicurezza MVP | Fatto | Rate limit, header, segreti non client. |

## Backlog P1

### Fondamenta

- Ambiente preview separato con variabili e database staging.

### Account

- Onboarding guidato progressivo.
- Notifiche sicurezza account.
- Eliminazione account self-service.

### Privacy

Completato per P1:
- Versionamento consensi.
- Cookie banner reale.
- Export dati utente.
- Workflow richieste GDPR.

### Planner e nutrizione

Completato per P1:
- Salvataggio bozza planner.
- Allergie e intolleranze strutturate.
- Tempo disponibile per cucinare.
- Macro coerenti per dieta.
- Storico piani salvati.
- Dettaglio piano salvato.
- Rigenera singolo pasto.
- Sostituzioni compatibili.
- Categorie supermercato.
- Checklist spesa interattiva.

### AI coach

- Layer AI server-side con prompt protetti.
- Valutazione qualita output AI con dataset e controlli regressione.

### Premium

- Piani Free, Premium e Pro con feature gate.
- Checkout Stripe.
- Webhook Stripe e stato abbonamento.
- Portale cliente per carta, fatture, upgrade, downgrade e cancellazione.

### Admin

- Gestione utenti.
- Dashboard richieste privacy con audit trail completo.
- Gestione template pasti, ingredienti, ricette, tag dieta e sostituzioni.

### Qualita

- Accessibilita base: tastiera, focus, contrasto, label, screen reader.
- Performance mobile: Lighthouse, bundle, immagini, tempi risposta.
- Security review: header, rate limit, CAPTCHA, segreti, dipendenze.

### Growth

- Analytics privacy-first con consenso.
- Funnel onboarding.

## Backlog P2

- Dispensa disponibile per ridurre costi e sprechi.
- Indicatori fibre e idratazione non medicali.
- Pasti preferiti.
- Feedback rapido sui pasti.
- Export PDF reale del piano e della lista spesa.
- Budget stimato della spesa.
- Meal prep settimanale.
- Coach anti-fame reale e contestuale.
- Trial e coupon.
- Fatturazione e ricevute.
- Metriche prodotto admin.
- Supporto utenti admin.
- SEO tecnico: metadata, sitemap, robots, Open Graph.
- Newsletter e onboarding email.
- PWA installabile.

## Backlog P3

- Profili famiglia.
- Chat coach contestuale sul piano attivo.
- Personalizzazione progressiva da feedback e preferiti.
- Referral.
- Contenuti educativi.
- App Expo React Native per iOS e Android.
- Notifiche push.
- Consultazione offline di piano e lista spesa.

## Prossime decisioni consigliate

1. Chiudere revisione legale professionale prima della beta pubblica.
2. Chiudere revisione nutrizionista su formule, soglie, template e claim.
3. Decidere se la beta include o esclude la dieta chetogenica.
4. Configurare secret GitHub per attivare anche gli E2E autenticati in CI.
5. Portare Stripe da mock a flusso reale.
6. Scegliere analytics privacy-first e abilitarli solo dopo consenso.
7. Fare un pass dedicato su accessibilita e performance mobile.

## Definition of Done per beta pubblica

- Validazione legale completata.
- Validazione nutrizionista completata.
- CI/CD verde su ogni push.
- E2E autenticati attivi con account test in GitHub Secrets.
- Nessuna chiave sensibile esposta al browser.
- Error monitoring attivo e verificato.
- Backup database provato.
- Flusso mobile planner -> risultato -> salvataggio fluido.
- Copy senza claim medici o promesse non dimostrabili.
