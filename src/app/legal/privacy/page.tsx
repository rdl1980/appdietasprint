import { LegalLayout } from "@/components/LegalLayout";
import { env } from "@/lib/env";

export default function PrivacyPage() {
  return (
    <LegalLayout
      eyebrow="Privacy"
      title="Privacy policy"
      intro="Informativa da sottoporre a revisione legale prima del lancio commerciale. I campi del titolare devono essere completati."
    >
      <section>
        <h2 className="text-lg font-black text-ink">Titolare del trattamento</h2>
        <p className="mt-2">
          Titolare: {env.legalController}. Sede: {env.legalAddress}. Identificativo fiscale: {env.legalVat}.
          Contatto privacy: <a className="font-bold text-leaf" href={`mailto:${env.contactEmail}`}>{env.contactEmail}</a>.
          {env.dpoEmail ? <> DPO: <a className="font-bold text-leaf" href={`mailto:${env.dpoEmail}`}>{env.dpoEmail}</a>.</> : null}
        </p>
      </section>
      <section>
        <h2 className="text-lg font-black text-ink">Categorie di dati trattati</h2>
        <p className="mt-2">
          L'app puo' trattare email, identificativo account, sesso, eta, altezza, peso, livello di attivita,
          obiettivo, tipo di dieta, target calorico, pasti al giorno, cibi esclusi, preferenze di semplicita,
          piani alimentari generati, lista spesa, consensi e richieste privacy.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-black text-ink">Finalita e basi giuridiche</h2>
        <p className="mt-2">
          I dati sono usati per creare e salvare piani alimentari, gestire account, sicurezza, richieste privacy
          e miglioramento tecnico del servizio. Le basi giuridiche da validare sono esecuzione del servizio,
          consenso per dati alimentari potenzialmente delicati, obbligo legale per richieste GDPR e legittimo
          interesse per sicurezza e log tecnici.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-black text-ink">Fornitori e trasferimenti</h2>
        <p className="mt-2">
          Il servizio puo' usare Vercel per hosting e log tecnici e Supabase per autenticazione, database e
          conservazione dei dati account. Prima del lancio devono essere verificati ruoli privacy, accordi di
          trattamento dati, localizzazione, sub-responsabili e trasferimenti extra UE.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-black text-ink">Conservazione</h2>
        <p className="mt-2">
          I dati account, profili e piani sono conservati finche' l'account resta attivo o finche' l'utente chiede
          cancellazione. I log tecnici vanno mantenuti per il periodo minimo necessario a sicurezza e diagnostica.
          I tempi esatti devono essere approvati in revisione legale.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-black text-ink">Diritti</h2>
        <p className="mt-2">
          L'utente puo' chiedere accesso, rettifica, cancellazione, limitazione, opposizione, portabilita e revoca
          del consenso ove applicabile. Puo' inoltre proporre reclamo al Garante per la protezione dei dati personali.
          Le richieste possono essere inviate dall'area account privacy o via email.
        </p>
      </section>
    </LegalLayout>
  );
}
