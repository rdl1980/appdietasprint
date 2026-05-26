import { ReactNode } from "react";
import { Card } from "./Card";

type FormSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <Card>
      <div className="mb-5">
        <h2 className="text-xl font-bold tracking-normal text-ink">{title}</h2>
        {description ? <p className="mt-1 text-sm leading-6 text-ink/65">{description}</p> : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </Card>
  );
}
