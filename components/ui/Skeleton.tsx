export default function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-none bg-surface2 ${className}`} />;
}
