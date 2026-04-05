import { FC } from "react";

const TESTIMONIALS = [
  {
    name: "Priya K.",
    role: "Graduate Software Engineer",
    initial: "P",
    color: "#60a5fa",
    quote:
      "The mock interviews were tailored to the exact role I was applying for — it asked me questions I was actually asked in the real thing. After 6 sessions I got an offer from Amazon. Nothing else I'd tried came close.",
    outcome: "Landed at Amazon",
  },
  {
    name: "Marcus T.",
    role: "Junior Developer",
    initial: "M",
    color: "#2dec29",
    quote:
      "I'd been rejected 14 times before this. Having 3 months of real internship work to talk about changed everything. The AI practice meant I could actually articulate what I'd built. Got an offer within 2 weeks of finishing.",
    outcome: "Hired in 2 weeks",
  },
  {
    name: "Sarah L.",
    role: "Software Engineer",
    initial: "S",
    color: "#f472b6",
    quote:
      "The CV rewrite after the internship was the difference-maker. Before, I was getting filtered out before interviews. After, I got 4 first-round invites in a week. Landed at Stripe on my second final-round ever.",
    outcome: "Now at Stripe",
  },
];

const Star: FC = () => (
  <svg className="w-3.5 h-3.5" fill="#f59e0b" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

export const TestimonialsSection: FC = () => {
  return (
    <section
      id="testimonials"
      aria-labelledby="testimonials-heading"
      className="py-24 px-4 sm:px-6 lg:px-8"
      style={{ background: "linear-gradient(to bottom, #080c09 0%, #050e06 100%)" }}
    >
      <div className="max-w-6xl mx-auto">

        <div className="scroll-reveal text-center mb-16">
          <p className="font-bold text-sm uppercase tracking-wider mb-3" style={{ color: "#2dec29" }}>
            Success Stories
          </p>
          <h2
            id="testimonials-heading"
            className="text-4xl md:text-5xl font-black mb-4"
            style={{ color: "#ffffff" }}
          >
            Engineers who got hired.
          </h2>
          <p className="text-lg max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.5)" }}>
            Not just confident — actually employed.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6" role="list" aria-label="User testimonials">
          {TESTIMONIALS.map((t, i) => (
            <article
              key={t.name}
              role="listitem"
              className="scroll-reveal relative rounded-2xl overflow-hidden flex flex-col"
              style={{
                background: "linear-gradient(145deg, #0d2410 0%, #112715 60%, #0a1e0c 100%)",
                border: "1px solid rgba(45,236,41,0.22)",
                transitionDelay: `${i * 0.14}s`,
              }}
            >
              {/* Ambient glow */}
              <div
                className="pointer-events-none absolute -top-8 -right-8 w-32 h-32 rounded-full blur-3xl opacity-20"
                style={{ background: t.color }}
              />

              <div className="relative z-10 p-7 flex flex-col flex-1">

                {/* Stars */}
                <div className="flex items-center gap-0.5 mb-5">
                  {[1,2,3,4,5].map((i) => <Star key={i} />)}
                </div>

                {/* Quote */}
                <blockquote className="flex-1 text-sm leading-relaxed mb-6" style={{ color: "rgba(255,255,255,0.65)" }}>
                  &ldquo;{t.quote}&rdquo;
                </blockquote>

                {/* Outcome badge */}
                <div
                  className="inline-flex items-center gap-2 self-start rounded-full px-3 py-1.5 mb-5"
                  style={{ background: "rgba(45,236,41,0.10)", border: "1px solid rgba(45,236,41,0.22)" }}
                >
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#2dec29" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  <span className="text-[11px] font-bold" style={{ color: "#2dec29" }}>{t.outcome}</span>
                </div>

                {/* Author */}
                <div
                  className="flex items-center gap-3 pt-4"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0"
                    style={{ background: `${t.color}22`, color: t.color, border: `1px solid ${t.color}44` }}
                  >
                    {t.initial}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white leading-none">{t.name}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{t.role}</p>
                  </div>
                </div>

              </div>
            </article>
          ))}
        </div>

      </div>
    </section>
  );
};
