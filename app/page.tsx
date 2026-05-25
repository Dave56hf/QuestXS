import CtaBanner from "@/components/landing/CtaBanner";
import FeatureStrip from "@/components/landing/FeatureStrip";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import PainSection from "@/components/landing/PainSection";
import TradersSection from "@/components/landing/TradersSection";
import WhyQuest from "@/components/landing/WhyQuest";

export default function Home() {
  return (
    <>
      <Hero />
      <PainSection />
      <FeatureStrip />
      <TradersSection />
      <HowItWorks />
      <WhyQuest />
      <CtaBanner />
    </>
  );
}
