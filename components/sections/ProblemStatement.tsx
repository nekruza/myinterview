import { FC } from "react";

export const ProblemStatement: FC = () => {
  const problems = [
    {
      img: "/problem/blank.png",
      title: "Your Mind Goes Blank",
      quote: "I know the answers, but when the interviewer asks, my mind freezes. Everything I studied just disappears.",
      stat: "→ 93% experience this",
    },
    {
      img: "/problem/overthinking.png",
      title: "You Overthink Everything",
      quote: "Every question feels like a trap. I second-guess every word. Did I say too much? Too little?",
      stat: "→ Anxiety feedback loop",
    },
    {
      img: "/problem/alone.png",
      title: "You Feel Alone",
      quote: "Everyone else seems confident. I feel like I'm the only one struggling. I don't know who to talk to.",
      stat: "→ You're not alone",
    },
  ];

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-primary font-bold text-sm uppercase tracking-wider mb-3">
            THE REAL PROBLEM
          </p>
          <h2 className="text-4xl md:text-5xl font-black mb-4 text-secondary">
            Interview Anxiety Affects Everyone
          </h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            You&apos;re qualified. You&apos;re prepared. But anxiety makes you
            doubt everything.
          </p>
        </div>

        {/* 3 Column Grid */}
        <div className="grid md:grid-cols-3 gap-6 md:gap-6 md:mt-12">
          {problems.map((problem, index) => (
            <div
              key={index}
              className="group bg-cream rounded-2xl p-6 border-2 border-transparent hover:border-secondary transition-all duration-300"
            >
              <div className="mb-4 md:mb-0 md:relative md:-top-12">
                <img
                  src={problem.img}
                  alt={problem.title}
                  className="w-24 h-24 object-cover rounded-full border-4 border-secondary"
                />
              </div>
              <div className="md:-mt-6">
                <h3 className="text-xl font-bold mb-3 text-secondary">
                  {problem.title}
                </h3>
                <p className="text-sm text-neutral-700 italic mb-4 leading-relaxed">
                  &quot;{problem.quote}&quot;
                </p>
                <div className="text-xs font-semibold text-secondary">
                  {problem.stat}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
