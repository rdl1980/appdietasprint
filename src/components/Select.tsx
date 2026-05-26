import { SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: { value: string; label: string }[];
  helper?: string;
};

export function Select({ label, helper, options, className = "", ...props }: SelectProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-ink">{label}</span>
      <select
        className={`h-12 w-full rounded-[8px] border border-ink/10 bg-white px-4 text-ink outline-none transition focus:border-leaf focus:ring-4 focus:ring-leaf/20 ${className}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {helper ? <span className="mt-1 block text-xs text-ink/55">{helper}</span> : null}
    </label>
  );
}
