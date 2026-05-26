import { CheckCircle2 } from "lucide-react";
import Button from "@/components/ui/Button";
import TrendingTable from "@/components/widgets/TrendingTable";

const bullets = [
  "Spot trending coins early",
  "Track market momentum",
  "Get real-time alerts",
  "Make informed decisions",
];

export default function TradersSection() {
  return (
    <section id="how-it-works" className="px-6 py-24 lg:px-8">
      <div className="mx-auto grid max-w-7xl items-center gap-12 grid-cols-1 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <h2 className="font-display text-4xl font-bold sm:text-5xl">
            Built For Traders <span className="text-accent">& Investors</span>
          </h2>
          <p className="mt-5 max-w-lg leading-7 text-muted">
            Quest turns live crypto market movement into a focused operating
            dashboard for people who need signal faster than headlines.
          </p>
          <ul className="mt-8 space-y-4">
            {bullets.map((bullet) => (
              <li key={bullet} className="flex items-center gap-3 text-sm">
                <CheckCircle2 className="h-5 w-5 text-accent" />
                {bullet}
              </li>
            ))}
          </ul>
          <Button href="#features" variant="outline" className="mt-8">
            Explore Features
          </Button>
        </div>
        <TrendingTable />
      </div>
    </section>
  );
}
