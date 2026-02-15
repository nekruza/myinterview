import { notFound } from "next/navigation";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { getPost, getAllSlugs, posts } from "@/lib/blog";
import { ArticleSchema, BreadcrumbSchema } from "@/components/structured-data/ArticleSchema";

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: `${post.title} — MyInterview Blog`,
    description: post.excerpt,
    alternates: {
      canonical: `https://myinterview.com/blog/${slug}`,
    },
    openGraph: {
      title: `${post.title} — MyInterview Blog`,
      description: post.excerpt,
      url: `https://myinterview.com/blog/${slug}`,
      type: "article",
      publishedTime: new Date(post.date).toISOString(),
      authors: [post.author],
      tags: ["interview anxiety", "interview practice", post.category],
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} — MyInterview Blog`,
      description: post.excerpt,
    },
  };
}

const categoryColors: Record<string, string> = {
  Anxiety: "bg-red-100 text-red-700",
  Preparation: "bg-blue-100 text-blue-700",
  Strategy: "bg-purple-100 text-purple-700",
  Technical: "bg-green-100 text-green-700",
  Mindset: "bg-orange-100 text-orange-700",
};

function renderContent(content: string) {
  const lines = content.trim().split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="text-2xl font-black text-secondary mt-10 mb-4">
          {line.replace("## ", "")}
        </h2>
      );
    } else if (line.startsWith("**") && line.endsWith("**") && !line.includes(" ")) {
      elements.push(
        <p key={i} className="font-bold text-secondary mt-4 mb-1">
          {line.replace(/\*\*/g, "")}
        </p>
      );
    } else if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("- ")) {
        items.push(lines[i].trim().replace("- ", ""));
        i++;
      }
      elements.push(
        <ul key={i} className="space-y-2 my-4 ml-4">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start text-neutral-700">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 mr-3 flex-shrink-0" />
              <span dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
            </li>
          ))}
        </ul>
      );
      continue;
    } else if (line.startsWith("**1.") || line.startsWith("**2.") || line.startsWith("**3.") || line.startsWith("**4.")) {
      elements.push(
        <p
          key={i}
          className="font-bold text-secondary mt-4 mb-1"
          dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }}
        />
      );
    } else if (line.startsWith("*") && line.endsWith("*") && !line.startsWith("**")) {
      elements.push(
        <p key={i} className="italic text-neutral-600 border-l-4 border-primary pl-4 py-1 my-4">
          {line.replace(/^\*|\*$/g, "")}
        </p>
      );
    } else if (line === "") {
      // skip blank lines between elements
    } else {
      elements.push(
        <p
          key={i}
          className="text-neutral-700 leading-relaxed my-4"
          dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, "<strong class='text-secondary'>$1</strong>") }}
        />
      );
    }
    i++;
  }

  return elements;
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const related = posts.filter(
    (p) => p.slug !== post.slug && p.category === post.category
  ).slice(0, 2);

  return (
    <>
      <ArticleSchema post={post} slug={slug} />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://myinterview.com" },
          { name: "Blog", url: "https://myinterview.com/blog" },
          { name: post.title, url: `https://myinterview.com/blog/${slug}` },
        ]}
      />
      <Navigation />
      <main id="main-content" className="bg-white min-h-screen">
        {/* Hero */}
        <section className="pt-36 pb-12 px-4 sm:px-6 lg:px-8 bg-cream">
          <div className="max-w-3xl mx-auto">
            <Link
              href="/blog"
              className="inline-flex items-center text-sm text-neutral-500 hover:text-primary transition mb-8 font-medium"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              All Articles
            </Link>

            <div className="flex items-center gap-3 mb-6">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${categoryColors[post.category] ?? "bg-neutral-100 text-neutral-700"}`}>
                {post.category}
              </span>
              <span className="text-neutral-400 text-sm">{post.readTime}</span>
              <span className="text-neutral-400 text-sm">·</span>
              <span className="text-neutral-400 text-sm">{post.date}</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-black text-secondary mb-6 leading-tight">
              {post.title}
            </h1>
            <p className="text-xl text-neutral-600 leading-relaxed mb-8">
              {post.excerpt}
            </p>
          </div>
        </section>


        {/* Article body */}
        <article className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto prose-custom">
            {renderContent(post.content)}
          </div>
        </article>

        {/* Related posts */}
        {related.length > 0 && (
          <section className="py-16 px-4 sm:px-6 lg:px-8 bg-cream">
            <div className="max-w-3xl mx-auto">
              <h3 className="text-2xl font-black text-secondary mb-8">More on {post.category}</h3>
              <div className="grid sm:grid-cols-2 gap-6">
                {related.map((rel) => (
                  <Link
                    key={rel.slug}
                    href={`/blog/${rel.slug}`}
                    className="group bg-white rounded-2xl p-6 border-2 border-neutral-100 hover:border-primary transition-all duration-300"
                  >
                    <div className="text-4xl mb-4">{rel.coverEmoji}</div>
                    <h4 className="font-black text-secondary group-hover:text-primary transition-colors mb-2 leading-snug">
                      {rel.title}
                    </h4>
                    <p className="text-sm text-neutral-500">{rel.readTime} · {rel.date}</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-secondary">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-7xl mb-6">🎯</p>
            <h2 className="text-3xl font-black text-white mb-4">
              Now put it into practice
            </h2>
            <p className="text-neutral-300 mb-8">
              Apply what you just read in a real mock interview session. Free to start, no credit card needed.
            </p>
            <Link
              href="/"
              className="inline-flex items-center bg-primary text-secondary font-bold px-8 py-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:brightness-95 active:translate-y-1 transition-all duration-100"
            >
              Start Practicing Free →
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
