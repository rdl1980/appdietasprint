import { ReactNode } from "react";
import { Card } from "./Card";
import { Header } from "./Header";

type LegalLayoutProps = {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
};

export function LegalLayout({ eyebrow, title, intro, children }: LegalLayoutProps) {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <p className="mb-3 inline-flex rounded-full bg-mint px-4 py-2 text-sm font-bold text-leaf">
          {eyebrow}
        </p>
        <h1 className="text-3xl font-black text-ink sm:text-5xl">{title}</h1>
        <p className="mt-4 leading-7 text-ink/65">{intro}</p>
        <Card className="mt-6 space-y-6 text-sm leading-7 text-ink/70">{children}</Card>
      </main>
    </>
  );
}
