"use client";

export function MacDots({ className = "" }: { className?: string }) {
  return (
    <div className={`mb-4 flex items-center gap-2 ${className}`}>
      <span className="h-2 w-2 rounded-full bg-danger" />
      <span className="h-2 w-2 rounded-full bg-accent/20" />
      <span className="h-2 w-2 rounded-full bg-accent" />
    </div>
  );
}
