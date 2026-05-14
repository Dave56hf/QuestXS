import Card from "@/components/ui/Card";

const features = [
  ["Hot Opportunities", "Discover high-potential coins before they trend."],
  ["Real-time Market Insights", "Powerful data and signals that keep you ahead."],
  ["Smart Alerts", "Custom alerts for the moves that matter to you."],
];

export default function WhatToExpect() {
  return (
    <section id="faq" className="px-6 py-24 lg:px-8">
      <div className="mx-auto max-w-7xl text-center">
        <h2 className="font-display text-4xl font-bold">What To Expect</h2>
        <p className="mx-auto mt-4 max-w-2xl text-muted">
          We&apos;re building the most advanced crypto market scanner for finding
          momentum, monitoring opportunities, and getting timely signals.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="text-left">
            <div className="mb-5 flex gap-2">
              <span className="h-3 w-3 rounded-full bg-danger" />
              <span className="h-3 w-3 rounded-full bg-yellow-400" />
              <span className="h-3 w-3 rounded-full bg-accent" />
            </div>
            <h3 className="font-semibold">Opportunity Dashboard</h3>
            <div className="mt-5 space-y-3">
              {["MNT", "AERO", "TIA", "JUP"].map((coin) => (
                <div key={coin} className="flex items-center justify-between rounded-lg bg-bg p-3">
                  <div className="flex items-center gap-3">
                    <span className="h-7 w-7 rounded-full bg-accent/20" />
                    <span className="font-medium">{coin}</span>
                  </div>
                  <span className="rounded-full bg-accent/10 px-2 py-1 text-xs text-accent">
                    HOT
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="text-left font-semibold">Market Chart</h3>
            <svg viewBox="0 0 320 180" className="mt-6 h-44 w-full" aria-hidden="true">
              {[30, 70, 110, 150].map((y) => (
                <line key={y} x1="0" x2="320" y1={y} y2={y} stroke="#1f1f1f" />
              ))}
              <polyline
                points="0,132 44,120 88,128 132,82 176,94 220,46 264,58 320,24"
                fill="none"
                stroke="#22c55e"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="4"
              />
            </svg>
            <div className="grid grid-cols-4 text-xs text-muted">
              <span>7D</span>
              <span>30D</span>
              <span>90D</span>
              <span>1Y</span>
            </div>
          </Card>

          <Card>
            <div className="mx-auto max-w-xs rounded-2xl border border-border bg-bg p-4 text-left">
              <h3 className="font-semibold">Mobile Alert</h3>
              <div className="mt-4 space-y-3">
                {[
                  ["SOL", "+8.4%"],
                  ["RNDR", "+6.1%"],
                  ["LINK", "+4.8%"],
                ].map(([coin, change]) => (
                  <div key={coin} className="flex items-center justify-between rounded-xl bg-surface p-3">
                    <div className="flex items-center gap-3">
                      <span className="h-8 w-8 rounded-full bg-accent/20" />
                      <span>{coin} momentum spike</span>
                    </div>
                    <span className="text-sm text-accent">{change}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          {features.map(([title, desc]) => (
            <div key={title} className="text-left">
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
