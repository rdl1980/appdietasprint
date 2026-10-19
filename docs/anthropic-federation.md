# Anthropic senza chiave API: Workload Identity Federation su Vercel

Obiettivo: le funzioni Vercel si autenticano verso Anthropic con il token OIDC che Vercel emette per il progetto, senza `ANTHROPIC_API_KEY` salvata da nessuna parte.

## Come funziona

1. Vercel firma per ogni invocazione un JWT (`VERCEL_OIDC_TOKEN`) con `iss=https://oidc.vercel.com/rdl1980s-projects` e `sub=owner:rdl1980s-projects:project:appdietasprint:environment:production`.
2. L'app scrive quel token in un file temporaneo e costruisce il client Anthropic in modalita' `oidc_federation` (`src/lib/ai/provider.ts`).
3. L'SDK scambia il token con un access token Anthropic tramite la regola di federazione; la regola punta a un service account dell'organizzazione.

## 1. Console Anthropic (da fare a mano, ruolo admin)

https://platform.claude.com/settings/workload-identity-federation

Emittente ("Registra emittente"):

| Campo | Valore |
| --- | --- |
| Nome | `vercel-rdl1980s-projects` |
| URL dell'emittente (iss) | `https://oidc.vercel.com/rdl1980s-projects` |
| Sorgente JWKS | Individuazione OIDC |
| URL base di individuazione | vuoto |

Service account (https://platform.claude.com/settings/service-accounts > crea): nome `dietsprint-vercel`, ruolo minimo che consente le chiamate API (developer/user, non admin). Annotare l'id `svac_...`.

Regola (tab "Regole" > nuova regola):

| Campo | Valore |
| --- | --- |
| Emittente | `vercel-rdl1980s-projects` |
| Service account di destinazione | `dietsprint-vercel` |
| Subject (prefisso o esatto) | `owner:rdl1980s-projects:project:appdietasprint:environment:production` |
| Audience (se richiesto) | `https://vercel.com/rdl1980s-projects` |
| Scope | quello per le API di inferenza (non `org:admin`) |

Per gli ambienti Preview serve una seconda regola con `...:environment:preview` (o un prefisso `owner:rdl1980s-projects:project:appdietasprint:`).

Annotare: id regola `fdrl_...`, id service account `svac_...`, id organizzazione (Impostazioni organizzazione > Organizzazione).

## 2. Vercel

- Project > Settings > Security > "OIDC Federation" attivo, issuer mode `team`.
- Variabili (Production e Preview, non sono segreti):

```bash
ANTHROPIC_FEDERATION_RULE_ID=fdrl_...
ANTHROPIC_ORGANIZATION_ID=<uuid org>
ANTHROPIC_SERVICE_ACCOUNT_ID=svac_...
ANTHROPIC_MODEL=claude-opus-5-5
```

- Nessuna `ANTHROPIC_API_KEY`. Redeploy.

## 3. Verifica

- `GET /api/health` -> `aiConfigured: true`, `aiProvider: "anthropic"`.
- Con un account Premium: domanda al coach da `/results` (risposta senza "Risposta locale") e `POST /api/plans/generate` con `source: "ai"`.
- Console Anthropic > Identita' dei carichi di lavoro > "Eventi di autenticazione": compaiono gli scambi token riusciti.

## Locale

Il PC non ha un'identita' OIDC: in locale si usa `ANTHROPIC_API_KEY` in `.env.local` (oppure `ANTHROPIC_IDENTITY_TOKEN_FILE` con un token ottenuto da un emittente registrato).

## Limiti noti

- Il token Vercel ruota a ogni invocazione: il client Anthropic viene creato per richiesta e fa uno scambio token per ogni chiamata AI (una chiamata HTTP in piu', cache possibile in futuro).
- Issuer, regola e service account si creano solo con il ruolo admin dell'organizzazione Anthropic e non sono modificabili da Claude Code: il classificatore di sicurezza blocca la concessione di permessi.
