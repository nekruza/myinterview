"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  CheckCircle,
  CheckCircle2,
  Sparkles,
  Brain,
  Users,
  FileText,
  Zap,
  MessageSquare,
  Star,
} from "lucide-react";
import Link from "next/link";
import { VoiceCallView } from "@/components/practice/VoiceCallView";
import { LEVELS, TECH_ROLES } from "@/lib/practice-data";
import type { Phase, Message } from "@/lib/practice-data";
import type { Plan } from "@/lib/session-limits";
import { createClient } from "@/lib/supabase/client";
import { UpgradeModal } from "@/components/UpgradeModal";
import { ResumeUpload } from "@/components/ResumeUpload";

type InterviewType = "technical" | "behavioural";
type JobContextMode = "paste" | "general";

// ─── Main ────────────────────────────────────────────────────────────────────

export default function PracticePage() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [interviewType, setInterviewType] = useState<InterviewType>("technical");
  const [jobContextMode, setJobContextMode] = useState<JobContextMode>("paste");
  const [jobDescription, setJobDescription] = useState("");
  const [role, setRole] = useState("general");
  const [customRole, setCustomRole] = useState("");
  const [level, setLevel] = useState("mid");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionDuration, setSessionDuration] = useState<string>("00:00");
  const [sessionQuestionCount, setSessionQuestionCount] = useState(0);
  const [feedbackData, setFeedbackData] = useState<{ score: number; improvements: { point: string; example: string }[] } | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  // User feedback dialog
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackCategory, setFeedbackCategory] = useState<"bug" | "suggestion" | "other">("suggestion");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Usage / plan
  const [plan, setPlan] = useState<Plan>("free");
  const [sessionsUsed, setSessionsUsed] = useState(0);
  const [showUpgrade, setShowUpgrade] = useState(false);

  // Resume
  const [hasResume, setHasResume] = useState<boolean | null>(null);
  const [resumeText, setResumeText] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function checkProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: profile }, { data: subscription }] = await Promise.all([
        supabase.from("profiles").select("resume_url, resume_text, practice_sessions_used, experience_level, interview_style, target_role").eq("id", user.id).single(),
        supabase.from("subscriptions").select("plan").eq("user_id", user.id).single(),
      ]);

      setHasResume(!!profile?.resume_url);
      setResumeText(profile?.resume_text ?? null);
      setSessionsUsed(profile?.practice_sessions_used ?? 0);
      setPlan((subscription?.plan as Plan) ?? "free");

      // Preset from onboarding preferences
      if (profile?.experience_level) {
        // "student" from onboarding has no direct match — treat as junior
        setLevel(profile.experience_level === "student" ? "junior" : profile.experience_level);
      }
      if (profile?.target_role) {
        const isKnown = TECH_ROLES.some((r) => r.value === profile.target_role);
        if (isKnown) {
          setRole(profile.target_role);
        } else {
          setRole("other");
          setCustomRole(profile.target_role);
        }
      }
      if (profile?.interview_style) {
        // Map onboarding style values to practice page InterviewType
        if (profile.interview_style === "technical") setInterviewType("technical");
        else if (profile.interview_style === "behavioral") setInterviewType("behavioural");
        // "mixed" and "case" leave the default
      }
    }
    checkProfile();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


  const submitUserFeedback = async () => {
    if (!feedbackMessage.trim() && feedbackRating === 0) return;
    setFeedbackSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("user_feedback").insert({
        user_id: user?.id ?? null,
        session_id: sessionId ?? null,
        rating: feedbackRating || null,
        message: feedbackMessage.trim() || null,
        category: feedbackCategory,
      });
      setFeedbackSubmitted(true);
    } catch {
      toast.error("Could not submit feedback. Please try again.");
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const getJobContext = () => {
    if (jobContextMode === "paste" && jobDescription.trim()) return { mode: "paste" as const, value: jobDescription.trim() };
    return { mode: "general" as const, value: "" };
  };

  const startSession = async () => {
    if (plan === "free" && sessionsUsed >= 3) {
      setShowUpgrade(true);
      return;
    }

    const jobContext = getJobContext();

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: `${interviewType} interview practice`,
          category: interviewType,
          interviewType,
          jobContext,
        }),
      });
      const data = await res.json();
      if (res.status === 403 && data.error === "limit_reached") {
        setShowUpgrade(true);
        return;
      }
      if (!res.ok) throw new Error(data.error);
      setSessionsUsed((prev) => prev + 1);
      setSessionId(data.sessionId);
      setPhase("chat");
    } catch {
      toast.error("Could not start session. Please try again.");
    }
  };

  const completeSession = async (msgs: Message[], duration: string) => {
    if (!sessionId) return;

    // Show complete screen immediately
    setSessionDuration(duration);
    setSessionQuestionCount(msgs.filter((m) => m.role === "assistant").length);
    setPhase("complete");

    // Fetch AI feedback in background
    setFeedbackLoading(true);
    try {
      const res = await fetch("/api/ai/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: msgs,
          interviewType,
          level,
          role: role === "other" ? customRole.trim() : role,
          resumeText: resumeText ?? undefined,
          jobContext: getJobContext(),
        }),
      });
      const data = await res.json();
      setFeedbackData(data);

      await fetch("/api/sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          score: data.score,
          feedback: data.improvements.map((imp: { point: string; example: string }) => `${imp.point}\n${imp.example}`).join("\n\n"),
          competencyScores: [{ competency: interviewType, score: data.score }],
        }),
      });
      toast.success("Session saved!");
    } catch {
      await fetch("/api/sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          score: null,
          feedback: null,
          competencyScores: [],
        }),
      });
      toast.success("Session saved!");
    } finally {
      setFeedbackLoading(false);
    }
  };

  // Derived tip states
  const hasJobContext = jobContextMode === "paste" && jobDescription.trim().length > 0;

  // ── Render: Setup ──
  if (phase === "setup") {
    return (
      <div className="max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-secondary">AI Practice</h1>
            <p className="text-neutral-500 text-sm mt-0.5">
              Practice interview questions with your AI coach
            </p>
          </div>
        </div>

        <div className="flex gap-6 items-start">
          {/* ── Left: Form ── */}
          <div className="flex-1 min-w-0 space-y-5">
            {/* Interview Type */}
            <div className="glass-card rounded-2xl p-6">
              <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-3">
                1. Interview Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setInterviewType("technical")}
                  className="flex items-center gap-3 p-4 rounded-xl border-2 transition text-left"
                  style={{
                    borderColor: interviewType === "technical" ? "#2dec29" : "transparent",
                    background: interviewType === "technical" ? "#f4fdf3" : "#f9fafb",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: interviewType === "technical" ? "#2dec29" : "#e5e7eb",
                    }}
                  >
                    <Brain
                      className="w-5 h-5"
                      style={{
                        color: interviewType === "technical" ? "#112715" : "#6b7280",
                      }}
                    />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-secondary block">
                      Technical
                    </span>
                    <span className="text-xs text-neutral-400">
                      System design, coding, architecture
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => setInterviewType("behavioural")}
                  className="flex items-center gap-3 p-4 rounded-xl border-2 transition text-left"
                  style={{
                    borderColor: interviewType === "behavioural" ? "#2dec29" : "transparent",
                    background: interviewType === "behavioural" ? "#f4fdf3" : "#f9fafb",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: interviewType === "behavioural" ? "#2dec29" : "#e5e7eb",
                    }}
                  >
                    <Users
                      className="w-5 h-5"
                      style={{
                        color: interviewType === "behavioural" ? "#112715" : "#6b7280",
                      }}
                    />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-secondary block">
                      Behavioural
                    </span>
                    <span className="text-xs text-neutral-400">
                      Leadership, teamwork, conflict
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Target Role */}
            <div className="glass-card rounded-2xl p-6">
              <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-3">
                2. Target Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm text-secondary bg-neutral-50 focus:outline-none focus:border-[#2dec29] focus:ring-1 focus:ring-[#2dec29] transition appearance-none cursor-pointer"
              >
                {TECH_ROLES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              {role === "other" && (
                <input
                  type="text"
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  placeholder="e.g. Game Developer, AR/VR Engineer..."
                  className="mt-3 w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm text-secondary placeholder:text-neutral-300 focus:outline-none focus:border-[#2dec29] focus:ring-1 focus:ring-[#2dec29] transition"
                />
              )}
            </div>

            {/* Job Context */}
            <div className="glass-card rounded-2xl p-6">
              <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-3">
                3. Job Context
              </label>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  onClick={() => setJobContextMode("general")}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition"
                  style={{
                    borderColor: jobContextMode === "general" ? "#2dec29" : "transparent",
                    background: jobContextMode === "general" ? "#f4fdf3" : "#f9fafb",
                  }}
                >
                  <Zap
                    className="w-4 h-4"
                    style={{
                      color: jobContextMode === "general" ? "#112715" : "#6b7280",
                    }}
                  />
                  <span
                    className="text-xs font-medium"
                    style={{
                      color: jobContextMode === "general" ? "#112715" : "#6b7280",
                    }}
                  >
                    General
                  </span>
                </button>
                <button
                  onClick={() => setJobContextMode("paste")}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition"
                  style={{
                    borderColor: jobContextMode === "paste" ? "#2dec29" : "transparent",
                    background: jobContextMode === "paste" ? "#f4fdf3" : "#f9fafb",
                  }}
                >
                  <FileText
                    className="w-4 h-4"
                    style={{
                      color: jobContextMode === "paste" ? "#112715" : "#6b7280",
                    }}
                  />
                  <span
                    className="text-xs font-medium"
                    style={{
                      color: jobContextMode === "paste" ? "#112715" : "#6b7280",
                    }}
                  >
                    Paste Job Description
                  </span>
                </button>
              </div>

              {jobContextMode === "paste" && (
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here..."
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-sm text-secondary placeholder:text-neutral-300 focus:outline-none focus:border-[#2dec29] focus:ring-1 focus:ring-[#2dec29] transition resize-none"
                />
              )}

              {jobContextMode === "general" && (
                <p className="text-xs text-neutral-400 px-1">
                  Practice with general {interviewType} interview questions — no specific job context needed.
                </p>
              )}
            </div>

            {/* Resume — always shown once loaded */}
            {hasResume !== null && (
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide">
                    4. Your Resume
                  </label>
                  <span className="text-xs text-neutral-400 font-medium px-2 py-0.5 rounded-full bg-neutral-100">
                    Optional
                  </span>
                </div>

                {hasResume !== null && (
                  <ResumeUpload
                    initialFileName={hasResume ? "resume on file" : null}
                    onUploadSuccess={() => setHasResume(true)}
                    onDeleteSuccess={() => setHasResume(false)}
                  />
                )}
              </div>
            )}

            {/* Level + Confidence */}
            <div className="glass-card rounded-2xl p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-3">
                  5. Your Experience Level
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {LEVELS.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setLevel(value)}
                      className="p-2.5 rounded-xl border text-xs font-medium transition"
                      style={{
                        borderColor: level === value ? "#2dec29" : "transparent",
                        background: level === value ? "#f4fdf3" : "#f9fafb",
                        color: level === value ? "#112715" : "#6b7280",
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

            </div>

          </div>

          {/* ── Right: Tips panel ── */}
          <div className="w-64 shrink-0 hidden lg:block space-y-4">
            <div className="glass-card rounded-2xl p-5">
              <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-3">
                Get a tailored interview
              </p>
              <div className="space-y-3">
                {/* Job description tip */}
                <div className="flex gap-3">
                  <div className="shrink-0 mt-0.5">
                    {hasJobContext ? (
                      <CheckCircle2 className="w-4 h-4" style={{ color: "#2dec29" }} />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-neutral-300" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-secondary">
                      Add a job description
                    </p>
                    <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                      Paste or link the JD so the AI asks questions relevant to the role.
                    </p>
                  </div>
                </div>

                {/* Resume tip */}
                <div className="flex gap-3">
                  <div className="shrink-0 mt-0.5">
                    {hasResume ? (
                      <CheckCircle2 className="w-4 h-4" style={{ color: "#2dec29" }} />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-neutral-300" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-secondary">
                      Upload your resume
                    </p>
                    <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                      The AI will tailor questions to your actual experience and background.
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              {(() => {
                const done = [hasJobContext, hasResume].filter(Boolean).length;
                return done < 2 ? (
                  <div className="mt-4 pt-4 border-t border-neutral-100">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-neutral-400">Personalisation</span>
                      <span className="text-xs font-semibold text-secondary">{done}/2</span>
                    </div>
                    <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${(done / 2) * 100}%`, background: "#2dec29" }}
                      />
                    </div>
                  </div>
                ) : null;
              })()}
            </div>

            <div className="rounded-2xl p-5" style={{ background: "#f4fdf3" }}>
              <p className="text-xs font-semibold mb-2" style={{ color: "#112715" }}>
                Why it matters
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "#1a3d20" }}>
                Without context, you get generic questions. With your resume and the job description, the AI acts like a real interviewer who has read your application.
              </p>
            </div>
          </div>
        </div>

      {/* ── Sticky Start Button ── */}
      <div className="sticky bottom-16 md:bottom-0 -mx-4 sm:-mx-6 md:-mb-8 px-4 sm:px-6 py-4 mt-6 border-t border-neutral-100" style={{ background: "rgba(250,249,246,0.97)", backdropFilter: "blur(8px)" }}>
        {plan === "free" && (
          <p className="text-center text-xs text-neutral-400 mb-2">
            {sessionsUsed >= 3 ? (
              <span className="text-amber-600 font-medium">Free limit reached — upgrade for unlimited sessions</span>
            ) : (
              <span>{3 - sessionsUsed} free session{3 - sessionsUsed !== 1 ? "s" : ""} remaining</span>
            )}
          </p>
        )}
        <button
          onClick={startSession}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold transition-all duration-100 shadow-[4px_4px_0px_0px_#1A1A1A] hover:brightness-95 active:translate-y-1 active:shadow-[2px_2px_0px_0px_#1A1A1A]"
          style={{ background: "#2dec29", color: "#112715" }}
        >
          <Sparkles className="w-4 h-4" />
          {plan === "free" && sessionsUsed >= 3 ? "Upgrade to Continue" : "Start Voice Practice"}
        </button>
      </div>

      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        reason="practice_limit"
      />
    </div>
    );
  }

  // ── Render: Voice Call ──
  if (phase === "chat") {
    const jobContext = getJobContext();
    return (
      <VoiceCallView
        selectedCategory={{ id: interviewType, label: interviewType === "technical" ? "Technical Interview" : "Behavioural Interview", color: interviewType === "technical" ? "#06b6d4" : "#8b5cf6" }}
        selectedQuestion={`${interviewType} interview practice`}
        level={level}
        role={role === "other" ? customRole.trim() : role}
        sessionId={sessionId}
        interviewType={interviewType}
        jobContext={jobContext}
        resumeText={resumeText ?? undefined}
        onComplete={(msgs, duration) => completeSession(msgs, duration)}
        onReset={() => {
          setPhase("setup");
          setSessionId(null);
        }}
      />
    );
  }

  // ── Render: Complete ──

  function getGrade(score: number) {
    if (score >= 90) return { label: "A", color: "#2dec29" };
    if (score >= 80) return { label: "B+", color: "#2dec29" };
    if (score >= 70) return { label: "B", color: "#84cc16" };
    if (score >= 60) return { label: "C+", color: "#f59e0b" };
    if (score >= 50) return { label: "C", color: "#f59e0b" };
    return { label: "D", color: "#ef4444" };
  }

  return (
    <div className="max-w-2xl mx-auto py-12 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
          style={{ background: "#f4fdf3" }}
        >
          <CheckCircle className="w-8 h-8" style={{ color: "#2dec29" }} />
        </div>
        <h1 className="text-2xl font-bold text-secondary">Session Complete!</h1>
        <p className="text-sm text-neutral-500">
          {interviewType === "technical" ? "Technical" : "Behavioural"} Interview
          {sessionDuration !== "00:00" && ` · ${sessionDuration}`}
          {sessionQuestionCount > 0 && ` · ${sessionQuestionCount} question${sessionQuestionCount !== 1 ? "s" : ""}`}
        </p>
      </div>

      {/* Performance Score card */}
      <div className="glass-card rounded-2xl p-6">
        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-4">
          Performance Score
        </p>
        {feedbackLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="flex items-end justify-between">
              <div className="h-10 w-20 bg-neutral-100 rounded-xl" />
              <div className="h-7 w-14 bg-neutral-100 rounded-lg" />
            </div>
            <div className="h-2.5 bg-neutral-100 rounded-full" />
          </div>
        ) : feedbackData ? (
          <>
            <div className="flex items-end justify-between mb-3">
              <p className="text-4xl font-bold text-secondary">{feedbackData.score}%</p>
              <span
                className="text-sm font-bold px-3 py-1 rounded-lg"
                style={{
                  background: `${getGrade(feedbackData.score).color}22`,
                  color: getGrade(feedbackData.score).color,
                }}
              >
                {getGrade(feedbackData.score).label}
              </span>
            </div>
            <div className="h-2.5 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${feedbackData.score}%`, background: "#2dec29" }}
              />
            </div>
          </>
        ) : (
          <p className="text-sm text-neutral-400">Score unavailable</p>
        )}
      </div>

      {/* Improvements section */}
      {(feedbackLoading || (feedbackData && feedbackData.improvements.length > 0)) && (
        <div className="glass-card rounded-2xl p-6">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-4">
            What to improve
          </p>
          {feedbackLoading ? (
            <div className="space-y-5 animate-pulse">
              {[0, 1, 2].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-neutral-100 rounded" style={{ width: `${[85, 70, 78][i]}%` }} />
                  <div className="h-3 bg-neutral-50 rounded" style={{ width: `${[95, 88, 92][i]}%` }} />
                  <div className="h-3 bg-neutral-50 rounded" style={{ width: `${[60, 75, 55][i]}%` }} />
                </div>
              ))}
            </div>
          ) : (
            <ul className="space-y-5">
              {feedbackData!.improvements.map((item, i) => (
                <li key={i} className="space-y-1.5">
                  <div className="flex items-start gap-2 text-sm font-medium text-neutral-800">
                    <span className="shrink-0 mt-0.5" style={{ color: "#2dec29" }}>›</span>
                    {item.point}
                  </div>
                  {item.example && (
                    <p
                      className="text-xs leading-relaxed pl-4 py-2 px-3 rounded-lg border-l-2"
                      style={{
                        borderColor: "#2dec29",
                        background: "#f4fdf3",
                        color: "#1a3d20",
                      }}
                    >
                      {item.example}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* CTA buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={() => {
            setPhase("setup");
            setSessionId(null);
            setSessionDuration("00:00");
            setSessionQuestionCount(0);
            setFeedbackData(null);
            setFeedbackLoading(false);
          }}
          className="px-6 py-2.5 rounded-2xl font-bold text-sm transition-all duration-100 shadow-[4px_4px_0px_0px_#1A1A1A] hover:brightness-95 active:translate-y-1 active:shadow-[2px_2px_0px_0px_#1A1A1A]"
          style={{ background: "#2dec29", color: "#112715" }}
        >
          Practice Again
        </button>
        <Link
          href="/app/progress"
          className="px-6 py-2.5 rounded-xl font-semibold text-sm border border-neutral-200 text-secondary hover:bg-neutral-50 transition"
        >
          View Progress
        </Link>
        <button
          onClick={() => { setShowFeedbackDialog(true); setFeedbackSubmitted(false); }}
          className="px-6 py-2.5 rounded-xl font-semibold text-sm border border-neutral-200 text-secondary hover:bg-neutral-50 transition flex items-center gap-2"
        >
          <MessageSquare className="w-4 h-4" />
          Feedback
        </button>
      </div>

      {/* Feedback Dialog */}
      {showFeedbackDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowFeedbackDialog(false); }}
        >
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            {feedbackSubmitted ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto" style={{ background: "#f4fdf3" }}>
                  <CheckCircle className="w-6 h-6" style={{ color: "#2dec29" }} />
                </div>
                <p className="font-bold text-secondary text-lg">Thanks for your feedback!</p>
                <p className="text-sm text-neutral-500">We read every submission and use it to improve.</p>
                <button
                  onClick={() => setShowFeedbackDialog(false)}
                  className="mt-2 px-5 py-2 rounded-xl text-sm font-semibold border border-neutral-200 text-secondary hover:bg-neutral-50 transition"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-bold text-secondary">Share your feedback</h2>
                  <button onClick={() => setShowFeedbackDialog(false)} className="text-neutral-400 hover:text-neutral-600 transition text-xl leading-none">&times;</button>
                </div>

                {/* Rating */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">How was your session?</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} onClick={() => setFeedbackRating(star)}>
                        <Star
                          className="w-7 h-7 transition"
                          style={{ color: star <= feedbackRating ? "#f59e0b" : "#e5e7eb", fill: star <= feedbackRating ? "#f59e0b" : "none" }}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Type</p>
                  <div className="flex gap-2">
                    {(["suggestion", "bug", "other"] as const).map((c) => (
                      <button
                        key={c}
                        onClick={() => setFeedbackCategory(c)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium border transition capitalize"
                        style={{
                          borderColor: feedbackCategory === c ? "#2dec29" : "transparent",
                          background: feedbackCategory === c ? "#f4fdf3" : "#f9fafb",
                          color: feedbackCategory === c ? "#112715" : "#6b7280",
                        }}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div className="mb-5">
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Message</p>
                  <textarea
                    value={feedbackMessage}
                    onChange={(e) => setFeedbackMessage(e.target.value)}
                    placeholder="Tell us what you think, what's broken, or what you'd love to see..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-sm text-secondary placeholder:text-neutral-300 focus:outline-none focus:border-[#2dec29] focus:ring-1 focus:ring-[#2dec29] transition resize-none"
                  />
                </div>

                <button
                  onClick={submitUserFeedback}
                  disabled={feedbackSubmitting || (!feedbackMessage.trim() && feedbackRating === 0)}
                  className="w-full py-2.5 rounded-xl font-bold text-sm transition disabled:opacity-40"
                  style={{ background: "#2dec29", color: "#112715" }}
                >
                  {feedbackSubmitting ? "Submitting..." : "Submit Feedback"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
