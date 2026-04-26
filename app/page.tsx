import type { Metadata } from "next";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SmoothScroll } from "@/components/SmoothScroll";
import { LandingPageWrapper } from "@/components/LandingPageWrapper";
import {
  CareerServiceHero,
  CareerSolutionSection,
  FeaturesSection,
  PricingSection,
  FAQSection,
  VideoSection,
  } from "@/components/sections";
import {
  OrganizationSchema,
  WebsiteSchema,
  HomepageFAQSchema,
} from "@/components/structured-data/OrganizationSchema";
import { ScrollRevealInit } from "@/components/ScrollRevealInit";

export const metadata: Metadata = {
  title: "MyInterview — Land Your First Engineering Job",
  description:
    "A complete career programme for graduates who can code but can't get hired. Resume review, AI mock interviews, peer practice, and a real internship. £359 to start.",
  alternates: {
    canonical: "https://myinterview.com",
  },
  openGraph: {
    title: "MyInterview — Land Your First Engineering Job",
    description:
      "Resume review, AI mock interviews, peer practice, and a real internship on your CV. £359 to start — £499 when you land the job.",
    url: "https://myinterview.com",
    type: "website",
  },
};

export default function Home() {
  return (
    <>
      <OrganizationSchema />
      <WebsiteSchema />
      <HomepageFAQSchema />
      <SmoothScroll />
      <ScrollRevealInit />
      <LandingPageWrapper>
        <Navigation />
        <main id="main-content" className="bg-white text-neutral-900 font-sans antialiased mx-auto">
          <CareerServiceHero />
          <VideoSection />
          <FeaturesSection />
          <PricingSection />
          {/* <CareerSolutionSection /> */}
          <FAQSection />
        </main>
        <Footer />
      </LandingPageWrapper>
    </>
  );
}
