import { BlogPost } from "@/lib/blog";

interface ArticleSchemaProps {
  post: BlogPost;
  slug: string;
}

/**
 * Article JSON-LD schema for blog post pages.
 * Boosts E-E-A-T signals and AI citation probability.
 */
export function ArticleSchema({ post, slug }: ArticleSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: isoDate(post.date),
    dateModified: isoDate(post.date),
    author: {
      "@type": "Person",
      name: post.author,
      jobTitle: post.authorRole,
      url: `https://myinterview.com/blog`,
    },
    publisher: {
      "@type": "Organization",
      name: "MyInterview",
      url: "https://myinterview.com",
      logo: {
        "@type": "ImageObject",
        url: "https://myinterview.com/logo.jpg",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://myinterview.com/blog/${slug}`,
    },
    url: `https://myinterview.com/blog/${slug}`,
    about: {
      "@type": "Thing",
      name: "Interview Preparation and Anxiety Management",
    },
    keywords: [
      "interview anxiety",
      "mock interview",
      "interview practice",
      "job interview tips",
      "software engineer interview",
    ].join(", "),
    inLanguage: "en-US",
    isAccessibleForFree: true,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function BreadcrumbSchema({
  items,
}: {
  items: { name: string; url: string }[];
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/** Convert a human-readable date like "February 10, 2026" to ISO 8601. */
function isoDate(dateStr: string): string {
  try {
    return new Date(dateStr).toISOString();
  } catch {
    return new Date().toISOString();
  }
}
