import CtaBanner from "@/components/landing/CtaBanner";
import FeatureStrip from "@/components/landing/FeatureStrip";
import Hero from "@/components/landing/Hero";
import TradersSection from "@/components/landing/TradersSection";
import WhyQuest from "@/components/landing/WhyQuest";

export default function Home() {
  return (
    <>
      <Hero />
      <FeatureStrip />
      <TradersSection />
      <WhyQuest />
      <CtaBanner />
    </>
  );
}
