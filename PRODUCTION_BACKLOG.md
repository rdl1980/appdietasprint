# DietaSprint AI - Backlog produzione

## Obiettivo

Portare DietaSprint AI da MVP demo a prodotto pubblico affidabile, sicuro e monetizzabile.

## Ultimo aggiornamento

P0 technical readiness completata:
- health endpoint `/api/health`;
- `.env.example` per Vercel/Supabase;
- scaffold Supabase client/server;
- schema `supabase/schema.sql` con RLS;
- pagina `/account` per stato account/database;
- board `/backlog` con stati P0.

## Vista rapida

```mermaid
flowchart LR
  A["MVP attuale"] --> B["Fondamenta produzione"]
  B --> C["Account + database"]
  C --> D["AI reale + piani salvati"]
  D --> E["Pagamenti + abbonamenti"]
  E --> F["Beta pubblica"]
  F --> G["Lancio"]
```

## Kanban

| Priorita | Backlog | Prossimo sprint | In produzione |
| --- | --- | --- | --- |
| P0 | Privacy/GDPR definitivo | Deploy Vercel | MVP locale |
| P0 | Dominio custom | Creare progetto Supabase | Landing + planner |
| P1 | AI server-side | Attivare Supabase Auth | Piano 7 giorni mock |
| P1 | AI server-side | Analytics privacy-first | Pagine legali MVP |
| P1 | Stripe subscriptions | Email contatto/supporto | Audit npm pulito |
| P1 | Export PDF reale | QA mobile | Build Next valida |
| P2 | Coach anti-fame reale | Copy conversione | Repo GitHub |
| P2 | Area famiglia | SEO base | Health check e schema Supabase |

## P0 indirizzati ora

| P0 | Stato | Cosa e' stato fatto | Cosa manca |
| --- | --- | --- | --- |
| Deploy Vercel | Pronto | Build valida, package-lock, health endpoint `/api/health`, `.env.example`. | Collegare Vercel al repo e impostare variabili ambiente. |
| Dominio custom | Bloccato | App pronta a ricevere `NEXT_PUBLIC_SITE_URL`. | Scegliere/acquistare dominio e configurare DNS. |
| Privacy/GDPR definitivo | Bloccato | Pagine legali MVP e checklist operative. | Titolare, email ufficiale, fornitori, basi giuridiche e revisione legale. |
| Autenticazione | Pronto tecnico | Scaffold Supabase, pagina `/account`, env config. | Creare progetto Supabase e provider Auth. |
| Database profili e piani | Pronto tecnico | Schema `supabase/schema.sql` con RLS per profili e piani. | Eseguire schema in Supabase e collegare salvataggio dai risultati. |

## Next actions P0

1. Collegare Vercel al repo `rdl1980/appdietasprint`.
2. Creare progetto Supabase.
3. Eseguire `supabase/schema.sql` nel SQL editor Supabase.
4. Impostare su Vercel `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`.
5. Scegliere/acquistare dominio e configurare DNS su Vercel.
6. Inserire dati legali reali e far revisionare privacy/termini/disclaimer.

## Milestone

### 1. Go-live demo
- Deploy su Vercel.
- Dominio custom.
- Privacy, cookie, termini e disclaimer revisionati.
- Analytics privacy-first.
- Error tracking.
- Test mobile e desktop.

### 2. Prodotto utilizzabile
- Login e account.
- Database Supabase/Postgres.
- Salvataggio profilo utente.
- Salvataggio piani generati.
- Storico piani.
- Preferenze alimentari persistenti.

### 3. AI reale
- Endpoint server-side per generazione piani.
- Prompt protetti lato server.
- Guardrail salute e calorie basse.
- Logging degli errori AI senza salvare dati sensibili inutili.
- Rigenerazione pasto reale.
- Sostituzioni coerenti con dieta, budget e calorie.

### 4. Monetizzazione
- Stripe checkout.
- Piano Free, Premium e Pro.
- Customer portal.
- Limiti per piano.
- Webhook Stripe.
- Stato abbonamento in database.

### 5. Qualita produzione
- Test automatici su calcolo calorie.
- Test generatore pasti.
- Test e2e onboarding -> risultati.
- Lighthouse mobile.
- Accessibilita base.
- Backup e policy dati.

## Definition of Done produzione

- Build e deploy automatici da GitHub.
- Nessuna vulnerabilita npm nota.
- Form con validazione robusta.
- Dati utente salvati in modo sicuro.
- Nessuna chiave API nel browser.
- Copy senza claim medici.
- Legale revisionato per GDPR.
- Monitoraggio errori attivo.
- Pagamenti testati in sandbox.
- Percorso utente mobile fluido.
