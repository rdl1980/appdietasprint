import { LegalLayout } from "@/components/LegalLayout";
import { env } from "@/lib/env";

export default function GdprPage() {
  return (
    <LegalLayout
      eyebrow="GDPR"
      title="Diritti privacy e gestione dati"
      intro="Pagina operativa per richieste privacy. Processo e tempi devono essere validati in revisione legale."
    >
      <section>
        <h2 className="text-lg font-black text-ink">Dati salvati</h2>
        <p className="mt-2">
          Quando account e Supabase sono configurati, l'app puo' salvare profilo alimentare, preferenze, piani
          generati, lista spesa, warning, consensi privacy e richieste GDPR collegati all'utente autenticato.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-black text-ink">Diritti utente</h2>
        <p className="mt-2">
          L'utente puo' richiedere accesso, rettifica, esportazione, cancellazione o opposizione al trattamento.
          Le richieste possono essere registrate da `/account/privacy` oppure inviate via email. Prima del lancio
          commerciale serve definire processo interno, tempi di risposta, responsabilita e verifica identita.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-black text-ink">Registro richieste</h2>
        <p className="mt-2">
          Le richieste sono salvate nella tabella `data_subject_requests` con tipo, stato, data creazione e note.
          La gestione operativa deve essere completata con procedure interne per presa in carico, evasione e prova.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-black text-ink">Contatto privacy</h2>
        <p className="mt-2">
          Email da configurare: <a className="font-bold text-leaf" href={`mailto:${env.contactEmail}`}>{env.contactEmail}</a>.
          Aggiorna questa informazione con l'indirizzo ufficiale prima della pubblicazione.
        </p>
      </section>
    </LegalLayout>
  );
}
