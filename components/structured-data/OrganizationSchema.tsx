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
      "MyInterview is a career programme for software engineering graduates who can code but can't get hired. It combines a real 3-month unpaid internship at a partner company, a 1-on-1 CV rewrite, and AI-powered mock interview practice. £359 upfront — £499 placement fee only when you land the job.",
    offers: [
      {
        "@type": "Offer",
        name: "Free Plan",
        price: "0",
        priceCurrency: "GBP",
        description:
          "3 free AI mock interview sessions with resume-tailored questions and instant feedback reports. No credit card required.",
        availability: "https://schema.org/InStock",
      },
      {
        "@type": "Offer",
        name: "Pro Plan",
        price: "13",
        priceCurrency: "GBP",
        description:
          "30 AI mock interview sessions per month with resume-tailored questions, billed £39 every 3 months.",
        availability: "https://schema.org/InStock",
      },
      {
        "@type": "Offer",
        name: "Career Service (Max)",
        price: "359",
        priceCurrency: "GBP",
        description:
          "3-month career programme including a real unpaid internship at a partner company, 1-on-1 CV rewrite, and AI mock interview practice. £359 upfront plus £499 placement fee charged only on successful job placement.",
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
          text: "MyInterview is a career programme for software engineering graduates. It combines a real 3-month unpaid internship at a partner company, a 1-on-1 CV rewrite from a specialist, and AI-powered mock interview practice — so you build genuine experience and can prove it in interviews.",
        },
      },
      {
        "@type": "Question",
        name: "Why is the internship unpaid?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Paid internships go to people who already have commercial experience — which is the catch-22 graduates face. The unpaid placement breaks that cycle: you ship real work at a partner company, get code-reviewed by engineers, and build 3 months of genuine git history that hiring managers can verify.",
        },
      },
      {
        "@type": "Question",
        name: "How does the pricing work?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "£359 upfront funds your place in the cohort — covering the internship placement, CV rewrite, and mock interview access. The £499 placement fee is charged only after you accept a paid job offer. If you don't land a job, you don't pay the £499.",
        },
      },
      {
        "@type": "Question",
        name: "Is there a free option?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. You can use the AI mock interview tool for free — 3 full sessions with resume-tailored questions and instant feedback reports, no credit card required. The full career service (internship, CV rewrite, cohort) requires joining the waitlist.",
        },
      },
      {
        "@type": "Question",
        name: "Do I need to be a CS graduate to join?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. The only requirement is that you can code. CS graduates, bootcamp graduates, and self-taught developers are all eligible. If you can build things and reason about code, you qualify for the programme.",
        },
      },
      {
        "@type": "Question",
        name: "What types of interviews can I practice with the AI tool?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The AI practice tool covers behavioural interviews (STAR method, leadership, conflict) and technical interviews (system design, coding, architecture). Questions are tailored to your CV and the specific role you are applying for.",
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
