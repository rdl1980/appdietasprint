import { LegalLayout } from "@/components/LegalLayout";
import { env } from "@/lib/env";

export default function TermsPage() {
  return (
    <LegalLayout
      eyebrow="Termini"
      title="Termini di utilizzo"
      intro="Condizioni da sottoporre a revisione legale prima di attivare uso commerciale, pagamenti o abbonamenti."
    >
      <section>
        <h2 className="text-lg font-black text-ink">Uso del servizio</h2>
        <p className="mt-2">
          DietaSprint AI fornisce piani indicativi generati da template locali e calcoli nutrizionali approssimativi.
          L'utente resta responsabile delle proprie scelte alimentari e deve usare il servizio solo se maggiorenne.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-black text-ink">Nessuna consulenza medica</h2>
        <p className="mt-2">
          Il servizio non sostituisce medico, dietista o nutrizionista e non deve essere usato per diagnosi,
          trattamenti o gestione di patologie.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-black text-ink">Account</h2>
        <p className="mt-2">
          L'utente deve fornire un'email valida, proteggere l'accesso al proprio account e non inserire dati di terzi.
          Il titolare puo' sospendere l'accesso in caso di uso improprio, abuso tecnico o violazione dei termini.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-black text-ink">Disponibilita</h2>
        <p className="mt-2">
          La versione MVP puo' cambiare, interrompersi o perdere dati salvati nel browser. Non garantisce continuita
          del servizio o accuratezza professionale dei piani.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-black text-ink">Contatti</h2>
        <p className="mt-2">
          Per richieste relative al servizio: <a className="font-bold text-leaf" href={`mailto:${env.contactEmail}`}>{env.contactEmail}</a>.
          Prima del lancio commerciale aggiungere dati societari, legge applicabile, foro competente e regole di recesso/rimborsi se previsti.
        </p>
      </section>
    </LegalLayout>
  );
}
