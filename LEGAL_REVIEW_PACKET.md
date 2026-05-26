# DietaSprint AI - Legal review packet

Questo documento prepara la revisione professionale. Non sostituisce parere legale.

## Fonti ufficiali usate come base

- GDPR art. 13: informazioni da fornire quando i dati sono raccolti presso l'interessato.
- Commissione europea: obbligo di indicare titolare, finalita, base giuridica, destinatari, trasferimenti, conservazione, diritti, reclamo e decisioni automatizzate.
- EDPB: consenso GDPR come manifestazione libera, specifica, informata e inequivocabile.
- Garante Privacy: linee guida cookie e altri strumenti di tracciamento.

## Campi legali da compilare prima del lancio

| Campo | Stato | Dove configurarlo |
| --- | --- | --- |
| Titolare del trattamento | Da definire | `NEXT_PUBLIC_LEGAL_CONTROLLER` |
| Sede / indirizzo | Da definire | `NEXT_PUBLIC_LEGAL_ADDRESS` |
| P.IVA / codice fiscale | Da definire | `NEXT_PUBLIC_LEGAL_VAT` |
| Email privacy/supporto | Da definire | `NEXT_PUBLIC_CONTACT_EMAIL` |
| DPO, se nominato | Da valutare | `NEXT_PUBLIC_DPO_EMAIL` |
| Dominio definitivo | Da definire | `NEXT_PUBLIC_SITE_URL` |

## Registro trattamenti proposto

| Trattamento | Dati | Finalita | Base giuridica da validare | Conservazione proposta | Fornitori |
| --- | --- | --- | --- | --- | --- |
| Account | Email, id utente, log sessione | Accesso e sicurezza | Contratto / misure precontrattuali | Finche' account attivo + log tecnici brevi | Supabase, Vercel |
| Planner alimentare | Sesso, eta, altezza, peso, attivita, obiettivo, dieta, esclusioni, calorie | Generazione piano alimentare | Consenso esplicito o contratto, da validare | Finche' account attivo o cancellazione utente | Supabase, Vercel |
| Piani salvati | Piano pasti, lista spesa, warning calorie | Consultazione e storico | Contratto / consenso, da validare | Finche' account attivo o cancellazione utente | Supabase |
| Richieste privacy | Email, tipo richiesta, note, stato | Gestione diritti GDPR | Obbligo legale | Termine necessario alla gestione e prova | Supabase |
| Log tecnici | IP, user agent, eventi tecnici | Sicurezza e disponibilita | Legittimo interesse, da bilanciare | Minimo necessario | Vercel, Supabase |

## Punti critici da far validare

1. Se peso, dieta, esclusioni e obiettivi rendono il trattamento assimilabile a dati particolari ex art. 9 GDPR.
2. Base giuridica corretta per salvare profili alimentari e piani.
3. Necessita o meno di DPIA.
4. Ruoli privacy di Vercel e Supabase, inclusi DPA e trasferimenti extra UE.
5. Cookie banner: non necessario finche' non ci sono analytics/marketing non tecnici.
6. Disclaimer sanitario e assenza di claim medici.
7. Termini commerciali se si attivano abbonamenti Stripe.

## Definition of done legale

- Informative complete con dati del titolare.
- DPA/accordi con fornitori verificati.
- Registro trattamenti approvato.
- Processo richieste GDPR documentato.
- Retention approvata.
- Cookie policy coerente con strumenti effettivamente installati.
- Disclaimer validato per prodotto non medico.
