import Button from "@/components/ui/Button";

export default function CtaBanner() {
  return (
    <section id="roadmap" className="px-6 py-20 lg:px-8">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-2xl border border-border bg-surface p-10 text-center sm:p-16">
        <div className="absolute inset-x-0 top-0 h-px bg-accent/40" />
        <div className="absolute bottom-0 left-1/2 h-28 w-2/3 -translate-x-1/2 bg-accent/10 blur-3xl" />
        <div className="relative">
          <h2 className="font-display text-4xl font-bold">
            Be The First To Get Access
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted">
            Join the launch list for early access, product updates, and the first
            look at Quest’s market intelligence engine.
          </p>
          <Button href="/waitlist" variant="primary" size="lg" className="mt-8">
            Join the Waitlist →
          </Button>
        </div>
      </div>
    </section>
  );
}
