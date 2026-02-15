"use client";

import { FC, useState } from "react";
import { Button } from "../ui";
import { ApplySheet, JobRole } from "./ApplySheet";
import { track } from "@/lib/mixpanel";

const roles: JobRole[] = [
  {
    title: "Frontend Developer",
    type: "Remote · Contract",
    description:
      "Build beautiful, accessible interfaces with Next.js, TypeScript, and Tailwind. You care about pixel-perfect UX and performance.",
    skills: ["Next.js", "TypeScript", "Tailwind CSS"],
    accent: "bg-primary",
    icon: (
      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    fullDescription: {
      about:
        "You'll work directly with the founding team to craft the user-facing product — from landing pages to the core interview practice UI. We move fast, care about craft, and ship real things to real users.",
      responsibilities: [
        "Build and iterate on UI components using Next.js 15 and Tailwind CSS",
        "Implement animations, transitions, and micro-interactions",
        "Collaborate with design to translate Figma mocks into pixel-perfect code",
        "Own performance, accessibility, and responsive design across the app",
        "Participate in product discussions and contribute ideas",
      ],
      requirements: [
        "3+ years of experience with React and TypeScript",
        "Strong command of Tailwind CSS and modern CSS",
        "Familiarity with Next.js App Router and RSC patterns",
        "Attention to detail and a strong design sensibility",
        "Comfortable working async in a remote-first environment",
      ],
      niceToHave: [
        "Experience with Framer Motion or similar animation libraries",
        "Familiarity with shadcn/ui and Radix primitives",
        "Background in design or design systems",
      ],
    },
  },
  {
    title: "Backend Developer",
    type: "Remote · Contract",
    description:
      "Design and build scalable APIs and AI integrations. You're comfortable with Node.js, databases, and real-time systems.",
    skills: ["Node.js", "PostgreSQL", "AI APIs"],
    accent: "bg-secondary",
    icon: (
      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
      </svg>
    ),
    fullDescription: {
      about:
        "You'll architect and build the server-side systems that power MyInterview — from AI interview sessions to peer matching and progress tracking. You'll work with modern cloud infrastructure and integrate with LLM providers.",
      responsibilities: [
        "Design and build REST and real-time APIs for the interview practice platform",
        "Integrate with AI providers (OpenAI, Anthropic) for interview simulation",
        "Build and optimize PostgreSQL schemas and queries via Supabase",
        "Implement authentication, authorization, and user management",
        "Ensure backend reliability, observability, and security",
      ],
      requirements: [
        "3+ years of backend development experience",
        "Strong knowledge of Node.js and TypeScript",
        "Experience with PostgreSQL and SQL query optimization",
        "Familiarity with Supabase or Firebase",
        "Understanding of RESTful API design and WebSockets",
      ],
      niceToHave: [
        "Experience integrating LLM APIs in production",
        "Familiarity with edge functions and serverless architectures",
        "Prior work on real-time or streaming applications",
      ],
    },
  },
  {
    title: "Fullstack Developer",
    type: "Remote · Contract",
    description:
      "Own features end-to-end — from database schema to polished UI. You thrive in early-stage products and move fast.",
    skills: ["Next.js", "Supabase", "TypeScript"],
    accent: "bg-primary",
    icon: (
      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    fullDescription: {
      about:
        "As a fullstack developer, you'll own complete features from API to interface. You'll be one of the first engineers on the team, which means your decisions will shape the product architecture and codebase culture.",
      responsibilities: [
        "Ship complete features across the stack — database, API, and UI",
        "Work with Next.js App Router and Supabase as the primary stack",
        "Build the peer matching system, session scheduling, and progress tracking",
        "Write clean, maintainable TypeScript code with good test coverage",
        "Contribute to architecture decisions and engineering culture",
      ],
      requirements: [
        "4+ years of fullstack development experience",
        "Strong proficiency in TypeScript, React, and Node.js",
        "Experience with Supabase or similar BaaS platforms",
        "Comfortable owning features from design to deployment",
        "Self-directed with strong communication skills",
      ],
      niceToHave: [
        "Experience building products at early-stage startups",
        "Familiarity with AI/LLM integrations",
        "Contributions to open-source projects",
      ],
    },
  },
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
          <div className="grid md:grid-cols-3 gap-6 mb-12" role="list" aria-label="Open positions">
            {roles.map((role, index) => (
              <article
                key={index}
                role="listitem"
                className="group bg-neutral-800 rounded-2xl p-8 border-2 border-neutral-700 hover:border-primary transition-all duration-300"
              >
                <div
                  className={`w-14 h-14 ${role.accent} rounded-xl flex items-center justify-center mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]`}
                >
                  {role.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{role.title}</h3>
                <p className="text-xs font-semibold text-primary mb-4 uppercase tracking-wider">
                  {role.type}
                </p>
                <p className="text-neutral-300 text-sm leading-relaxed mb-6">
                  {role.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {role.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 bg-neutral-700 text-neutral-200 rounded-full text-xs font-semibold"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
                <Button
                  variant="outline"
                  className="w-full border-neutral-500 text-white hover:bg-neutral-700 shadow-none"
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
