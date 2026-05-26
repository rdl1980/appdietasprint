import { Header } from "@/components/Header";
import { PricingCard } from "@/components/PricingCard";
import { WarningBox } from "@/components/WarningBox";
import { disclaimerText } from "@/components/DisclaimerText";

const tiers = [
  {
    name: "Free",
    price: "0 euro",
    features: ["1 piano giornaliero", "Calcolo calorie", "Lista spesa base"],
  },
  {
    name: "Premium",
    price: "9.99 euro/mese",
    highlighted: true,
    features: [
      "Piani 7 giorni",
      "Rigenerazione pasti",
      "Sostituzioni",
      "Export PDF placeholder",
      "Modalita budget",
    ],
  },
  {
    name: "Pro",
    price: "19.99 euro/mese",
    features: ["Coach AI", "Piani illimitati", "Famiglia", "Meal prep", "Advanced tracking"],
  },
];

export default function PricingPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-8 max-w-3xl">
          <p className="mb-3 inline-flex rounded-full bg-mint px-4 py-2 text-sm font-bold text-leaf">
            Pricing mock
          </p>
          <h1 className="text-3xl font-black text-ink sm:text-5xl">Scegli quanto sprint vuoi.</h1>
          <p className="mt-3 leading-7 text-ink/65">
            Questi piani sono segnaposto per l'MVP: nessun pagamento reale, nessuna autenticazione.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {tiers.map((tier) => (
            <PricingCard key={tier.name} {...tier} />
          ))}
        </div>
        <div className="mt-8">
          <WarningBox>{disclaimerText}</WarningBox>
        </div>
      </main>
    </>
  );
}
