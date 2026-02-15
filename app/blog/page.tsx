import Link from "next/link";
import Image from "next/image";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { posts } from "@/lib/blog";

export const metadata = {
  title: "Blog — MyInterview",
  description:
    "Tips, research, and real stories on conquering interview anxiety and landing the roles you deserve.",
};

const categoryColors: Record<string, string> = {
  Anxiety: "bg-red-100 text-red-700",
  Preparation: "bg-blue-100 text-blue-700",
  Strategy: "bg-purple-100 text-purple-700",
  Technical: "bg-green-100 text-green-700",
  Mindset: "bg-orange-100 text-orange-700",
};

export default function BlogPage() {
  const [featured, ...rest] = posts;

  return (
    <>
      <Navigation />
      <main className="bg-white min-h-screen">
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
                    <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
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
                  className="group bg-white rounded-2xl border-2 border-neutral-100 hover:border-primary transition-all duration-300 overflow-hidden flex flex-col"
                >
                  <div className="bg-cream flex items-center justify-center py-10 text-6xl">
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
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-cream">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-black text-secondary mb-4">
              Ready to put this into practice?
            </h2>
            <p className="text-neutral-600 mb-8">
              Reading helps — but nothing beats deliberate practice. Start your
              first AI mock interview session for free.
            </p>
            <Link
              href="/#pricing"
              className="inline-flex items-center bg-primary text-secondary font-bold px-8 py-4 rounded-2xl shadow-[4px_4px_0px_0px_#1A1A1A] hover:brightness-95 active:translate-y-1 active:shadow-[2px_2px_0px_0px_#1A1A1A] transition-all duration-100"
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
