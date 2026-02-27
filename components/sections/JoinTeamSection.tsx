"use client";

import { FC, useState } from "react";
import { Button } from "../ui";
import { ApplySheet, JobRole } from "./ApplySheet";
import { track } from "@/lib/mixpanel";

const roles: JobRole[] = [
  {
    title: "Marketing Manager",
    type: "Remote · Part-time · $200 + Bonus",
    description:
      "Drive growth and build the MyInterview brand. You're a creative marketer who blends compelling storytelling with data-driven strategy.",
    skills: ["Content Marketing", "SEO / SEM", "Growth Strategy"],
    accent: "bg-secondary",
    icon: (
      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
      </svg>
    ),
    fullDescription: {
      about:
        "You'll own MyInterview's marketing from top to bottom — crafting the narrative, growing our audience, and turning curious visitors into loyal users. You'll work closely with the founding team to define positioning, run campaigns, and build a brand that resonates with ambitious job seekers. Compensation: $200 + performance bonus.",
      responsibilities: [
        "Develop and execute a content strategy across blog, social, and email",
        "Own SEO — keyword research, on-page optimization, and link building",
        "Run paid acquisition experiments on Google and social channels",
        "Build and grow our email list with high-converting lead magnets and campaigns",
        "Analyze funnel metrics and iterate on messaging and channels",
        "Collaborate with the team on product launches and feature announcements",
      ],
      requirements: [
        "3+ years of experience in growth or content marketing",
        "Proven track record of driving organic and paid user acquisition",
        "Strong writing skills — you can craft copy that converts",
        "Comfortable with analytics tools (GA4, Mixpanel, or similar)",
        "Self-starter who thrives in a fast-moving, early-stage environment",
      ],
      niceToHave: [
        "Experience marketing a SaaS or consumer product",
        "Familiarity with the tech job market or interview prep space",
        "Basic design skills (Figma, Canva) for creating social and ad assets",
      ],
    },
  },
  {
    title: "Fullstack Developer Intern",
    type: "Remote · Internship · Unpaid",
    description:
      "Get real-world experience building a live product. You'll work across the stack on features that real users depend on — a great launchpad for your career.",
    skills: ["Next.js", "TypeScript", "Supabase"],
    accent: "bg-primary",
    icon: (
      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    fullDescription: {
      about:
        "This is an unpaid internship designed for students or early-career developers who want hands-on experience shipping real features in a fast-moving startup. You'll work directly with the founding team, contribute meaningful code, and walk away with a strong portfolio project and reference.",
      responsibilities: [
        "Build and ship full-stack features using Next.js and Supabase",
        "Write clean TypeScript across both frontend and API layers",
        "Participate in code reviews and product discussions",
        "Tackle bugs, performance improvements, and UI polish",
        "Learn modern startup development practices from day one",
      ],
      requirements: [
        "Currently enrolled in or recently graduated from a CS/software program",
        "Foundational knowledge of React and JavaScript/TypeScript",
        "Eager to learn and comfortable asking questions",
        "Reliable, communicative, and able to commit at least 10 hrs/week",
      ],
      niceToHave: [
        "Any prior exposure to Next.js or Supabase",
        "Personal projects or GitHub contributions to show",
        "Interest in AI, EdTech, or career development tools",
      ],
    },
  },
  // Developer roles — hidden for now
  // {
  //   title: "Frontend Developer",
  //   type: "Remote · Contract",
  //   description:
  //     "Build beautiful, accessible interfaces with Next.js, TypeScript, and Tailwind. You care about pixel-perfect UX and performance.",
  //   skills: ["Next.js", "TypeScript", "Tailwind CSS"],
  //   accent: "bg-primary",
  //   ...
  // },
  // {
  //   title: "Backend Developer",
  //   type: "Remote · Contract",
  //   description:
  //     "Design and build scalable APIs and AI integrations. You're comfortable with Node.js, databases, and real-time systems.",
  //   skills: ["Node.js", "PostgreSQL", "AI APIs"],
  //   accent: "bg-secondary",
  //   ...
  // },
  // {
  //   title: "Fullstack Developer",
  //   type: "Remote · Contract",
  //   description:
  //     "Own features end-to-end — from database schema to polished UI. You thrive in early-stage products and move fast.",
  //   skills: ["Next.js", "Supabase", "TypeScript"],
  //   accent: "bg-primary",
  //   ...
  // },
];

export const JoinTeamSection: FC = () => {
  const [selectedRole, setSelectedRole] = useState<JobRole | null>(null);

  return (
    <>
      <section
        id="join-team"
        aria-labelledby="join-team-heading"
        className="py-24 px-4 sm:px-6 lg:px-8 bg-secondary"
      >
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <p className="text-primary font-bold text-sm uppercase tracking-wider mb-3">
              We&apos;re Hiring
            </p>
            <h2
              id="join-team-heading"
              className="text-4xl md:text-5xl font-black mb-6 text-white"
            >
              Help Us Build MyInterview
            </h2>
            <p className="text-xl text-neutral-300 max-w-2xl mx-auto">
              We&apos;re a small team on a mission to help engineers conquer interview anxiety.
              Join us and build something that actually matters.
            </p>
          </div>

          {/* Role Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 max-w-lg mx-auto md:max-w-3xl" role="list" aria-label="Open positions">
            {roles.map((role, index) => (
              <article
                key={index}
                role="listitem"
                className="group bg-[var(--cream)] rounded-2xl p-8 border-2 border-neutral-700 hover:border-primary transition-all duration-300"
              >
                <div
                  className={`w-14 h-14 ${role.accent} rounded-xl flex items-center justify-center mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]`}
                >
                  {role.icon}
                </div>
                <h3 className="text-xl font-bold text-secondary mb-1">{role.title}</h3>
                <p className="text-xs font-semibold text-primary mb-4 uppercase tracking-wider">
                  {role.type}
                </p>
                <p className="text-neutral-600 text-sm leading-relaxed mb-6">
                  {role.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {role.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 bg-neutral-200 text-neutral-700 rounded-full text-xs font-semibold"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
                <Button
                  variant="outline"
                  className="w-full border-neutral-400 text-secondary hover:bg-neutral-200 shadow-none"
                  onClick={() => { track("CTA Clicked", { button: "Apply Now", location: "join_team", role: role.title }); setSelectedRole(role); }}
                >
                  Apply Now
                </Button>
              </article>
            ))}
          </div>

        </div>
      </section>

      <ApplySheet
        role={selectedRole}
        open={selectedRole !== null}
        onClose={() => setSelectedRole(null)}
      />
    </>
  );
};
