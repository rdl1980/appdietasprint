# DietaSprint AI

MVP Next.js per un planner alimentare assistito da logica locale deterministica.

## Comandi

```bash
npm install
npm run dev
npm run lint
npm run build
```

## Rotte

- `/`
- `/planner`
- `/results`
- `/pricing`
- `/register`
- `/login`
- `/forgot-password`
- `/account`
- `/legal/disclaimer`

## Supabase Auth

L'accesso utente usa email e password. Non esporre il magic link come metodo di login.

In Supabase vai su **Authentication > Providers > Email** e abilita:

- Email provider
- Confirm email, se vuoi conferma registrazione
- Secure email change, consigliato

Per conferma account, in **Confirm signup** usa:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup">Conferma account</a>
```

Per recupero password, in **Reset password** usa:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/account/password">Reimposta password</a>
```

In **Authentication > URL Configuration** imposta:

- Site URL: `https://dietsprintai.com`
- Redirect URL: `https://dietsprintai.com/auth/confirm`
- Redirect URL: `https://www.dietsprintai.com/auth/confirm`
- Redirect URL: `https://appdietasprint.vercel.app/auth/confirm`
- Redirect URL: `http://127.0.0.1:3000/auth/confirm`

Il progetto usa database e autenticazione Supabase quando le variabili pubbliche Supabase sono configurate.

## Email

Le email applicative usano Resend lato server. Le email di conferma account e recupero password usano Resend tramite il custom SMTP di Supabase Auth.

Configurazione SMTP Supabase:

```text
Host: smtp.resend.com
Porta: 465
Username: resend
Mittente: DietaSprint AI <no-reply@dietsprintai.com>
```

La password SMTP e' una API key Resend con permesso di invio sul dominio `dietsprintai.com`. Non salvarla nel repository.

Variabili server-only:

```bash
RESEND_API_KEY=
RESEND_FROM_EMAIL="DietaSprint AI <no-reply@dietsprintai.com>"
PRIVACY_NOTIFICATION_EMAIL=
```

## Database

Lo snapshot iniziale vive in `supabase/schema.sql`. Le migrazioni versionate vivono in `supabase/migrations`.

Le tabelle MVP sono:

- `user_profiles`
- `meal_plans`
- `privacy_consents`
- `data_subject_requests`

Tutte hanno Row Level Security attiva. Le policy consentono agli utenti autenticati di accedere solo ai propri dati.

## Admin

Il backlog interno vive su `/admin/backlog` ed e' protetto lato server. La voce di menu appare solo agli utenti admin.

Per creare l'admin `rdladmin`:

Opzione consigliata, script locale:

```bash
set NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
set SUPABASE_SERVICE_ROLE_KEY=service-role-key
set ADMIN_EMAIL=abbonamenti.dileva@gmail.com
set ADMIN_USERNAME=rdladmin
npm run admin:create
```

Lo script chiedera' la password senza salvarla nel repository. In PowerShell usa `$env:NOME_VARIABILE="valore"` al posto di `set`.

Opzione manuale:

1. Vai in Supabase > Authentication > Users.
2. Crea un nuovo utente con una email reale e la password scelta fuori dal repository.
3. Imposta negli app metadata dell'utente:

```json
{
  "username": "rdladmin",
  "role": "admin"
}
```

4. In alternativa, imposta su Vercel una di queste variabili server-only:

```bash
ADMIN_EMAILS=email-admin@dominio.it
ADMIN_USERNAMES=rdladmin
```

Non salvare password admin in codice, README o variabili pubbliche `NEXT_PUBLIC_*`.
