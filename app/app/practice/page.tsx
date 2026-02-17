"use client";

import { FC, useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle,
  ChevronDown,
  Sparkles,
  BookOpen,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { VoiceCallView } from "@/components/practice/VoiceCallView";
import { CATEGORIES, LEVELS } from "@/lib/practice-data";
import type { Phase } from "@/lib/practice-data";

// ─── Sub-components ──────────────────────────────────────────────────────────

const FrameworkBadge: FC = () => (
  <div className="bg-white border border-neutral-100 rounded-2xl p-4 text-sm">
    <div className="flex items-center gap-2 mb-3">
      <BookOpen className="w-4 h-4 text-neutral-400" />
      <span className="font-semibold text-secondary text-xs uppercase tracking-wide">
        R-STAR Framework
      </span>
    </div>
    {[
      ["R", "Reflection", "Show growth mindset"],
      ["S", "Situation", "Set the context"],
      ["T", "Task", "Your specific role"],
      ["A", "Action", "What you did & why"],
      ["R", "Result", "Measurable outcomes"],
    ].map(([letter, name, hint]) => (
      <div key={name} className="flex items-start gap-2 mb-2 last:mb-0">
        <span
          className="w-5 h-5 rounded-md text-xs font-bold flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: "#2dec29", color: "#112715" }}
        >
          {letter}
        </span>
        <div>
          <span className="font-medium text-secondary text-xs">{name}</span>
          <span className="text-neutral-400 text-xs ml-1">— {hint}</span>
        </div>
      </div>
    ))}
  </div>
);

// ─── Main ────────────────────────────────────────────────────────────────────

export default function PracticePage() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [selectedQuestion, setSelectedQuestion] = useState(
    CATEGORIES[0].questions[0]
  );
  const [level, setLevel] = useState("mid");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [endConfidence, setEndConfidence] = useState<number | null>(null);
  const [showQuestionPicker, setShowQuestionPicker] = useState(false);

  const startSession = async () => {
    if (!confidence) {
      toast.error("Please rate your current confidence level.");
      return;
    }

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: selectedQuestion,
          category: selectedCategory.id,
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

  const completeSession = async (endConf: number) => {
    if (!sessionId) return;

    setEndConfidence(endConf);

    await fetch("/api/sessions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        score: endConf,
        feedback: null,
        competencyScores: [
          { competency: selectedCategory.id, score: endConf * 10 },
        ],
      }),
    });

    setPhase("complete");
    toast.success("Session saved!");
  };

  // ── Render: Setup ──
  if (phase === "setup") {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/app/dashboard"
            className="text-neutral-400 hover:text-secondary transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-secondary">AI Practice</h1>
            <p className="text-neutral-500 text-sm mt-0.5">
              Practice behavioral questions with your AI coach
            </p>
          </div>
        </div>

        {/* Category */}
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6">
          <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-3">
            1. Choose a Competency
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat);
                  setSelectedQuestion(cat.questions[0]);
                }}
                className="flex items-center gap-3 p-3 rounded-xl border transition text-left"
                style={{
                  borderColor:
                    selectedCategory.id === cat.id ? cat.color : "transparent",
                  background:
                    selectedCategory.id === cat.id
                      ? cat.color + "15"
                      : "#f9fafb",
                }}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: cat.color }}
                />
                <span className="text-sm font-medium text-secondary">
                  {cat.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Question */}
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6">
          <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-3">
            2. Select a Question
          </label>
          <div className="relative">
            <button
              onClick={() => setShowQuestionPicker((v) => !v)}
              className="w-full flex items-start justify-between gap-3 p-4 rounded-xl border border-neutral-200 text-left hover:border-neutral-300 transition"
            >
              <span className="text-sm text-secondary flex-1 leading-snug">
                {selectedQuestion}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-neutral-400 shrink-0 mt-0.5 transition-transform ${showQuestionPicker ? "rotate-180" : ""}`}
              />
            </button>
            {showQuestionPicker && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-xl shadow-lg z-10 overflow-hidden">
                {selectedCategory.questions.map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      setSelectedQuestion(q);
                      setShowQuestionPicker(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-secondary hover:bg-neutral-50 transition border-b border-neutral-100 last:border-0"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Level + Confidence */}
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-3">
              3. Your Experience Level
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

          <div>
            <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-2">
              4. Confidence Before (1–10)
            </label>
            <p className="text-xs text-neutral-400 mb-3">
              How confident do you feel answering this type of question right now?
            </p>
            <div className="flex gap-2 flex-wrap">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setConfidence(n)}
                  className="w-9 h-9 rounded-xl text-sm font-semibold transition"
                  style={{
                    background: confidence === n ? "#2dec29" : "#f3f4f6",
                    color: confidence === n ? "#112715" : "#6b7280",
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={startSession}
          disabled={!confidence}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold transition disabled:opacity-50"
          style={{ background: "#112715", color: "#fff" }}
        >
          <Sparkles className="w-4 h-4" style={{ color: "#2dec29" }} />
          Start Voice Practice
        </button>

        <FrameworkBadge />
      </div>
    );
  }

  // ── Render: Voice Call ──
  if (phase === "chat") {
    return (
      <VoiceCallView
        selectedCategory={selectedCategory}
        selectedQuestion={selectedQuestion}
        level={level}
        sessionId={sessionId}
        onComplete={(endConf) => completeSession(endConf)}
        onReset={() => {
          setPhase("setup");
          setSessionId(null);
        }}
      />
    );
  }

  // ── Render: Complete ──
  const delta =
    endConfidence !== null && confidence !== null
      ? endConfidence - confidence
      : 0;

  return (
    <div className="max-w-lg mx-auto text-center py-12 space-y-6">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
        style={{ background: "#f4fdf3" }}
      >
        <CheckCircle className="w-8 h-8" style={{ color: "#2dec29" }} />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-secondary">Session Complete!</h1>
        <p className="text-neutral-500 mt-2">
          You practiced <strong>{selectedCategory.label}</strong> — great work keeping the momentum going.
        </p>
      </div>

      <div className="flex justify-center gap-6">
        <div className="text-center">
          <p className="text-3xl font-bold text-secondary">{confidence}</p>
          <p className="text-xs text-neutral-400 mt-0.5">Before</p>
        </div>
        <div className="text-center">
          <p
            className="text-3xl font-bold"
            style={{
              color: delta > 0 ? "#2dec29" : delta < 0 ? "#ef4444" : "#6b7280",
            }}
          >
            {delta > 0 ? `+${delta}` : delta}
          </p>
          <p className="text-xs text-neutral-400 mt-0.5">Change</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-secondary">{endConfidence}</p>
          <p className="text-xs text-neutral-400 mt-0.5">After</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={() => {
            setPhase("setup");
            setSessionId(null);
            setConfidence(null);
            setEndConfidence(null);
          }}
          className="px-6 py-2.5 rounded-xl font-semibold text-sm transition hover:opacity-90"
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
