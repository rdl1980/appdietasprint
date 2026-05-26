import { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <div
      className={`rounded-[8px] border border-ink/10 bg-white/90 p-5 shadow-soft backdrop-blur ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
