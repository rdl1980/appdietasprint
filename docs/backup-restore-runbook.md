# Backup e restore Supabase

Obiettivo: avere una procedura ripetibile prima della beta pubblica, con almeno una prova di ripristino su database non produttivo.

## Prerequisiti

- PostgreSQL client tools installati (`pg_dump` e `pg_restore` nel PATH).
- Variabile server-only disponibile in locale o CI:
  - `POSTGRES_URL_NON_POOLING`, preferita;
  - oppure `POSTGRES_URL`;
  - oppure `DATABASE_URL`.
- Mai committare dump o URL database. La cartella `backups/` e' ignorata da Git.

## Backup manuale

```bash
npm run db:backup
```

Lo script crea un file `backups/supabase-<timestamp>.dump` in formato custom PostgreSQL.

## Restore su staging

Usare solo su un database staging o appena creato per test di ripristino:

```bash
npm run db:restore -- backups/supabase-YYYY-MM-DD.dump
```

Lo script usa `--clean --if-exists`: puo' cancellare e ricreare oggetti nel database target.

## Cadenza consigliata MVP

- Prima di ogni modifica schema: backup manuale.
- Prima del lancio beta: backup manuale e restore test su staging.
- Dopo il lancio beta: backup giornaliero gestito da Supabase/Vercel o job dedicato, piu' restore test mensile.

## Checklist restore test

1. Creare o selezionare database staging vuoto.
2. Impostare `POSTGRES_URL_NON_POOLING` verso staging.
3. Eseguire restore.
4. Verificare tabelle chiave:
   - `user_profiles`
   - `meal_plans`
   - `privacy_consents`
   - `data_subject_requests`
5. Verificare RLS attiva sulle tabelle.
6. Documentare data, file usato, esito e tempo necessario.
