import { LegalLayout } from "@/components/LegalLayout";

export default function PrivacyPage() {
  return (
    <LegalLayout
      eyebrow="Privacy"
      title="Privacy policy"
      intro="Bozza MVP per spiegare in modo semplice quali dati usa DietaSprint AI nella demo pubblica."
    >
      <section>
        <h2 className="text-lg font-black text-ink">Dati inseriti nel planner</h2>
        <p className="mt-2">
          Nella versione MVP i dati del profilo alimentare vengono salvati nel browser tramite localStorage.
          Non vengono inviati a un database e non esiste un account utente.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-black text-ink">Dati tecnici</h2>
        <p className="mt-2">
          Il servizio di hosting puo' raccogliere log tecnici necessari a sicurezza, disponibilita e diagnostica
          del sito, come indirizzo IP, user agent e richieste effettuate.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-black text-ink">Dati sensibili</h2>
        <p className="mt-2">
          Peso, obiettivi, preferenze alimentari e informazioni sanitarie possono essere dati delicati. Non inserire
          diagnosi, patologie o informazioni mediche se non richieste da un professionista.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-black text-ink">Contatti</h2>
        <p className="mt-2">
          Prima del lancio commerciale questa pagina va adattata con titolare del trattamento, email di contatto,
          fornitori reali, tempi di conservazione e diritti GDPR.
        </p>
      </section>
    </LegalLayout>
  );
}
