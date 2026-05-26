import { Quote } from "lucide-react";

const quotes = [
  {
    painTag: "Late Entries",
    quote:
      "By the time I hear about the move, the chart already looks ‘obvious’—and my entry is the exit.",
  },
  {
    painTag: "Noise Over Signal",
    quote:
      "Twitter tells me what happened. Quest tells me what’s forming—before it becomes a headline.",
  },
  {
    painTag: "No Context",
    quote:
      "I can’t tell if a pump is liquidity or momentum. I need the market map, not another ticker.",
  },
];

export default function PainSection() {
  return (
    <section className="px-6 py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <h2 className="font-display text-4xl font-bold tracking-tight">
            Every Trader Knows This <span className="text-accent">Feeling</span>
            .
          </h2>
          <p className="mt-4 text-body leading-7 text-muted">
            Quest is built to stop the late reactions—when attention shifts,
            opportunities show up first.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {quotes.map((item) => (
            <div
              key={item.painTag}
              className="relative border border-accent/30 bg-surface/40 p-6"
            >
              <div className="absolute right-4 top-4 opacity-30">
                <Quote className="h-6 w-6 text-accent" />
              </div>
              <div className="text-sm font-medium text-accent">
                {item.painTag}
              </div>
              <p className="mt-4 text-lg leading-7 text-headline">
                {item.quote}
              </p>
              <div className="mt-6 h-px w-full bg-accent/20" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
