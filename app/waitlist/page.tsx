import BenefitStrip from "@/components/waitlist/BenefitStrip";
import WaitlistForm from "@/components/waitlist/WaitlistForm";
import WaitlistHero from "@/components/waitlist/WaitlistHero";
import WhatToExpect from "@/components/waitlist/WhatToExpect";

export default function WaitlistPage() {
  return (
    <>
      <WaitlistHero />
      <section className="px-6 pb-20">
        <WaitlistForm />
      </section>
      <BenefitStrip />
      <WhatToExpect />
    </>
  );
}
