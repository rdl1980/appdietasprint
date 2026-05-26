import { LegalLayout } from "@/components/LegalLayout";

export default function CookiesPage() {
  return (
    <LegalLayout
      eyebrow="Cookie"
      title="Cookie policy"
      intro="La demo non usa cookie di marketing. Questa pagina prepara il sito a una futura pubblicazione pubblica."
    >
      <section>
        <h2 className="text-lg font-black text-ink">Cookie tecnici</h2>
        <p className="mt-2">
          La versione MVP puo' usare solo tecnologie tecniche necessarie al funzionamento del sito e dati salvati
          localmente nel browser.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-black text-ink">Analytics e marketing</h2>
        <p className="mt-2">
          Se verranno aggiunti strumenti di analytics, pixel pubblicitari o newsletter, sara' necessario aggiornare
          questa pagina e mostrare un consenso cookie adeguato.
        </p>
      </section>
    </LegalLayout>
  );
}
