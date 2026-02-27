"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  CheckCircle,
  Sparkles,
  ArrowLeft,
  Brain,
  Users,
  FileText,
  Zap,
  Upload,
  Loader2,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { VoiceCallView } from "@/components/practice/VoiceCallView";
import { LEVELS, TECH_ROLES } from "@/lib/practice-data";
import type { Phase, Message } from "@/lib/practice-data";
import { createClient } from "@/lib/supabase/client";

type InterviewType = "technical" | "behavioural";
type JobContextMode = "paste" | "general";

// ─── Main ────────────────────────────────────────────────────────────────────

export default function PracticePage() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [interviewType, setInterviewType] = useState<InterviewType>("technical");
  const [jobContextMode, setJobContextMode] = useState<JobContextMode>("general");
  const [jobDescription, setJobDescription] = useState("");
  const [role, setRole] = useState("general");
  const [customRole, setCustomRole] = useState("");
  const [level, setLevel] = useState("mid");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionDuration, setSessionDuration] = useState<string>("00:00");
  const [sessionQuestionCount, setSessionQuestionCount] = useState(0);
  const [feedbackData, setFeedbackData] = useState<{ score: number; improvements: { point: string; example: string }[] } | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  // Resume
  const [hasResume, setHasResume] = useState<boolean | null>(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  useEffect(() => {
    async function checkResume() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data: profile } = await supabase
        .from("profiles")
        .select("resume_url")
        .eq("id", user.id)
        .single();
      setHasResume(!!profile?.resume_url);
    }
    checkResume();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleResumeUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Resume must be under 10 MB");
      return;
    }

    setUploadingResume(true);
    try {
      const path = `${userId}/${file.name}`;

      const { data: existing } = await supabase.storage
        .from("resumes")
        .list(userId);

      if (existing?.length) {
        await supabase.storage
          .from("resumes")
          .remove(existing.map((f) => `${userId}/${f.name}`));
      }

      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      await supabase
        .from("profiles")
        .update({ resume_url: `resumes/${path}` })
        .eq("id", userId);

      setHasResume(true);
      toast.success("Resume saved — your interview will be tailored to your experience!");
    } catch {
      toast.error("Failed to upload resume");
    } finally {
      setUploadingResume(false);
      if (resumeInputRef.current) resumeInputRef.current.value = "";
    }
  }

  async function handleResumeDelete() {
    if (!userId) return;
    try {
      const { data: existing } = await supabase.storage.from("resumes").list(userId);
      if (existing?.length) {
        await supabase.storage
          .from("resumes")
          .remove(existing.map((f) => `${userId}/${f.name}`));
      }
      await supabase.from("profiles").update({ resume_url: null }).eq("id", userId);
      setHasResume(false);
      toast.success("Resume removed.");
    } catch {
      toast.error("Failed to delete resume.");
    }
  }

  const getJobContext = () => {
    if (jobContextMode === "paste" && jobDescription.trim()) return { mode: "paste" as const, value: jobDescription.trim() };
    return { mode: "general" as const, value: "" };
  };

  const startSession = async () => {
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
      if (!res.ok) throw new Error(data.error);
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
      <div className="max-w-5xl mx-auto">
        {/* Hidden resume input */}
        <input
          ref={resumeInputRef}
          type="file"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={handleResumeUpload}
        />

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
            <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6">
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
            <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6">
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
            <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6">
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
              <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide">
                    4. Your Resume
                  </label>
                  <span className="text-xs text-neutral-400 font-medium px-2 py-0.5 rounded-full bg-neutral-100">
                    Optional
                  </span>
                </div>

                {/* File upload (only when no resume on file) */}
                {hasResume === false && (
                  <>
                    <p className="text-xs text-neutral-400 mb-3">
                      Upload your resume so the AI can tailor questions to your background.
                    </p>
                    <button
                      onClick={() => resumeInputRef.current?.click()}
                      disabled={uploadingResume}
                      className="w-full border-2 border-dashed border-neutral-200 rounded-xl py-4 flex items-center justify-center gap-2 hover:border-[#2dec29]/60 hover:bg-neutral-50/50 transition group disabled:opacity-60 mb-4"
                    >
                      {uploadingResume ? (
                        <Loader2 className="w-4 h-4 text-neutral-300 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" style={{ color: "#2dec29" }} />
                      )}
                      <span className="text-sm font-medium text-neutral-600">
                        {uploadingResume ? "Uploading..." : "Upload Resume"}
                      </span>
                      <span className="text-xs text-neutral-400">· PDF, DOC or DOCX · Max 10 MB</span>
                    </button>
                  </>
                )}

                {/* Resume on file indicator + actions */}
                {hasResume === true && (
                  <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100">
                    <div className="flex items-center gap-2 min-w-0">
                      <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "#2dec29" }} />
                      <span className="text-xs font-medium text-neutral-600 truncate">Resume uploaded</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => resumeInputRef.current?.click()}
                        disabled={uploadingResume}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-600 bg-white border border-neutral-200 hover:border-[#2dec29]/60 hover:text-secondary transition disabled:opacity-50"
                      >
                        {uploadingResume ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Upload className="w-3 h-3" />
                        )}
                        Replace
                      </button>
                      <button
                        onClick={handleResumeDelete}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 bg-white border border-neutral-200 hover:border-red-300 hover:bg-red-50 transition"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Level + Confidence */}
            <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6 space-y-5">
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
            <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5">
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
      <div className="sticky bottom-0 -mx-6 -mb-8 px-6 py-4 mt-6 border-t border-neutral-100">
        <button
          onClick={startSession}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold transition-all duration-100 shadow-[4px_4px_0px_0px_#1A1A1A] hover:brightness-95 active:translate-y-1 active:shadow-[2px_2px_0px_0px_#1A1A1A]"
          style={{ background: "#2dec29", color: "#112715" }}
        >
          <Sparkles className="w-4 h-4" />
          Start Voice Practice
        </button>
      </div>
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
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6">
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
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6">
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
      </div>
    </div>
  );
}
