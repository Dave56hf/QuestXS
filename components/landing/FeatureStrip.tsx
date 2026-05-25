import { Bell, Clock, LayoutGrid, Zap } from "lucide-react";

const features = [
  [
    Clock,
    "24/7 Market Scanning",
    "Quest monitors volume spikes, wallet activity, and social mentions around the clock. Not just price. The stuff that moves before price does.",
  ],
  [
    Zap,
    "Opportunity Score",
    "Every coin gets a real-time score based on momentum, social velocity, and on-chain activity. No more guessing. One number that tells you if it's worth watching.",
  ],
  [
    Bell,
    "Early Warning Alerts",
    "Set custom triggers on unusual on-chain activity, sudden social spikes, or momentum shifts. Get notified before the crowd notices — not after.",
  ],
  [
    LayoutGrid,
    "Context-Aware Portfolio View",
    "Know when attention starts see your holdings inside the market narrative, not isolated from it. Know if the momentum behind your positions is building or fading in real time.",
  ],
];

export default function FeatureStrip() {
  return (
    <section id="features" className="border-y border-border px-6 py-8 lg:px-8">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
        {features.map(([Icon, title, desc]) => (
          <div key={title as string} className="flex gap-3">
            <Icon className="mt-1 h-5 w-5 shrink-0 text-accent" />
            <div>
              <h3 className="font-medium">{title as string}</h3>
              <p className="mt-1 text-sm text-muted">{desc as string}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
