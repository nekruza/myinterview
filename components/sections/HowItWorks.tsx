import { FC } from "react";

export const HowItWorks: FC = () => {
  const steps = [
    {
      number: "1",
      icon: (
        <svg className="w-7 h-7 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
      ),
      title: "Tell us your interview goals",
      description: "Share your target companies, role level, and what makes you anxious",
    },
    {
      number: "2",
      icon: (
        <svg className="w-7 h-7 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
      ),
      title: "Practice with AI instantly",
      description: "Get real-time feedback on behavioral & technical questions 24/7",
    },
    {
      number: "3",
      icon: (
        <svg className="w-7 h-7 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      title: "Track your progress",
      description: "Watch your confidence scores climb as you practice more",
    },
  ];

  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
      className="py-24 px-4 sm:px-6 lg:px-8 bg-white"
    >
      <div className="max-w-6xl mx-auto">
        {/* Hidden heading for screen readers and SEO */}
        <h2 id="how-it-works-heading" className="sr-only">
          How MyInterview Works — 3 Steps to Interview Confidence
        </h2>
        {/* 3 Steps Box */}
        <div className="border-4 border-primary rounded-3xl p-8 md:p-12 bg-cream">
          <ol className="grid md:grid-cols-3 gap-8" aria-label="Steps to get started">
            {steps.map((step) => (
              <li key={step.number} className="flex flex-col items-start">
                <div className="flex items-center mb-4">
                  <span className="text-3xl font-black text-secondary mr-3" aria-hidden="true">
                    {step.number}.
                  </span>
                  <div className="w-12 h-12 bg-cream-dark rounded-xl flex items-center justify-center" aria-hidden="true">
                    {step.icon}
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2 text-secondary">
                  {step.title}
                </h3>
                <p className="text-neutral-700 leading-relaxed">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
};
