import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SmoothScroll } from "@/components/SmoothScroll";
import {
  HeroSection,
  ProblemStatement,
  HowItWorks,
  FeaturesSection,
  TestimonialsSection,
  PricingSection,
  JoinTeamSection,
} from "@/components/sections";

export default function Home() {
  return (
    <>
      <SmoothScroll />
      <Navigation />
      <main className="bg-white text-neutral-900 font-sans antialiased mx-auto">
        <HeroSection />
        <ProblemStatement />
        <FeaturesSection />
        <PricingSection />
        <JoinTeamSection />
      </main>
      <Footer />
    </>
  );
}
