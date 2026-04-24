"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  CheckCircle,
  CheckCircle2,
  Sparkles,
  Brain,
  Users,
  Briefcase,
  FileText,
  Zap,
  MessageSquare,
  Star,
} from "lucide-react";
import Link from "next/link";
import { VoiceCallView } from "@/components/practice/VoiceCallView";
import { LEVELS } from "@/lib/practice-data";
import type { Phase, Message } from "@/lib/practice-data";
import { createClient } from "@/lib/supabase/client";
import { UpgradeModal } from "@/components/UpgradeModal";
import { ResumeUpload } from "@/components/ResumeUpload";
import { track } from "@/lib/mixpanel";

type InterviewType = "technical" | "behavioural" | "case";
type JobContextMode = "paste" | "general";

interface DetailedFeedback {
  company: string;
  role: string;
  interviewType: string;
  verdict: string;
  score: number;
  summary: string;
  categories: Array<{ name: string; score: number; comment: string }>;
  strengths: string[];
  improvements: string[];
  tips: string[];
  questions: Array<{ question: string; score: number; answer: string; feedback: string }>;
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function PracticePage() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [interviewType, setInterviewType] = useState<InterviewType>("technical");
  const [jobContextMode, setJobContextMode] = useState<JobContextMode>("paste");
  const [jobDescription, setJobDescription] = useState("");
  const [role, setRole] = useState("");
  const [level, setLevel] = useState("mid");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionDuration, setSessionDuration] = useState<string>("00:00");
  const [sessionQuestionCount, setSessionQuestionCount] = useState(0);
  const [feedbackData, setFeedbackData] = useState<DetailedFeedback | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  // User feedback dialog
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackCategory, setFeedbackCategory] = useState<"bug" | "suggestion" | "other">("suggestion");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const [sessionCredits, setSessionCredits] = useState(0);
  const [showUpgrade, setShowUpgrade] = useState(false);

  // Resume
  const [hasResume, setHasResume] = useState<boolean | null>(null);
  const [resumeText, setResumeText] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function checkProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("resume_url, resume_text, session_credits, experience_level, interview_style, target_role")
        .eq("id", user.id)
        .single();

      setHasResume(!!profile?.resume_url);
      setResumeText(profile?.resume_text ?? null);
      setSessionCredits(profile?.session_credits ?? 0);

      // Preset from onboarding preferences
      if (profile?.experience_level) {
        // "student" from onboarding has no direct match — treat as junior
        setLevel(profile.experience_level === "student" ? "junior" : profile.experience_level);
      }
      if (profile?.target_role) {
        setRole(profile.target_role);
      }
      if (profile?.interview_style) {
        if (profile.interview_style === "technical") setInterviewType("technical");
        else if (profile.interview_style === "behavioral") setInterviewType("behavioural");
        else if (profile.interview_style === "case") setInterviewType("case");
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
      track("User Feedback Submitted", {
        rating: feedbackRating || null,
        category: feedbackCategory,
        has_message: feedbackMessage.trim().length > 0,
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
    if (sessionCredits <= 0) {
      setShowUpgrade(true);
      track("Upgrade Modal Shown", { reason: "no_credits", source: "start_session" });
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
        track("Upgrade Modal Shown", { reason: "limit_reached", source: "start_session" });
        return;
      }
      if (!res.ok) throw new Error(data.error);
      setSessionCredits((prev) => Math.max(0, prev - 1));
      setSessionId(data.sessionId);
      setPhase("chat");
      track("Session Started", {
        interview_type: interviewType,
        level,
        role: role || null,
        has_job_context: jobContext.mode === "paste",
        has_resume: hasResume ?? false,
        credits_remaining: Math.max(0, sessionCredits - 1),
      });
    } catch {
      toast.error("Could not start session. Please try again.");
      track("Session Start Failed", { interview_type: interviewType });
    }
  };

  const completeSession = async (msgs: Message[], duration: string) => {
    if (!sessionId) return;

    const questionCount = msgs.filter((m) => m.role === "assistant").length;

    // Show complete screen immediately
    setSessionDuration(duration);
    setSessionQuestionCount(questionCount);
    setPhase("complete");

    track("Session Completed", {
      interview_type: interviewType,
      level,
      role: role || null,
      duration,
      question_count: questionCount,
      has_job_context: getJobContext().mode === "paste",
      has_resume: hasResume ?? false,
    });

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
          role: role,
          resumeText: resumeText ?? undefined,
          jobContext: getJobContext(),
        }),
      });
      const data: DetailedFeedback = await res.json();
      setFeedbackData(data);

      track("AI Feedback Received", {
        interview_type: interviewType,
        score: Math.round(data.score * 10),
        verdict: data.verdict,
        category_count: data.categories.length,
      });

      // Store: score as 0-100, feedback as JSON, per-category progress scores
      await fetch("/api/sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          score: Math.round(data.score * 10),
          feedback: JSON.stringify(data),
          competencyScores: data.categories.map((c) => ({
            competency: c.name.toLowerCase().replace(/\s+/g, "_"),
            score: Math.round(c.score * 10),
          })),
        }),
      });
      toast.success("Session saved!");
    } catch {
      track("AI Feedback Failed", { interview_type: interviewType });
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
        <div
          className="relative rounded-2xl overflow-hidden mb-6 p-6"
          style={{ background: "linear-gradient(135deg, #071a09 0%, #0d2410 100%)" }}
        >
          <div
            className="pointer-events-none absolute -top-12 right-0 w-52 h-52 rounded-full blur-3xl opacity-[0.10]"
            style={{ background: "#2dec29" }}
          />
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: "#2dec29" }}
                />
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.18em]"
                  style={{ color: "rgba(45,236,41,0.7)" }}
                >
                  AI Coach · 24/7
                </span>
              </div>
              <h1 className="text-2xl font-bold text-white">Configure Session</h1>
              <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                Tailor the interview to your target role and resume for maximum relevance.
              </p>
            </div>
            <Sparkles className="w-7 h-7 shrink-0 mt-0.5" style={{ color: "rgba(45,236,41,0.25)" }} />
          </div>
        </div>

        <div className="flex gap-6 items-start">
          {/* ── Left: Form ── */}
          <div className="flex-1 min-w-0 space-y-5">
            {/* Interview Type */}
            <div className="glass-card rounded-2xl p-6">
              <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-3">
                Interview Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {([
                  { value: "technical", icon: Brain, label: "Technical", sub: "System design, coding, architecture" },
                  { value: "behavioural", icon: Users, label: "Behavioural", sub: "Leadership, teamwork, conflict" },
                  { value: "case", icon: Briefcase, label: "Case", sub: "Business problems, market sizing" },
                ] as const).map(({ value, icon: Icon, label, sub }) => {
                  const active = interviewType === value;
                  return (
                    <button
                      key={value}
                      onClick={() => setInterviewType(value)}
                      className="flex items-center gap-3 p-4 rounded-xl transition-all duration-150 text-left"
                      style={{
                        border: active ? "1.5px solid #2dec29" : "1.5px solid transparent",
                        background: active
                          ? "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)"
                          : "#f9fafb",
                        boxShadow: active ? "0 0 0 3px rgba(45,236,41,0.08)" : "none",
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-150"
                        style={{
                          background: active ? "#2dec29" : "#e5e7eb",
                        }}
                      >
                        <Icon
                          className="w-5 h-5 transition-colors duration-150"
                          style={{ color: active ? "#071a09" : "#6b7280" }}
                        />
                      </div>
                      <div>
                        <span
                          className="text-sm font-semibold block transition-colors duration-150"
                          style={{ color: active ? "#112715" : "#374151" }}
                        >
                          {label}
                        </span>
                        <span className="text-xs text-neutral-400">{sub}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target Role */}
            <div className="glass-card rounded-2xl p-6">
              <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-3">
                Target Role
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Software Engineer, Product Manager, Consultant..."
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm text-secondary placeholder:text-neutral-300 bg-neutral-50 focus:outline-none focus:border-[#2dec29] focus:ring-1 focus:ring-[#2dec29] transition"
              />
            </div>

            {/* Job Context */}
            <div className="glass-card rounded-2xl p-6">
              <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-3">
                Job Context
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
                  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-widest">
                    Your Resume
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
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-3">
                  Experience Level
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
      <div className="sticky bottom-16 md:bottom-0 -mx-4 sm:-mx-6 md:-mb-8 px-4 sm:px-6 py-4 mt-6 border-t border-neutral-100" style={{ background: "rgba(250,249,246,0.97)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
        {sessionCredits <= 5 && (
          <p className="text-center text-xs text-neutral-400 mb-2">
            {sessionCredits <= 0 ? (
              <span className="text-amber-600 font-medium">No sessions remaining — buy more to continue</span>
            ) : (
              <span>{sessionCredits} session{sessionCredits !== 1 ? "s" : ""} remaining</span>
            )}
          </p>
        )}
        <button
          onClick={startSession}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold transition-all duration-100 shadow-[4px_4px_0px_0px_#1A1A1A] hover:brightness-95 active:translate-y-1 active:shadow-[2px_2px_0px_0px_#1A1A1A]"
          style={{ background: "#2dec29", color: "#112715" }}
        >
          <Sparkles className="w-4 h-4" />
          {sessionCredits <= 0 ? "Buy Sessions to Continue" : "Start Voice Practice"}
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
        selectedCategory={{ id: interviewType, label: interviewType === "technical" ? "Technical Interview" : interviewType === "case" ? "Case Interview" : "Behavioural Interview", color: interviewType === "technical" ? "#06b6d4" : interviewType === "case" ? "#f59e0b" : "#2dec29" }}
        selectedQuestion={`${interviewType} interview practice`}
        level={level}
        role={role}
        sessionId={sessionId}
        interviewType={interviewType}
        jobContext={jobContext}
        resumeText={resumeText ?? undefined}
        onComplete={(msgs, duration) => completeSession(msgs, duration)}
        onReset={() => {
          track("Session Abandoned", { interview_type: interviewType, level, role: role || null });
          setPhase("setup");
          setSessionId(null);
        }}
      />
    );
  }

  // ── Render: Complete ──

  function getVerdict(score: number): { label: string; color: string } {
    if (score >= 8) return { label: "Strong Pass", color: "#2dec29" };
    if (score >= 6) return { label: "Lean Pass", color: "#f59e0b" };
    if (score >= 4) return { label: "Needs Work", color: "#ef4444" };
    return { label: "Unlikely to Pass", color: "#ef4444" };
  }

  function getCategoryBarColor(score: number): string {
    if (score >= 8) return "#2dec29";
    if (score >= 6) return "#f59e0b";
    return "#ef4444";
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ── Score Hero ── */}
      {feedbackLoading ? (
        <div
          className="rounded-2xl p-6 animate-pulse"
          style={{ background: "linear-gradient(135deg, #071a09, #0d2410)", border: "1px solid rgba(45,236,41,0.08)" }}
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="h-4 w-40 rounded mb-2" style={{ background: "rgba(255,255,255,0.07)" }} />
              <div className="h-3 w-56 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
            </div>
            <div className="h-6 w-24 rounded-xl" style={{ background: "rgba(255,255,255,0.07)" }} />
          </div>
          <div className="h-16 w-32 rounded-xl mb-4" style={{ background: "rgba(255,255,255,0.07)" }} />
          <div className="h-1.5 w-full rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
        </div>
      ) : feedbackData ? (() => {
        const verdict = getVerdict(feedbackData.score);
        const pct = feedbackData.score * 10;
        return (
          <div
            className="relative rounded-2xl overflow-hidden p-6"
            style={{ background: "linear-gradient(135deg, #071a09 0%, #0d2410 100%)" }}
          >
            {/* Ambient glow — colour-coded to score */}
            <div
              className="pointer-events-none absolute -top-10 -right-10 w-56 h-56 rounded-full blur-3xl"
              style={{ background: verdict.color, opacity: 0.08 }}
            />

            <div className="relative z-10">
              {/* Session meta row */}
              <div className="flex items-start justify-between gap-3 mb-6">
                <div>
                  <h1 className="text-lg font-bold text-white leading-tight">
                    {feedbackData.company}
                  </h1>
                  <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.32)" }}>
                    {feedbackData.role}
                    {` · ${feedbackData.interviewType}`}
                    {sessionDuration !== "00:00" && ` · ${sessionDuration}`}
                    {sessionQuestionCount > 0 && ` · ${sessionQuestionCount}Q`}
                    {` · ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
                  </p>
                </div>
                <span
                  className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-xl whitespace-nowrap"
                  style={{
                    background: `${verdict.color}20`,
                    color: verdict.color,
                    border: `1px solid ${verdict.color}35`,
                  }}
                >
                  {feedbackData.verdict}
                </span>
              </div>

              {/* Score display */}
              <div className="flex items-end gap-3 mb-5">
                <span
                  className="text-7xl font-black leading-none tabular-nums"
                  style={{ color: verdict.color }}
                >
                  {Math.round(feedbackData.score * 10)}
                </span>
                <span
                  className="text-2xl font-bold mb-2"
                  style={{ color: "rgba(255,255,255,0.18)" }}
                >
                  %
                </span>
              </div>

              {/* Progress bar */}
              <div
                className="h-1.5 rounded-full overflow-hidden mb-2"
                style={{ background: "rgba(255,255,255,0.08)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${verdict.color}, ${verdict.color}bb)`,
                  }}
                />
              </div>

              {/* Scale */}
              <div className="flex justify-between">
                {["0%", "20%", "40%", "60%", "80%", "100%"].map((v) => (
                  <span
                    key={v}
                    className="text-[9px] tabular-nums"
                    style={{ color: "rgba(255,255,255,0.18)" }}
                  >
                    {v}
                  </span>
                ))}
              </div>

              {/* Threshold legend */}
              <p className="text-[10px] mt-3" style={{ color: "rgba(255,255,255,0.22)" }}>
                80–100% Strong pass &middot; 60–80% Lean pass &middot; 40–60% Needs work &middot; &lt;40% Unlikely to pass
              </p>
            </div>
          </div>
        );
      })() : null}

      {/* Summary */}
      {feedbackLoading ? (
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm animate-pulse">
          <div className="h-3 w-24 bg-neutral-100 rounded mb-4" />
          <div className="space-y-2">
            <div className="h-4 w-full bg-neutral-100 rounded" />
            <div className="h-4 w-5/6 bg-neutral-100 rounded" />
            <div className="h-4 w-4/6 bg-neutral-100 rounded" />
          </div>
        </div>
      ) : feedbackData?.summary ? (
        <div
          className="rounded-2xl p-6"
          style={{
            background: "#fafdf9",
            border: "1px solid #e8f5e9",
          }}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "#2dec29" }}>
            AI Summary
          </p>
          <p className="text-sm leading-relaxed text-neutral-700">{feedbackData.summary}</p>
        </div>
      ) : null}

      {/* Category Breakdown */}
      {feedbackLoading ? (
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm animate-pulse">
          <div className="h-3 w-36 bg-neutral-100 rounded mb-5" />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="mb-5 last:mb-0">
              <div className="flex justify-between mb-1">
                <div className="h-4 bg-neutral-100 rounded" style={{ width: `${[120, 100, 90, 130][i]}px` }} />
                <div className="h-4 w-10 bg-neutral-100 rounded" />
              </div>
              <div className="h-2 bg-neutral-100 rounded-full mt-2" />
              <div className="h-3 w-4/5 bg-neutral-50 rounded mt-2" />
            </div>
          ))}
        </div>
      ) : feedbackData && feedbackData.categories.length > 0 ? (
        <div className="rounded-2xl p-6" style={{ background: "#fff", border: "1px solid #f0f0f0" }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-5" style={{ color: "#9ca3af" }}>
            Category Breakdown
          </p>
          <div className="space-y-5">
            {feedbackData.categories.map((cat, i) => {
              const barColor = getCategoryBarColor(cat.score);
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-neutral-800">{cat.name}</span>
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-lg tabular-nums"
                      style={{
                        background: `${barColor}15`,
                        color: barColor,
                      }}
                    >
                      {Math.round(cat.score * 10)}%
                    </span>
                  </div>
                  <div className="h-[4px] rounded-full overflow-hidden mb-2" style={{ background: "#f3f4f6" }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${cat.score * 10}%`, background: barColor }}
                    />
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "#6b7280" }}>{cat.comment}</p>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* ── Strengths + Improvements ── */}
      {feedbackLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm animate-pulse">
              <div className="h-3 w-20 bg-neutral-100 rounded mb-4" />
              {[0, 1, 2].map((j) => (
                <div key={j} className="h-4 bg-neutral-100 rounded mb-3" style={{ width: `${[90, 75, 85][j]}%` }} />
              ))}
            </div>
          ))}
        </div>
      ) : (feedbackData && (feedbackData.strengths.length > 0 || feedbackData.improvements.length > 0)) ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {feedbackData.strengths.length > 0 && (
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
              <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wide mb-4">Strengths</p>
              <ul className="space-y-2.5">
                {feedbackData.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-neutral-700">
                    <span
                      className="shrink-0 w-4 h-4 mt-0.5 rounded-full border flex items-center justify-center text-[9px] font-black"
                      style={{ borderColor: "#bbf7d0", background: "#f0fdf4", color: "#16a34a" }}
                    >
                      +
                    </span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {feedbackData.improvements.length > 0 && (
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
              <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wide mb-4">Improve</p>
              <ul className="space-y-2.5">
                {feedbackData.improvements.map((s, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-neutral-700">
                    <span
                      className="shrink-0 w-4 h-4 mt-0.5 rounded-full border flex items-center justify-center text-[9px] font-black"
                      style={{ borderColor: "#fecaca", background: "#fff5f5", color: "#ef4444" }}
                    >
                      −
                    </span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : null}

      {/* Tips & Tricks */}
      {feedbackLoading ? (
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm animate-pulse">
          <div className="h-3 w-24 bg-neutral-100 rounded mb-4" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-4 bg-neutral-100 rounded mb-3" style={{ width: `${[88, 80, 70][i]}%` }} />
          ))}
        </div>
      ) : feedbackData && feedbackData.tips.length > 0 ? (
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
          <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wide mb-4">Tips & Tricks</p>
          <ul className="space-y-2.5">
            {feedbackData.tips.map((t, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-neutral-700">
                <span
                  className="shrink-0 w-4 h-4 mt-0.5 rounded-md flex items-center justify-center text-[9px] font-black"
                  style={{ background: "#f0fdf4", color: "#16a34a" }}
                >
                  ✓
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Reconstructed Q&A */}
      {feedbackLoading ? (
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm animate-pulse">
          <div className="h-3 w-36 bg-neutral-100 rounded mb-5" />
          {[0, 1].map((i) => (
            <div key={i} className="mb-6 last:mb-0">
              <div className="h-4 w-4/5 bg-neutral-100 rounded mb-2" />
              <div className="h-3 w-12 bg-neutral-100 rounded mb-3" />
              <div className="h-16 w-full bg-neutral-50 rounded mb-2" />
              <div className="h-3 w-full bg-neutral-50 rounded" />
              <div className="h-3 w-3/4 bg-neutral-50 rounded mt-1" />
            </div>
          ))}
        </div>
      ) : feedbackData && feedbackData.questions.length > 0 ? (
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
          <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wide mb-2">Reconstructed Q&A</p>
          <p className="text-xs text-neutral-400 mb-5">AI reconstructed the interviewer&apos;s questions from your answers.</p>
          <div className="space-y-5">
            {feedbackData.questions.map((q, i) => (
              <div
                key={i}
                className="pl-3 py-1"
                style={{ borderLeft: `3px solid ${getCategoryBarColor(q.score)}` }}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="text-sm font-semibold text-neutral-800">Q: {q.question}</p>
                  <span
                    className="shrink-0 text-xs font-bold px-2 py-0.5 rounded-md"
                    style={{
                      background: `${getCategoryBarColor(q.score)}20`,
                      color: getCategoryBarColor(q.score),
                    }}
                  >
                    {Math.round(q.score * 10)}%
                  </span>
                </div>
                <div
                  className="text-xs leading-relaxed p-3 rounded-lg mb-2"
                  style={{ background: "#f9fafb", color: "#374151" }}
                >
                  A: {q.answer}
                </div>
                <p className="text-xs leading-relaxed text-neutral-500">{q.feedback}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

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
          className="px-6 py-2.5 rounded-2xl font-bold text-sm transition-all duration-150 shadow-[0_4px_14px_rgba(45,236,41,0.35)] hover:brightness-95 active:scale-[0.99]"
          style={{ background: "#2dec29", color: "#112715" }}
        >
          Practice Again
        </button>
        <Link
          href="/app/progress"
          className="px-6 py-2.5 rounded-2xl font-semibold text-sm border border-neutral-200 text-secondary hover:bg-neutral-50 transition"
        >
          View Progress
        </Link>
        <button
          onClick={() => { setShowFeedbackDialog(true); setFeedbackSubmitted(false); }}
          className="px-6 py-2.5 rounded-2xl font-semibold text-sm border border-neutral-200 text-secondary hover:bg-neutral-50 transition flex items-center gap-2"
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
