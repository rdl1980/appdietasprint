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
