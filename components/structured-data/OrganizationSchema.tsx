/**
 * JSON-LD structured data for the landing page: Organization, WebSite,
 * SoftwareApplication and FAQPage. Builders are pure so they can be tested;
 * the components just serialise them.
 */
import { FAQ_ITEMS } from "@/components/landing/faq-data";
import { PLANS } from "@/lib/billing";
import { CONTACT_EMAIL, SITE_URL } from "@/lib/site";

const DESCRIPTION =
  "Fina is a language-learning app for speaking real roleplay conversations out loud with AI tutors, with vocabulary flashcards, AI word generation and a 30-day study plan in 9 languages.";

const toPrice = (cents: number) => (cents / 100).toFixed(2);

export function buildOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Fina",
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    contactPoint: {
      "@type": "ContactPoint",
      email: CONTACT_EMAIL,
      contactType: "customer support",
    },
  };
}

export function buildWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Fina",
    url: SITE_URL,
    description: DESCRIPTION,
  };
}

export function buildSoftwareApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Fina",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    url: SITE_URL,
    image: `${SITE_URL}/logo.png`,
    description: DESCRIPTION,
    offers: [
      {
        "@type": "Offer",
        name: "Free",
        price: "0",
        priceCurrency: "USD",
      },
      {
        "@type": "Offer",
        name: "Fina Pro",
        price: toPrice(PLANS.monthly.amountCents),
        priceCurrency: "USD",
        description: `Unlimited AI conversations and word generation. ${PLANS.monthly.display} or ${PLANS.yearly.display}.`,
      },
    ],
  };
}

export function buildFaqSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

/** Serialises JSON-LD, escaping "<" so no value can close the script element. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

export function OrganizationSchema() {
  return <JsonLd data={buildOrganizationSchema()} />;
}

export function WebsiteSchema() {
  return <JsonLd data={buildWebsiteSchema()} />;
}

export function SoftwareApplicationSchema() {
  return <JsonLd data={buildSoftwareApplicationSchema()} />;
}

export function FaqSchema() {
  return <JsonLd data={buildFaqSchema()} />;
}
