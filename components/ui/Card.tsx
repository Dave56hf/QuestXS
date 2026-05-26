import type { ReactNode } from "react";

export default function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-none border border-border bg-surface p-4 ${className}`}
    >
      {children}
    </div>
  );
}
