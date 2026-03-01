"use client";

import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { LifeBuoy, MessageSquare, Sparkles, Users, TrendingUp, CreditCard, Mic, BookOpen } from "lucide-react";
import { toast } from "sonner";

const FAQ_SECTIONS = [
  {
    id: "ai-practice",
    icon: Sparkles,
    label: "AI Practice",
    items: [
      {
        q: "How does AI Practice work?",
        a: "AI Practice simulates a real interview using your microphone. The AI asks you behavioral or technical questions based on your selected role and experience level, listens to your answer, then gives you structured feedback covering communication, content, and confidence.",
      },
      {
        q: "What types of interviews can I practice?",
        a: "You can practice Behavioral interviews (STAR-method questions like 'Tell me about a time…') and Technical interviews tailored to your developer type — Frontend, Backend, Full-Stack, Data, DevOps, and more.",
      },
      {
        q: "Why does the AI need my microphone?",
        a: "The AI listens to your spoken answer in real time to provide accurate, voice-aware feedback. Your audio is processed for the session only and is never stored.",
      },
      {
        q: "Can I practice without a microphone?",
        a: "A microphone is required for AI Practice sessions since the experience is built around spoken answers. If your mic is blocked, click the 'Retry' button on the banner to re-prompt browser permission.",
      },
    ],
  },
  {
    id: "peer-practice",
    icon: Users,
    label: "Peer Practice",
    items: [
      {
        q: "What is Peer Practice?",
        a: "Peer Practice lets you schedule live mock interviews with other users via Zoom or Google Meet. You can host a session (sharing your meeting link) or join one someone else created.",
      },
      {
        q: "How do I join a session?",
        a: "Browse open sessions on the Peer Practice page and click 'Request to Join'. The host reviews your request and accepts or declines it. Once accepted, you'll see the meeting link to join.",
      },
      {
        q: "What video platforms are supported?",
        a: "You can use Zoom, Google Meet, Microsoft Teams, Whereby, Jitsi, or Webex. Just paste the meeting link when creating a session.",
      },
      {
        q: "Can I invite friends directly?",
        a: "Yes — on any session detail page, tap 'Invite a friend' to share the session link via your device's share menu or copy it to clipboard.",
      },
    ],
  },
  {
    id: "progress",
    icon: TrendingUp,
    label: "Progress & Scores",
    items: [
      {
        q: "How is my score calculated?",
        a: "After each AI Practice session, the AI evaluates your answer across multiple competencies (communication, problem solving, leadership, etc.) and assigns a score out of 100. Your progress page shows trends over time.",
      },
      {
        q: "What does the streak counter track?",
        a: "Your streak counts consecutive days you've completed at least one practice session. It resets if you miss a day, so practicing daily keeps it alive.",
      },
      {
        q: "Why don't I have a confidence score yet?",
        a: "Confidence scores appear after you complete your first scored AI Practice session. Complete a session and your baseline will be established.",
      },
    ],
  },
  {
    id: "account",
    icon: CreditCard,
    label: "Account & Billing",
    items: [
      {
        q: "Is MyInterview free to use?",
        a: "Yes — the core features including AI Practice, Peer Practice, and Progress tracking are available on the free plan. Pro features (if available) are shown in your profile settings.",
      },
      {
        q: "How do I change my profile information?",
        a: "Go to Profile in the sidebar (Settings icon) and update your name, avatar, experience level, target role, and notification preferences.",
      },
      {
        q: "How do I delete my account?",
        a: "Send us a message using the form below and we'll process your deletion request within 48 hours, including removal of all associated data.",
      },
    ],
  },
  {
    id: "technical",
    icon: Mic,
    label: "Technical Issues",
    items: [
      {
        q: "The AI session won't start — what should I do?",
        a: "Check that your browser has microphone permission granted for this site. In Chrome: click the lock icon in the address bar → Microphone → Allow, then refresh. In Safari: Preferences → Websites → Microphone → Allow.",
      },
      {
        q: "The page is loading slowly or stuck.",
        a: "Try a hard refresh (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows). If the issue persists, clear your browser cache or try a different browser.",
      },
      {
        q: "I'm not receiving notifications for peer session requests.",
        a: "Make sure you haven't disabled notifications in your Profile settings. Notifications are currently in-app only — check the bell icon in the sidebar.",
      },
    ],
  },
  {
    id: "resources",
    icon: BookOpen,
    label: "Resources",
    items: [
      {
        q: "What is in the Resources section?",
        a: "Resources contains curated articles, guides, and tips on interview preparation — covering the STAR method, common behavioral questions, technical interview strategies, and more.",
      },
    ],
  },
];

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    setSending(true);
    // Simulate send — wire to a real email service when ready
    await new Promise((r) => setTimeout(r, 1000));
    toast.success("Message sent! We'll get back to you within 24 hours.");
    setName("");
    setEmail("");
    setMessage("");
    setSending(false);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-10">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <LifeBuoy className="w-5 h-5" style={{ color: "#2dec29" }} />
          <h1 className="text-2xl font-bold text-secondary">Help & Contact</h1>
        </div>
        <p className="text-neutral-500 text-sm">
          Find answers to common questions or send us a message — we respond within 24 hours.
        </p>
      </div>

      {/* Quick contact options */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div
          className="glass-card rounded-2xl p-5 flex items-center gap-4"
          style={{ opacity: 0.65 }}
        >
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: "#f4fdf3" }}
          >
            <MessageSquare className="w-5 h-5" style={{ color: "#2dec29" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-secondary text-sm">Live chat</p>
            <p className="text-xs text-neutral-400 mt-0.5">Coming soon</p>
          </div>
        </div>
      </div>

      {/* Contact form */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="font-bold text-secondary text-lg mb-4">Send a message</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1.5 uppercase tracking-wide">
                Your name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm text-secondary outline-none focus:border-primary transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1.5 uppercase tracking-wide">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm text-secondary outline-none focus:border-primary transition"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1.5 uppercase tracking-wide">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your issue or question..."
              rows={4}
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm text-secondary outline-none focus:border-primary transition resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={sending}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-100 shadow-[4px_4px_0px_0px_#1A1A1A] hover:brightness-95 active:translate-y-1 active:shadow-[2px_2px_0px_0px_#1A1A1A] disabled:opacity-60 disabled:shadow-none disabled:translate-y-0"
            style={{ background: "#2dec29", color: "#112715" }}
          >
            {sending ? "Sending…" : "Send message"}
          </button>
        </form>
      </div>

      {/* FAQ */}
      <div>
        <h2 className="font-bold text-secondary text-xl mb-6">Frequently asked questions</h2>
        <div className="space-y-4">
          {FAQ_SECTIONS.map(({ id, icon: Icon, label, items }) => (
            <div key={id} className="glass-card rounded-2xl overflow-hidden">
              {/* Section header */}
              <div
                className="flex items-center gap-2.5 px-5 py-3.5"
                style={{ background: "#f9fafb", borderBottom: "1px solid rgba(0,0,0,0.05)" }}
              >
                <Icon className="w-4 h-4" style={{ color: "#2dec29" }} />
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  {label}
                </span>
              </div>
              <Accordion type="multiple" className="px-1">
                {items.map((item, i) => (
                  <AccordionItem
                    key={i}
                    value={`${id}-${i}`}
                    className="border-b border-neutral-50 last:border-0"
                  >
                    <AccordionTrigger className="px-4 py-3.5 text-sm font-semibold text-secondary hover:no-underline text-left">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 text-sm text-neutral-500 leading-relaxed">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div
        className="rounded-2xl p-6 text-center"
        style={{ background: "#112715" }}
      >
        <p className="text-white/80 text-sm mb-1 font-medium">Still have questions?</p>
        <p className="text-white/50 text-xs">Use the form above and our team will get back to you shortly.</p>
      </div>
    </div>
  );
}
