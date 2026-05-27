import type { HTMLAttributes, ReactNode } from "react";

export default function Card({
  children,
  className = "",
  ...props
}: {
  children: ReactNode;
  className?: string;
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-none border border-border bg-surface p-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
