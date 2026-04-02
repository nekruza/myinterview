import { FC } from "react";

export const ProblemStatement: FC = () => {
  const problems = [
    {
      emoji: "🧠",
      title: "Your Mind Goes Blank",
      quote: "I know the answers, but when the interviewer asks, my mind freezes. Everything I studied just disappears.",
      stat: "→ 93% experience this",
    },
    {
      emoji: "🎯",
      title: "Generic Practice Doesn't Work",
      quote: "I've done ChatGPT mock interviews and watched YouTube prep videos — but none of it is tailored to my actual resume or the specific job I'm applying for.",
      stat: "→ Relevance is everything",
    },
    {
      emoji: "😔",
      title: "You've Failed a Final Round Before",
      quote: "I made it to the last stage and froze. I knew I could do the job — I just couldn't prove it under pressure when it counted.",
      stat: "→ Practice beats potential",
    },
  ];

  return (
    <section
      aria-labelledby="problem-heading"
      className="py-16 px-4 sm:px-6 lg:px-8 bg-white"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-primary font-bold text-sm uppercase tracking-wider mb-3">
            The Real Problem
          </p>
          <h2
            id="problem-heading"
            className="text-4xl md:text-5xl font-black mb-4 text-secondary"
          >
            You&apos;re Qualified. Generic Prep Is Letting You Down.
          </h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            The problem isn&apos;t your skills — it&apos;s that you&apos;re practicing the wrong interview for the wrong role.
          </p>
        </div>

        {/* 3 Column Grid */}
        <div className="grid md:grid-cols-3 gap-6 md:gap-6 md:mt-12">
          {problems.map((problem, index) => (
            <div
              key={index}
              className="group bg-white shadow-sm rounded-2xl p-6 border-2 border-transparent hover:border-secondary transition-all duration-300"
            >
              <div className="mb-4 md:mb-0 md:relative md:-top-12">
                <div className="w-24 h-24 rounded-full border-4 bg-white flex items-center justify-center text-5xl border-primary">
                  {problem.emoji}
                </div>
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
