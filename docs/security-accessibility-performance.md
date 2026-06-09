# Review security, accessibilita e performance

Checklist operativa per la beta pubblica.

## Security

- Header HTTP attivi: HSTS, frame deny, nosniff, referrer policy, permissions policy, COOP e CSP report-only.
- Rate limit presenti su endpoint sensibili: login indiretto Auth, piani, privacy export, richieste GDPR e cancellazione account.
- Segreti solo server-side: nessuna chiave `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `RESEND_API_KEY` o `AUTH_SECRET` esposta come `NEXT_PUBLIC_*`.
- Debug auth disabilitato in produzione, salvo diagnosi temporanea.
- Cancellazione account self-service protetta da login, conferma testuale e rate limit.

## Accessibilita

- Skip link globale verso il contenuto.
- Navigazione principale con label.
- Focus visibile su bottoni e link principali.
- Form con label esplicite.
- Stati di errore e successo mostrati come testo, non solo colore.
- Verifica manuale tastiera su home, planner, risultati, login, account e privacy.

## Performance mobile

- Build production verde prima del deploy.
- Immagini o asset futuri vanno serviti con dimensioni definite e formati moderni.
- Evitare bundle client non necessari nei componenti server.
- Verificare Lighthouse mobile su home, planner e risultati.
- Controllare che planner e risultati non abbiano layout shift evidente su Pixel 7.

## Comandi

```bash
npm run lint
npm test
npm run build
npm run test:e2e:public
npm run test:e2e:authenticated
```
