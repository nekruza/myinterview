/**
 * Organization JSON-LD schema for the homepage.
 * Improves Google Knowledge Panel and AI chatbot citation authority.
 */
export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "MyInterview",
    alternateName: "MyInterview App",
    applicationCategory: "EducationApplication",
    operatingSystem: "Web",
    url: "https://myinterview.com",
    logo: "https://myinterview.com/logo.jpg",
    description:
      "MyInterview is an AI-powered interview practice platform that helps software engineers overcome interview anxiety through AI mock interviews and peer practice sessions. 93% of engineers experience interview anxiety — MyInterview provides proven techniques and deliberate practice to build real confidence.",
    offers: [
      {
        "@type": "Offer",
        name: "Free Plan",
        price: "0",
        priceCurrency: "USD",
        description:
          "Unlimited AI practice sessions and up to 3 peer sessions per month. No credit card required.",
        availability: "https://schema.org/InStock",
      },
      {
        "@type": "Offer",
        name: "Pro Plan",
        price: "19",
        priceCurrency: "USD",
        description:
          "Unlimited AI and peer practice sessions, advanced anxiety techniques, and personalized interview prep plan.",
        availability: "https://schema.org/InStock",
      },
      {
        "@type": "Offer",
        name: "Team Plan",
        price: "49",
        priceCurrency: "USD",
        description:
          "Everything in Pro plus team dashboard, private team sessions, and company-specific interview preparation.",
        availability: "https://schema.org/InStock",
      },
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "127",
      bestRating: "5",
      worstRating: "1",
    },
    featureList: [
      "AI-powered behavioral interview practice",
      "AI-powered technical interview practice",
      "Peer-to-peer mock interview sessions",
      "Interview anxiety techniques and coaching",
      "STAR method behavioral question training",
      "System design interview practice",
      "Progress tracking and confidence scoring",
      "24/7 AI practice availability",
    ],
    screenshot: "https://myinterview.com/hero-image.png",
    author: {
      "@type": "Organization",
      name: "MyInterview",
      url: "https://myinterview.com",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function WebsiteSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "MyInterview",
    url: "https://myinterview.com",
    description:
      "Interview practice platform for engineers to overcome anxiety and land software engineering roles",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://myinterview.com/blog?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function HomepageFAQSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is MyInterview?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "MyInterview is an AI-powered interview practice platform that helps software engineers overcome interview anxiety through unlimited AI mock interviews and peer practice sessions. It covers behavioral interviews, technical questions, and system design.",
        },
      },
      {
        "@type": "Question",
        name: "How does AI interview practice work?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "MyInterview's AI acts as an interviewer, asking behavioral and technical questions and providing real-time feedback on your answers. It's available 24/7, so you can practice anytime without scheduling.",
        },
      },
      {
        "@type": "Question",
        name: "Why do engineers experience interview anxiety?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "93% of candidates experience mental freeze during interviews because the brain's stress response (amygdala activation) partially shuts down the prefrontal cortex — the area responsible for complex thinking and recall. Deliberate practice under simulated pressure is the proven solution.",
        },
      },
      {
        "@type": "Question",
        name: "Is MyInterview free?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. MyInterview offers a free plan with 3 AI practice sessions and up to 3 peer sessions per month. No credit card is required to get started. Pro plan is £13/month billed quarterly.",
        },
      },
      {
        "@type": "Question",
        name: "How many sessions does it take to improve interview performance?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Research shows 55-60% performance improvement with consistent mock interview practice. Most users see significant improvement after 8-12 focused sessions with real-time feedback, equivalent to 2-3 sessions per week over a month.",
        },
      },
      {
        "@type": "Question",
        name: "What types of interviews can I practice?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "MyInterview covers behavioral interviews (using the STAR method), technical coding interviews (data structures, algorithms), and system design interviews. Both AI and peer practice options are available for all formats.",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
