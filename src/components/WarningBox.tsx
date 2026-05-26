import { AlertTriangle } from "lucide-react";
import { ReactNode } from "react";

type WarningBoxProps = {
  children: ReactNode;
  tone?: "soft" | "strong";
};

export function WarningBox({ children, tone = "soft" }: WarningBoxProps) {
  const classes =
    tone === "strong"
      ? "border-coral/35 bg-coral/10 text-ink"
      : "border-lemon/50 bg-lemon/20 text-ink";

  return (
    <div className={`flex gap-3 rounded-[8px] border p-4 text-sm leading-6 ${classes}`}>
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-coral" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
