import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import MarketOverview from "@/components/widgets/MarketOverview";
import TopMovers from "@/components/widgets/TopMovers";

export default function Hero() {
  return (
    <section className="relative overflow-hidden px-6 py-20 lg:px-8">
      <div className="absolute left-[-10%] top-20 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative">
          <div className="animate-fade-in opacity-0">
            <Badge>Early Access — Limited Spots Open</Badge>
          </div>
          <h1 className="mt-6 animate-fade-up font-display text-5xl font-bold leading-tight opacity-0 sm:text-6xl">
            Find Crypto <span className="text-accent">Opportunities</span>{" "}
            Before Anyone Else.
          </h1>
          <p className="mt-6 max-w-xl animate-fade-up text-lg leading-8 text-muted opacity-0 [animation-delay:120ms]">
            Quest tracks on-chain momentum, social heat, and volume shifts in
            real time so you stop chasing pumps and start catching moves as
            they build. Built for traders who are tired of being last.
          </p>
          <div className="mt-8 flex animate-fade-up flex-col gap-3 opacity-0 [animation-delay:240ms] sm:flex-row">
            <Button href="/waitlist" variant="primary" size="lg">
              Join the Waitlist
            </Button>
            <Button href="#how-it-works" variant="ghost" size="lg">
              See How It Works
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <MarketOverview />
          <TopMovers />
        </div>
      </div>
    </section>
  );
}
