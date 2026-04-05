import type { Metadata } from "next";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { posts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Interview Anxiety & Prep Blog — MyInterview",
  description:
    "Research-backed tips, real engineer success stories, and practical techniques to conquer interview anxiety and land your dream software engineering role. Free guides updated 2026.",
  alternates: {
    canonical: "https://myinterview.com/blog",
  },
  openGraph: {
    title: "Interview Anxiety & Prep Blog — MyInterview",
    description:
      "Research-backed tips, real engineer stories, and proven techniques to conquer interview anxiety. Behavioral prep, technical interviews, system design, and more.",
    url: "https://myinterview.com/blog",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Interview Anxiety & Prep Blog — MyInterview",
    description:
      "Research-backed guides to conquer interview anxiety and land your next software engineering role.",
  },
};

const categoryColors: Record<string, string> = {
  Anxiety: "bg-red-100 text-red-700",
  Preparation: "bg-blue-100 text-blue-700",
  Strategy: "bg-teal-100 text-teal-700",
  Technical: "bg-green-100 text-green-700",
  Mindset: "bg-orange-100 text-orange-700",
};

function BlogListSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "MyInterview Blog — Interview Anxiety & Preparation",
    description:
      "Research-backed tips, real engineer success stories, and practical techniques to conquer interview anxiety and land your dream software engineering role.",
    url: "https://myinterview.com/blog",
    publisher: {
      "@type": "Organization",
      name: "MyInterview",
      url: "https://myinterview.com",
      logo: {
        "@type": "ImageObject",
        url: "https://myinterview.com/logo.jpg",
      },
    },
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      description: post.excerpt,
      url: `https://myinterview.com/blog/${post.slug}`,
      author: {
        "@type": "Person",
        name: post.author,
        jobTitle: post.authorRole,
      },
      datePublished: new Date(post.date).toISOString(),
      keywords: ["interview anxiety", "interview practice", post.category.toLowerCase()].join(", "),
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default function BlogPage() {
  const [featured, ...rest] = posts;

  return (
    <>
      <BlogListSchema />
      <Navigation />
      <main id="main-content" className="bg-white min-h-screen">
        {/* Hero */}
        <section className="pt-36 pb-16 px-4 sm:px-6 lg:px-8 bg-cream">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-primary font-bold text-sm uppercase tracking-wider mb-3">
              The MyInterview Blog
            </p>
            <h1 className="text-4xl md:text-6xl font-black text-secondary mb-6">
              Conquer the Interview,<br className="hidden md:block" /> Conquer the Anxiety
            </h1>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              Research-backed tips, real engineer stories, and practical techniques
              to help you show up confident.
            </p>
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">

            {/* Featured post */}
            <Link href={`/blog/${featured.slug}`} className="group block mb-16">
              <div className="grid md:grid-cols-2 gap-8 bg-secondary rounded-3xl overflow-hidden">
                <div className="flex items-center justify-center bg-secondary p-16 text-center">
                  <span className="text-9xl">{featured.coverEmoji}</span>
                </div>
                <div className="p-8 md:p-12 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${categoryColors[featured.category] ?? "bg-neutral-100 text-neutral-700"}`}>
                      {featured.category}
                    </span>
                    <span className="text-neutral-400 text-sm">{featured.readTime}</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-white mb-4 group-hover:text-primary transition-colors">
                    {featured.title}
                  </h2>
                  <p className="text-neutral-300 leading-relaxed mb-6">
                    {featured.excerpt}
                  </p>
                  <div className="flex items-center gap-3">
                    <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
                    style={{ background: "#2dec29", color: "#071a09" }}
                  >
                    {featured.author[0]}
                  </div>
                    <div>
                      <p className="text-white text-sm font-semibold">{featured.author}</p>
                      <p className="text-neutral-400 text-xs">{featured.date}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            {/* Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {rest.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group bg-white rounded-2xl border border-neutral-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col"
                >
                  <div
                    className="flex items-center justify-center py-10 text-6xl"
                    style={{ background: "linear-gradient(135deg, #f8fdf8 0%, #f0fdf4 100%)" }}
                  >
                    {post.coverEmoji}
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${categoryColors[post.category] ?? "bg-neutral-100 text-neutral-700"}`}>
                        {post.category}
                      </span>
                      <span className="text-neutral-400 text-xs">{post.readTime}</span>
                    </div>
                    <h3 className="text-lg font-black text-secondary mb-3 group-hover:text-primary transition-colors leading-snug">
                      {post.title}
                    </h3>
                    <p className="text-sm text-neutral-600 leading-relaxed mb-6 flex-1">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center gap-2 pt-4 border-t border-neutral-100">
                      <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-white font-bold text-xs">
                        {post.author[0]}
                      </div>
                      <div>
                        <p className="text-secondary text-xs font-semibold">{post.author}</p>
                        <p className="text-neutral-400 text-xs">{post.date}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section
          className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
          style={{ background: "linear-gradient(160deg, #071a09 0%, #0d2410 55%, #061508 100%)" }}
        >
          <div
            className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-32 rounded-full blur-3xl"
            style={{ background: "rgba(45,236,41,0.06)" }}
          />
          <div className="relative z-10 max-w-2xl mx-auto text-center">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(45,236,41,0.6)" }}>
              Put it into practice
            </p>
            <h2 className="text-3xl font-black text-white mb-4">
              Ready to put this into practice?
            </h2>
            <p className="mb-8" style={{ color: "rgba(255,255,255,0.45)" }}>
              Reading helps — but nothing beats deliberate practice. Start your
              first AI mock interview session for free.
            </p>
            <Link
              href="/#pricing"
              className="inline-flex items-center gap-2 font-bold px-8 py-3.5 rounded-xl transition-all hover:brightness-110"
              style={{ background: "#2dec29", color: "#071a09" }}
            >
              Start Practicing Free
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
