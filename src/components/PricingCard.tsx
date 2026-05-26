import { Check } from "lucide-react";
import { Button } from "./Button";
import { Card } from "./Card";

type PricingCardProps = {
  name: string;
  price: string;
  features: string[];
  highlighted?: boolean;
};

export function PricingCard({ name, price, features, highlighted }: PricingCardProps) {
  return (
    <Card className={highlighted ? "border-leaf/45 bg-mint" : ""}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-bold text-ink">{name}</h2>
        {highlighted ? (
          <span className="rounded-full bg-leaf px-3 py-1 text-xs font-bold text-white">Popolare</span>
        ) : null}
      </div>
      <p className="mt-4 text-3xl font-black text-ink">{price}</p>
      <ul className="mt-5 space-y-3 text-sm text-ink/70">
        {features.map((feature) => (
          <li key={feature} className="flex gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-leaf" aria-hidden="true" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <Button href="/planner" variant={highlighted ? "primary" : "secondary"} className="mt-6 w-full">
        Scegli piano
      </Button>
    </Card>
  );
}
