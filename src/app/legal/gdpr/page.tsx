import { LegalLayout } from "@/components/LegalLayout";
import { env } from "@/lib/env";

export default function GdprPage() {
  return (
    <LegalLayout
      eyebrow="GDPR"
      title="Diritti privacy e gestione dati"
      intro="Pagina operativa MVP per spiegare come DietaSprint AI gestira' richieste su dati personali e dati alimentari salvati."
    >
      <section>
        <h2 className="text-lg font-black text-ink">Dati salvati</h2>
        <p className="mt-2">
          Quando account e Supabase sono configurati, l'app puo' salvare profilo alimentare, preferenze, piani
          generati, lista spesa, warning e consensi privacy collegati all'utente autenticato.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-black text-ink">Diritti utente</h2>
        <p className="mt-2">
          L'utente puo' richiedere accesso, rettifica, esportazione, cancellazione o opposizione al trattamento.
          Prima del lancio commerciale serve definire processo, tempi, titolare e responsabili.
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
