import { FC } from "react";

const PROBLEMS = [
  {
    number: "01",
    title: "Every job wants 2+ years of experience.",
    quote: "I have a first-class degree and two personal projects on GitHub. Every application comes back the same: 'We're looking for someone with commercial experience.'",
    label: "The catch-22",
    color: "#f87171",
  },
  {
    number: "02",
    title: "Side projects don't count as experience.",
    quote: "I built a full-stack app with 300 users, but hiring managers don't treat it the same as a job. They want to see that someone trusted me with a real codebase.",
    label: "The credibility gap",
    color: "#fb923c",
  },
  {
    number: "03",
    title: "You get filtered before anyone reads your CV.",
    quote: "I don't even get rejections. My applications just disappear. Six months of applying and I've had three first rounds — none of which led anywhere.",
    label: "The invisible wall",
    color: "#facc15",
  },
];

export const ProblemStatement: FC = () => {
  return (
    <section
      aria-labelledby="problem-heading"
      className="py-24 px-4 sm:px-6 lg:px-8"
      style={{ background: "linear-gradient(to bottom, #f8fdf8 0%, #ffffff 100%)" }}
    >
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="scroll-reveal max-w-2xl mb-14">
          <p className="font-bold text-sm uppercase tracking-widest mb-3" style={{ color: "#2dec29" }}>
            The Problem
          </p>
          <h2
            id="problem-heading"
            className="text-4xl md:text-5xl font-black leading-[1.06] mb-5"
            style={{ color: "#112715" }}
          >
            You can code.<br />
            You just can&apos;t{" "}
            <span
              style={{
                textDecoration: "underline",
                textDecorationColor: "rgba(248,113,113,0.5)",
                textUnderlineOffset: "5px",
              }}
            >
              prove it yet.
            </span>
          </h2>
          <p className="text-lg leading-relaxed" style={{ color: "#6b7280" }}>
            The barrier isn&apos;t your ability — it&apos;s the three walls every new graduate hits
            before anyone gives them a chance.
          </p>
        </div>

        {/* Problem cards */}
        <div className="grid md:grid-cols-3 gap-5">
          {PROBLEMS.map((p, i) => (
            <div
              key={p.number}
              className="scroll-reveal relative rounded-2xl p-7 flex flex-col overflow-hidden"
              style={{
                background: "linear-gradient(145deg, #071a09 0%, #0d2410 60%, #061508 100%)",
                border: "1px solid rgba(255,255,255,0.07)",
                transitionDelay: `${i * 0.12}s`,
              }}
            >
              {/* Number watermark */}
              <span
                className="absolute top-5 right-6 font-black opacity-10 select-none leading-none"
                style={{ fontSize: "4rem", color: p.color }}
              >
                {p.number}
              </span>

              {/* Label pill */}
              <span
                className="self-start text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-5"
                style={{
                  background: `${p.color}18`,
                  color: p.color,
                  border: `1px solid ${p.color}30`,
                }}
              >
                {p.label}
              </span>

              {/* Title */}
              <h3 className="font-black text-lg text-white leading-snug mb-4">
                {p.title}
              </h3>

              {/* Quote */}
              <blockquote
                className="text-sm leading-relaxed mt-auto"
                style={{
                  color: "rgba(255,255,255,0.42)",
                  borderLeft: `2px solid ${p.color}40`,
                  paddingLeft: "1rem",
                }}
              >
                &ldquo;{p.quote}&rdquo;
              </blockquote>
            </div>
          ))}
        </div>

        {/* Bridge line */}
        <div className="mt-12 flex items-center gap-4">
          <div className="flex-1 h-px" style={{ background: "rgba(17,39,21,0.08)" }} />
          <p className="text-sm font-semibold text-center px-4" style={{ color: "#112715" }}>
            This is the problem MyInterview was built to solve.
          </p>
          <div className="flex-1 h-px" style={{ background: "rgba(17,39,21,0.08)" }} />
        </div>

      </div>
    </section>
  );
};
