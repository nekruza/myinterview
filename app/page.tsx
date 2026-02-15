import type { Metadata } from "next";
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
import {
  OrganizationSchema,
  WebsiteSchema,
  HomepageFAQSchema,
} from "@/components/structured-data/OrganizationSchema";

export const metadata: Metadata = {
  title: "MyInterview — Conquer Interview Anxiety | AI & Peer Practice",
  description:
    "MyInterview helps software engineers overcome interview anxiety through AI mock interviews and peer practice sessions. 93% of engineers experience mental freeze — we fix that. Start free.",
  alternates: {
    canonical: "https://myinterview.com",
  },
  openGraph: {
    title: "MyInterview — Conquer Interview Anxiety | AI & Peer Practice",
    description:
      "AI-powered mock interview practice and peer coaching to help engineers overcome anxiety and land their dream roles. 500+ beta users. Free to start.",
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
      <Navigation />
      <main id="main-content" className="bg-white text-neutral-900 font-sans antialiased mx-auto">
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
