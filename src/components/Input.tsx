import { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  helper?: string;
};

export function Input({ label, helper, className = "", ...props }: InputProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-ink">{label}</span>
      <input
        className={`h-12 w-full rounded-[8px] border border-ink/10 bg-white px-4 text-ink outline-none transition placeholder:text-ink/35 focus:border-leaf focus:ring-4 focus:ring-leaf/20 ${className}`}
        {...props}
      />
      {helper ? <span className="mt-1 block text-xs text-ink/55">{helper}</span> : null}
    </label>
  );
}
