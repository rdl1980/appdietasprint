import { LegalLayout } from "@/components/LegalLayout";

export default function TermsPage() {
  return (
    <LegalLayout
      eyebrow="Termini"
      title="Termini di utilizzo"
      intro="Regole essenziali per usare DietaSprint AI come strumento dimostrativo di pianificazione alimentare."
    >
      <section>
        <h2 className="text-lg font-black text-ink">Uso del servizio</h2>
        <p className="mt-2">
          DietaSprint AI fornisce piani indicativi generati da template locali e calcoli nutrizionali approssimativi.
          L'utente resta responsabile delle proprie scelte alimentari.
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
        <h2 className="text-lg font-black text-ink">Disponibilita</h2>
        <p className="mt-2">
          La versione MVP puo' cambiare, interrompersi o perdere dati salvati nel browser. Non garantisce continuita
          del servizio o accuratezza professionale dei piani.
        </p>
      </section>
    </LegalLayout>
  );
}
