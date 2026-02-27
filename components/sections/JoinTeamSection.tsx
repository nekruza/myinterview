"use client";

import { FC, useRef, useState } from "react";
import { Button } from "../ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { track } from "@/lib/mixpanel";

export const JoinTeamSection: FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = e.currentTarget as HTMLFormElement;
    const name = (form.elements.namedItem("interest-name") as HTMLInputElement).value;
    const email = (form.elements.namedItem("interest-email") as HTMLInputElement).value;
    const file = fileInputRef.current?.files?.[0];
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("role", "General Interest");
      if (file) formData.append("resume", file);

      const res = await fetch("/api/apply", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Failed");
      track("CTA Clicked", { button: "Leave Details", location: "join_team" });
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
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

        {/* No openings card */}
        <div className="max-w-4xl mx-auto bg-[var(--cream)] rounded-2xl border-2 border-neutral-700 p-10">
          {submitted ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-black text-secondary mb-2">You&apos;re on the list!</h3>
              <p className="text-neutral-600 text-sm">
                We&apos;ll reach out as soon as something opens up that might be a great fit for you.
              </p>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row md:items-center gap-10">
              {/* Left — text */}
              <div className="flex-1">
                <div className="w-14 h-14 bg-secondary/10 rounded-xl flex items-center justify-center mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                  <svg className="w-7 h-7 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-black text-secondary mb-3">No openings right now</h3>
                <p className="text-neutral-600 text-sm leading-relaxed">
                  We don&apos;t have any open positions at the moment, but we&apos;re always growing.
                  Leave your details and we&apos;ll get in touch when something comes up that could be a great fit.
                </p>
              </div>

              {/* Divider */}
              <div className="hidden md:block w-px bg-neutral-200 self-stretch" />

              {/* Right — form */}
              <div className="flex-1">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="interest-name">Full Name</Label>
                    <Input id="interest-name" name="interest-name" placeholder="Jane Smith" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="interest-email">Email</Label>
                    <Input id="interest-email" name="interest-email" type="email" placeholder="jane@example.com" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Resume <span className="text-neutral-400 font-normal">(optional)</span></Label>
                    <div
                      className="border-2 border-dashed border-neutral-300 rounded-xl p-4 text-center cursor-pointer hover:border-primary transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
                      />
                      {fileName ? (
                        <div className="flex items-center justify-center gap-2 text-secondary">
                          <svg className="w-4 h-4 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-sm font-semibold truncate">{fileName}</span>
                          <span className="text-xs text-neutral-400 shrink-0">(click to change)</span>
                        </div>
                      ) : (
                        <div>
                          <svg className="w-6 h-6 text-neutral-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          <p className="text-sm text-neutral-500">
                            <span className="font-semibold text-secondary">Click to upload</span> your resume
                          </p>
                          <p className="text-xs text-neutral-400 mt-0.5">PDF, DOC, DOCX up to 5MB</p>
                        </div>
                      )}
                    </div>
                  </div>
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Submitting..." : "Keep Me Posted"}
                  </Button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
