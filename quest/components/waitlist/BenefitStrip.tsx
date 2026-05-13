import { Bell, ShieldCheck, Tag, Zap } from "lucide-react";

const benefits = [
  [Zap, "Early Access", "Be the first to try Quest"],
  [Bell, "Exclusive Updates", "Get product updates first"],
  [Tag, "Special Offers", "Launch-only bonuses"],
  [ShieldCheck, "No Spam", "Only important emails"],
];

export default function BenefitStrip() {
  return (
    <section className="border-y border-border px-6 py-8 lg:px-8">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
        {benefits.map(([Icon, title, desc]) => (
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
