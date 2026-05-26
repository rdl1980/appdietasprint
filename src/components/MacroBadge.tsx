type MacroBadgeProps = {
  label: string;
  value: string;
};

export function MacroBadge({ label, value }: MacroBadgeProps) {
  return (
    <span className="inline-flex min-h-8 items-center rounded-full bg-mint px-3 text-xs font-semibold text-ink">
      {label}: {value}
    </span>
  );
}
