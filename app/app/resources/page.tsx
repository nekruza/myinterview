import Link from "next/link";
import { ChevronRight, BookOpen, Clock, Lightbulb } from "lucide-react";
import { posts } from "@/lib/blog";

const categoryColors: Record<string, { bg: string; text: string }> = {
  Anxiety:     { bg: "#fef3c720", text: "#92400e" },
  Preparation: { bg: "#2dec2920", text: "#0a5c09" },
  Strategy:    { bg: "#dbeafe20", text: "#1e40af" },
  Technical:   { bg: "#ccfbf120", text: "#0f766e" },
  Mindset:     { bg: "#fce7f320", text: "#9d174d" },
};

export default function ResourcesPage() {
  const [featured, ...rest] = posts;

  return (
    <div className="space-y-6 pb-12 animate-fade-in">

      {/* Header */}
      <div
        className="relative rounded-2xl overflow-hidden px-6 py-5 flex items-center gap-4"
        style={{
          background: "linear-gradient(135deg, #071a09 0%, #0d2410 60%, #061508 100%)",
          border: "1px solid rgba(45,236,41,0.12)",
        }}
      >
        <div
          className="pointer-events-none absolute -top-6 -right-6 w-32 h-32 rounded-full blur-2xl opacity-20"
          style={{ background: "#2dec29" }}
        />
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 relative z-10"
          style={{ background: "rgba(45,236,41,0.10)", border: "1px solid rgba(45,236,41,0.18)" }}
        >
          <Lightbulb className="w-5 h-5" style={{ color: "#2dec29" }} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="w-1 h-1 rounded-full" style={{ background: "#2dec29" }} />
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(45,236,41,0.65)" }}>
              Interview Guides
            </span>
          </div>
          <h1 className="text-white font-bold text-lg leading-tight">Resources</h1>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.42)" }}>
            Guides and strategies to ace your next interview.
          </p>
        </div>
      </div>

      {/* Featured post */}
      <Link
        href={`/blog/${featured.slug}`}
        className="group relative rounded-2xl overflow-hidden flex flex-col gap-4 p-6 hover:opacity-95 transition-opacity block"
        style={{ background: "linear-gradient(145deg, #112715 0%, #1c4220 60%, #0f2312 100%)" }}
      >
        <div
          className="pointer-events-none absolute -bottom-6 -right-6 w-40 h-40 rounded-full blur-2xl opacity-20"
          style={{ background: "#2dec29" }}
        />
        <div className="relative z-10">
          <div className="text-4xl mb-3">{featured.coverEmoji}</div>
          <div className="flex items-center gap-2 mb-2">
            <span
              className="text-[10px] px-2.5 py-1 rounded-full font-bold"
              style={{ background: "#2dec2925", color: "#2dec29" }}
            >
              {featured.category}
            </span>
            <span className="text-[10px] text-white/40 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {featured.readTime}
            </span>
          </div>
          <h2 className="text-white font-bold text-lg leading-snug mb-2">
            {featured.title}
          </h2>
          <p className="text-white/50 text-xs leading-relaxed line-clamp-2 mb-4">
            {featured.excerpt}
          </p>
          <div
            className="flex items-center gap-1 text-sm font-bold"
            style={{ color: "#2dec29" }}
          >
            Read article
            <ChevronRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </div>
        </div>
      </Link>

      {/* All other posts */}
      <div>
        <h2 className="font-bold text-secondary text-base mb-3">All Articles</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {rest.map((post) => {
            const color = categoryColors[post.category] ?? { bg: "#f3f4f620", text: "#374151" };
            return (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="glass-card group rounded-2xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
              >
                <div className="h-1.5" style={{ background: "#2dec29" }} />
                <div className="p-4 flex flex-col flex-1">
                  <div className="text-2xl mb-2">{post.coverEmoji}</div>
                  <h3 className="font-black text-secondary text-sm mb-1.5 leading-snug line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-[11px] text-neutral-400 leading-relaxed line-clamp-2 flex-1 mb-3">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] px-2.5 py-0.5 rounded-full font-bold"
                        style={{ background: color.bg, color: color.text }}
                      >
                        {post.category}
                      </span>
                      <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.readTime}
                      </span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-neutral-300 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

    </div>
  );
}
