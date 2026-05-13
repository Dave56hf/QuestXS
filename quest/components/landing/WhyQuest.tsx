import { BarChart2, Bell, Brain, RefreshCw } from "lucide-react";

const reasons = [
  [RefreshCw, "Real-Time Data", "Fresh market snapshots keep the picture current."],
  [Brain, "AI-Powered Insights", "Pattern summaries designed for faster reads."],
  [Bell, "Custom Alerts", "Watch the moves and thresholds that matter."],
  [BarChart2, "Portfolio Tracking", "Monitor market context alongside holdings."],
];

export default function WhyQuest() {
  return (
    <section id="benefits" className="px-6 py-20 lg:px-8">
      <div className="mx-auto max-w-7xl text-center">
        <h2 className="font-display text-4xl font-bold">
          Why <span className="text-accent">Quest</span>?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-muted">
          A calmer way to watch a chaotic market, built around speed, clarity, and
          useful context.
        </p>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
          {reasons.map(([Icon, title, desc]) => (
            <div key={title as string} className="rounded-xl border border-border bg-surface p-5 text-left">
              <Icon className="h-6 w-6 text-accent" />
              <h3 className="mt-5 font-semibold">{title as string}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{desc as string}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
