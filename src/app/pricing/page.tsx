import { Header } from "@/components/Header";
import { CheckoutButton } from "@/components/CheckoutButton";
import { PricingCard } from "@/components/PricingCard";
import { WarningBox } from "@/components/WarningBox";
import { disclaimerText } from "@/components/DisclaimerText";

const tiers = [
  {
    name: "Free",
    price: "0 euro",
    features: ["1 piano giornaliero", "Calcolo calorie", "Nessun salvataggio account"],
    ctaLabel: "Inizia gratis",
    ctaHref: "/planner",
  },
  {
    name: "Premium",
    price: "29 euro una tantum",
    highlighted: true,
    features: [
      "Piani 7 giorni",
      "Salvataggio profilo e piani",
      "Rigenerazione pasti",
      "Sostituzioni",
      "Modalita budget",
      "Lista spesa completa",
    ],
  },
];

export default function PricingPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-8 max-w-3xl">
          <p className="mb-3 inline-flex rounded-full bg-mint px-4 py-2 text-sm font-bold text-leaf">
            Free e Premium
          </p>
          <h1 className="text-3xl font-black text-ink sm:text-5xl">Scegli quanto sprint vuoi.</h1>
          <p className="mt-3 leading-7 text-ink/65">
            Free genera un piano giornaliero senza salvataggio. Premium e' un acquisto una tantum che sblocca tutte le funzioni.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {tiers.map((tier) => (
            <PricingCard
              key={tier.name}
              {...tier}
              action={tier.name === "Premium" ? <CheckoutButton /> : undefined}
            />
          ))}
        </div>
        <div className="mt-8">
          <WarningBox>{disclaimerText}</WarningBox>
        </div>
      </main>
    </>
  );
}
