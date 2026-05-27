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
- `/legal/disclaimer`

## Supabase Auth

Per evitare errori PKCE sui magic link in Next.js, configura il template email Supabase con token hash.

In Supabase vai su **Authentication > Email Templates > Magic Link** e usa un link di questo tipo:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Accedi a DietaSprint AI</a>
```

In **Authentication > URL Configuration** imposta:

- Site URL: `https://dietsprintai.com`
- Redirect URL: `https://dietsprintai.com/auth/confirm`
- Redirect URL: `https://dietsprintai.com/auth/callback`
- Redirect URL: `https://www.dietsprintai.com/auth/confirm`
- Redirect URL: `https://www.dietsprintai.com/auth/callback`
- Redirect URL: `https://appdietasprint.vercel.app/auth/confirm`
- Redirect URL: `https://appdietasprint.vercel.app/auth/callback`
- Redirect URL: `http://127.0.0.1:3000/auth/confirm`
- Redirect URL: `http://127.0.0.1:3000/auth/callback`

Il progetto usa database e autenticazione Supabase quando le variabili pubbliche Supabase sono configurate.
