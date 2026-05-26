import { LegalLayout } from "@/components/LegalLayout";

export default function CookiesPage() {
  return (
    <LegalLayout
      eyebrow="Cookie"
      title="Cookie policy"
      intro="Policy coerente con l'assetto attuale: nessun cookie marketing o analytics non tecnico installato."
    >
      <section>
        <h2 className="text-lg font-black text-ink">Cookie tecnici</h2>
        <p className="mt-2">
          La versione MVP puo' usare solo tecnologie tecniche necessarie al funzionamento del sito e dati salvati
          localmente nel browser, come sessione Supabase, preferenze e dati temporanei del planner.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-black text-ink">Analytics e marketing</h2>
        <p className="mt-2">
          Se verranno aggiunti strumenti di analytics, pixel pubblicitari o newsletter, sara' necessario aggiornare
          questa pagina e mostrare un consenso cookie adeguato.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-black text-ink">Banner cookie</h2>
        <p className="mt-2">
          Finche' il sito usa solo strumenti tecnici necessari, il banner di consenso non e' previsto. Se si aggiungono
          analytics non anonimizzati, advertising, retargeting o strumenti equivalenti, servira' un meccanismo di
          consenso preventivo e granulare da validare.
        </p>
      </section>
    </LegalLayout>
  );
}
