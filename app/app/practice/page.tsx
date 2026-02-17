"use client";

import { FC, useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Send,
  RefreshCw,
  CheckCircle,
  ChevronDown,
  Sparkles,
  BookOpen,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

// ─── Data ───────────────────────────────────────────────────────────────────

const CATEGORIES = [
  {
    id: "leadership",
    label: "Leadership & Influence",
    color: "#2dec29",
    questions: [
      "Tell me about a time you led a project through a significant technical challenge.",
      "Describe a situation where you had to influence a team without formal authority.",
      "Give me an example of when you mentored someone and the impact it had.",
      "Tell me about a time you drove a technical decision that others disagreed with.",
    ],
  },
  {
    id: "ownership",
    label: "Ownership & Initiative",
    color: "#f59e0b",
    questions: [
      "Tell me about a time you took ownership of a problem that wasn't technically yours to solve.",
      "Describe a situation where you identified and fixed a critical issue before it became a major problem.",
      "Give me an example of when you went beyond your role to deliver better outcomes.",
      "Tell me about a time you had to make a high-stakes decision with incomplete information.",
    ],
  },
  {
    id: "conflict",
    label: "Conflict & Disagreement",
    color: "#8b5cf6",
    questions: [
      "Tell me about a time you disagreed with your manager and how you handled it.",
      "Describe a situation where two team members were in conflict and you helped resolve it.",
      "Give me an example of when you had to push back on a product decision you believed was wrong.",
      "Tell me about a time you had a difficult conversation with a stakeholder.",
    ],
  },
  {
    id: "failure",
    label: "Failure & Growth",
    color: "#ef4444",
    questions: [
      "Tell me about your biggest professional failure and what you learned from it.",
      "Describe a time you made a mistake that impacted your team. How did you handle it?",
      "Give me an example of a project that failed. What would you do differently?",
      "Tell me about a time when you received critical feedback that was hard to hear.",
    ],
  },
  {
    id: "collaboration",
    label: "Cross-team Collaboration",
    color: "#06b6d4",
    questions: [
      "Tell me about a time you worked across teams to deliver a complex project.",
      "Describe a situation where alignment between teams was difficult to achieve.",
      "Give me an example of when you had to coordinate work with multiple stakeholders.",
      "Tell me about a time you improved a process that benefited teams beyond your own.",
    ],
  },
];

const LEVELS = [
  { value: "junior", label: "Junior (0-2 yrs)" },
  { value: "mid", label: "Mid-level (3-5 yrs)" },
  { value: "senior", label: "Senior (6-9 yrs)" },
  { value: "staff", label: "Staff / Principal (10+ yrs)" },
];

interface Message {
  role: "user" | "assistant";
  content: string;
}

type Phase = "setup" | "chat" | "complete";

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [endConfidence, setEndConfidence] = useState<number | null>(null);
  const [showQuestionPicker, setShowQuestionPicker] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

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

      // Kick off the first AI message
      await sendToAI(
        [
          {
            role: "user",
            content: `[SESSION START] I'm a ${LEVELS.find((l) => l.value === level)?.label} engineer. Please present the practice question and guide me through the session.`,
          },
        ],
        data.sessionId
      );
    } catch {
      toast.error("Could not start session. Please try again.");
    }
  };

  const sendToAI = useCallback(
    async (msgs: Message[], sid: string | null = sessionId) => {
      setStreaming(true);
      const assistantMsg: Message = { role: "assistant", content: "" };
      setMessages((prev) => [...prev, assistantMsg]);

      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: msgs,
            question: selectedQuestion,
            category: selectedCategory.id,
            level,
            sessionId: sid,
          }),
        });

        if (!res.ok || !res.body) throw new Error("Stream failed");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6);
            if (payload === "[DONE]") break;
            try {
              const { text, error } = JSON.parse(payload);
              if (error) throw new Error(error);
              if (text) {
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content: updated[updated.length - 1].content + text,
                  };
                  return updated;
                });
              }
            } catch {
              // skip malformed chunks
            }
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "AI error";
        toast.error(msg.includes("API key") ? "AI service not configured (missing ANTHROPIC_API_KEY)" : msg);
        setMessages((prev) => prev.slice(0, -1));
      } finally {
        setStreaming(false);
      }
    },
    [sessionId, selectedQuestion, selectedCategory.id, level]
  );

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || streaming) return;
    setInput("");

    const userMsg: Message = { role: "user", content: trimmed };
    const updatedMsgs = [...messages, userMsg];
    setMessages(updatedMsgs);

    await sendToAI(updatedMsgs);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const completeSession = async () => {
    if (!endConfidence || !sessionId) return;

    const delta = endConfidence - (confidence ?? 5);
    const feedbackMsg = messages.findLast((m) => m.role === "assistant");

    await fetch("/api/sessions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        score: endConfidence,
        feedback: feedbackMsg?.content?.slice(0, 500) ?? null,
        competencyScores: [
          { competency: selectedCategory.id, score: endConfidence * 10 },
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
          Start Practice Session
        </button>

        <FrameworkBadge />
      </div>
    );
  }

  // ── Render: Chat ──
  if (phase === "chat") {
    return (
      <div className="flex gap-6 h-[calc(100vh-6rem)]">
        {/* Chat */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: selectedCategory.color }}
                />
                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  {selectedCategory.label}
                </span>
              </div>
              <p className="text-secondary font-medium text-sm mt-0.5 leading-snug max-w-lg">
                {selectedQuestion}
              </p>
            </div>
            <button
              onClick={() => setPhase("setup")}
              className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-secondary transition px-3 py-1.5 rounded-lg hover:bg-neutral-100"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              New question
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mr-2 mt-1"
                    style={{ background: "#2dec29", color: "#112715" }}
                  >
                    AI
                  </div>
                )}
                <div
                  className="max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
                  style={{
                    background:
                      msg.role === "user" ? "#112715" : "#fff",
                    color: msg.role === "user" ? "#fff" : "#112715",
                    border:
                      msg.role === "assistant"
                        ? "1px solid #f3f4f6"
                        : "none",
                  }}
                >
                  {msg.content || (
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-neutral-300 animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-neutral-300 animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-neutral-300 animate-bounce [animation-delay:300ms]" />
                    </span>
                  )}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="mt-4 shrink-0">
            <div className="flex gap-3 items-end bg-white border border-neutral-200 rounded-2xl p-3 focus-within:border-neutral-300 transition">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your answer… (Enter to send, Shift+Enter for new line)"
                rows={3}
                className="flex-1 resize-none outline-none text-sm text-secondary placeholder:text-neutral-400 leading-relaxed"
                disabled={streaming}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || streaming}
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition disabled:opacity-40"
                style={{ background: "#2dec29", color: "#112715" }}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-neutral-400 text-center mt-2">
              After a few rounds, click below to wrap up the session.
            </p>

            {/* End session */}
            {messages.length >= 4 && !streaming && (
              <div className="mt-3 p-4 bg-white border border-neutral-100 rounded-2xl">
                <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-2">
                  Confidence After (1–10)
                </p>
                <div className="flex gap-2 flex-wrap mb-3">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      onClick={() => setEndConfidence(n)}
                      className="w-8 h-8 rounded-xl text-xs font-semibold transition"
                      style={{
                        background: endConfidence === n ? "#2dec29" : "#f3f4f6",
                        color: endConfidence === n ? "#112715" : "#6b7280",
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <button
                  onClick={completeSession}
                  disabled={!endConfidence}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition"
                  style={{ background: "#112715", color: "#fff" }}
                >
                  <CheckCircle className="w-4 h-4" />
                  Complete Session
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-56 shrink-0 space-y-4 hidden lg:block">
          <FrameworkBadge />
          <div className="bg-white border border-neutral-100 rounded-2xl p-4">
            <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-2">
              Tips
            </p>
            {[
              "Be specific — name real projects",
              "Quantify impact where possible",
              "Show your thinking process",
              "Don't skip the Result",
            ].map((tip) => (
              <p key={tip} className="text-xs text-neutral-500 mb-1.5 flex gap-1.5">
                <span style={{ color: "#2dec29" }}>•</span> {tip}
              </p>
            ))}
          </div>
        </div>
      </div>
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
            setMessages([]);
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
