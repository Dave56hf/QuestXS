import { Bell, Clock, LayoutGrid, Zap } from "lucide-react";

const features = [
  [Clock, "24/7 Market Scanning", "Continuous tracking across the market."],
  [Zap, "Smart Signals", "Momentum cues without the noise."],
  [LayoutGrid, "Clean & Simple", "Readable intelligence at a glance."],
  [Bell, "Stay Ahead", "Know when attention starts moving."],
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
