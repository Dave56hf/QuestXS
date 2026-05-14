import Badge from "@/components/ui/Badge";

export default function WaitlistHero() {
  return (
    <section className="px-6 py-20 text-center lg:px-8">
      <Badge>Join The Waitlist</Badge>
      <h1 className="mx-auto mt-6 max-w-3xl font-display text-5xl font-bold leading-tight">
        Be The First To Know When <span className="text-accent">We Launch</span>
      </h1>
      <p className="mx-auto mt-5 max-w-md leading-7 text-muted">
        Save your spot for early access to Quest’s crypto market scanner and
        launch updates.
      </p>
    </section>
  );
}
