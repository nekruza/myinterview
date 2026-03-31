"use client";

import { FC, useState } from "react";
import { Code2, Server } from "lucide-react";
import { ApplySheet, JobRole } from "@/components/sections/ApplySheet";
import { track } from "@/lib/mixpanel";

const VOLUNTEER_ROLE: JobRole = {
  title: "Frontend / Backend Software Engineer (Volunteering)",
  type: "Volunteer · Remote · ~1 hr/week",
  skills: ["React", "Next.js", "TypeScript", "Node.js"],
  description:
    "Help us test, improve, and grow an AI-driven platform that helps people conquer interview anxiety.",
  accent: "#2dec29",
  fullDescription: {
    about:
      "MyInterview helps individuals overcome interview anxiety through AI-driven practice tools. This is a volunteer opportunity for engineers who want to contribute to a growing platform, gain hands-on experience, and make a meaningful impact.<br/><br/>🎁 <strong>In return, selected volunteers receive a free monthly MyInterview subscription</strong> — giving you full access to the platform you're helping build.",
    responsibilities: [
      "Test the app and report bugs with clear reproduction steps",
      "Suggest improvements to enhance user experience",
      "Provide feedback on new features before they ship",
    ],
    requirements: [
      "Some experience with frontend or backend development",
      "Genuine interest in helping people succeed in their careers",
    ],
    niceToHave: [],
  },
};

export const JoinTeamSection: FC = () => {
  const [sheetOpen, setSheetOpen] = useState(false);

  function handleApplyClick() {
    track("CTA Clicked", { button: "Apply Now", location: "join_team" });
    setSheetOpen(true);
  }

  return (
    <section
      id="join-team"
      aria-labelledby="join-team-heading"
      className="py-24 px-4 sm:px-6 lg:px-8 bg-secondary"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-primary font-bold text-sm uppercase tracking-wider mb-3">
            Join the Team
          </p>
          <h2
            id="join-team-heading"
            className="text-4xl md:text-5xl font-black mb-6 text-white"
          >
            Help Us Build MyInterview
          </h2>
          <p className="text-xl text-neutral-300 max-w-2xl mx-auto">
            We&apos;re a small team on a mission to help people conquer interview anxiety
            and land their dream jobs.
          </p>
        </div>

        {/* Job card */}
        <div className="max-w-4xl mx-auto bg-[var(--cream)] rounded-2xl border-2 border-neutral-700 overflow-hidden">
          {/* Card header */}
          <div className="bg-secondary px-8 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "#2dec29" }}
              >
                <Code2 className="w-6 h-6" style={{ color: "#112715" }} />
              </div>
              <div>
                <p className="text-white font-black text-lg leading-tight">
                  {VOLUNTEER_ROLE.title}
                </p>
                <p className="text-neutral-400 text-sm mt-0.5">{VOLUNTEER_ROLE.type}</p>
              </div>
            </div>
            <span
              className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold"
              style={{ background: "#2dec2922", color: "#2dec29" }}
            >
              Now Accepting Applications
            </span>
          </div>

          {/* Card body */}
          <div className="px-8 py-6 flex flex-col md:flex-row md:items-start gap-8">
            {/* Left — details */}
            <div className="flex-1 space-y-5">
              <p className="text-neutral-600 text-sm leading-relaxed">
                Help test, improve, and shape a platform that helps thousands of people
                overcome interview anxiety. You&apos;ll work alongside a passionate small
                team and make a real impact on a product designed to support others.
              </p>

              <div className="flex flex-wrap gap-2">
                {VOLUNTEER_ROLE.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 bg-secondary/8 text-secondary rounded-full text-xs font-semibold border border-secondary/10"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              {/* Perks */}
              <div className="flex items-start gap-3 rounded-xl px-4 py-3 bg-primary/8 border border-primary/20">
                <Server className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                <p className="text-sm text-secondary font-medium">
                  Selected volunteers receive a <span className="font-bold">free monthly subscription</span> to MyInterview in return for their contribution.
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px bg-neutral-200 self-stretch" />

            {/* Right — CTA */}
            <div className="flex flex-col justify-center items-start md:items-center gap-3 md:min-w-[160px]">
              <button
                onClick={handleApplyClick}
                className="w-full md:w-auto px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-100 shadow-[4px_4px_0px_0px_#1A1A1A] hover:brightness-95 active:translate-y-1 active:shadow-[2px_2px_0px_0px_#1A1A1A]"
                style={{ background: "#2dec29", color: "#112715" }}
              >
                Apply Now
              </button>
              <p className="text-xs text-neutral-400 text-center">
                Volunteer · Remote · ~1 hr/week
              </p>
            </div>
          </div>
        </div>
      </div>

      <ApplySheet
        role={VOLUNTEER_ROLE}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </section>
  );
};
