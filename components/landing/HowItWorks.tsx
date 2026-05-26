import { Terminal } from "lucide-react";

const steps = [
  {
    num: "01",
    title: "Data Ingestion",
    desc: "Pulls on-chain momentum, volume shifts, and attention signals—then normalizes everything into one operating layer.",
    snippetLines: [
      "ingest: market_snapshots ✅",
      "ingest: social_heat ✅",
      "ingest: volume_delta ✅",
    ],
  },
  {
    num: "02",
    title: "Opportunity Scoring",
    desc: "Scores coins by trajectory: momentum quality, liquidity conditions, and velocity consistency.",
    snippetLines: [
      "score: opportunity_score = 0..100",
      "score: confidence_window = 7m..24h",
      "score: risk_tone = bullish|bearish",
    ],
  },
  {
    num: "03",
    title: "Early Warning Alert",
    desc: "When thresholds break, Quest sends a terminal-grade alert—so you act before the chart becomes consensus.",
    snippetLines: [
      "alert: threshold_crossed ✅",
      "alert: watchlist_triggered ✅",
      "alert: delta_pulse = +/− ✅",
    ],
  },
  {
    num: "04",
    title: "Your Dashboard",
    desc: "Your view stays alive: scores, deltas, spark trends, and portfolio context—always on, always readable.",
    snippetLines: [
      "dashboard: opportunity_panel",
      "dashboard: coin_table",
      "dashboard: alerts_badge",
    ],
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="px-6 py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="font-display text-4xl font-bold tracking-tight">
            How It Works
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-body leading-7 text-muted">
            Four steps. One operating view. Built for traders who don’t wait for
            headlines.
          </p>
        </div>

        <div className="mt-14 flex flex-col gap-8">
          {steps.map((s) => (
            <div
              key={s.num}
              className="grid grid-cols-12 gap-6 rounded-none border border-border bg-surface/30 p-6"
            >
              <div className="col-span-3 flex items-start">
                <div className="font-mono text-5xl font-bold text-accent/30">
                  {s.num}
                </div>
              </div>

              <div className="col-span-9">
                <div className="flex items-center gap-3">
                  <Terminal className="h-5 w-5 text-accent" />
                  <h3 className="font-display text-2xl font-bold">{s.title}</h3>
                </div>
                <p className="mt-3 text-body leading-7 text-muted">{s.desc}</p>

                <div className="mt-6 rounded-none border border-accent/20 bg-bg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-accent/80">
                      quest/terminal
                    </span>
                    <span className="text-xs text-muted">live</span>
                  </div>
                  <div className="mt-3 space-y-1 font-mono text-xs text-data">
                    {s.snippetLines.map((line) => (
                      <div key={line} className="leading-5 opacity-90">
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
