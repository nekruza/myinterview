import type { Metadata } from "next";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { FinalCta } from "@/components/landing/FinalCta";
import {
  FaqSchema,
  OrganizationSchema,
  SoftwareApplicationSchema,
  WebsiteSchema,
} from "@/components/structured-data/OrganizationSchema";

export const metadata: Metadata = {
  title: { absolute: "Fina — Speak a new language with AI tutors" },
  description:
    "Speak real roleplay conversations out loud with AI tutors Luna, Henry and Jake in 9 languages. Vocabulary flashcards, AI word generation and a 30-day study plan.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <>
      <OrganizationSchema />
      <WebsiteSchema />
      <SoftwareApplicationSchema />
      <FaqSchema />
      <Navigation />
      <main id="main-content" className="overflow-x-clip bg-cream text-ink">
        <Hero />
        <HowItWorks />
        <Features />
        <Pricing />
        <FAQ />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
