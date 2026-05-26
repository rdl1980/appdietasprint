import { Card } from "@/components/Card";
import { Header } from "@/components/Header";
import { WarningBox } from "@/components/WarningBox";
import { disclaimerText } from "@/components/DisclaimerText";

export default function DisclaimerPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <p className="mb-3 inline-flex rounded-full bg-mint px-4 py-2 text-sm font-bold text-leaf">
          Disclaimer salute
        </p>
        <h1 className="text-3xl font-black text-ink sm:text-5xl">Uso responsabile di DietaSprint AI.</h1>
        <div className="mt-6">
          <WarningBox tone="strong">{disclaimerText}</WarningBox>
        </div>
        <Card className="mt-6">
          <h2 className="text-xl font-black text-ink">Cosa fa questo MVP</h2>
          <p className="mt-3 leading-7 text-ink/70">
            Calcola BMR e TDEE con formula Mifflin-St Jeor, applica deficit standard,
            seleziona pasti da template locali e mostra una lista spesa indicativa.
          </p>
        </Card>
        <Card className="mt-4">
          <h2 className="text-xl font-black text-ink">Cosa non fa</h2>
          <p className="mt-3 leading-7 text-ink/70">
            Non diagnostica, non cura, non sostituisce una visita, non gestisce patologie
            e non raccomanda diete molto restrittive come soluzione generale.
          </p>
        </Card>
      </main>
    </>
  );
}
