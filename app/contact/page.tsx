"use client";

import { useState } from "react";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui";
import { MessageSquare, Briefcase, HelpCircle, CheckCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "How do peer sessions work?",
    a: "Once you sign up, you get matched with other engineers at a similar level. You schedule a 45-minute session, take turns as interviewer and candidate, and give each other structured feedback afterwards. Sessions are available for behavioral, technical, and system design formats.",
  },
  {
    q: "Can I cancel my subscription?",
    a: "Yes, you can cancel at any time from your account settings. Cancellation takes effect at the end of your current billing period — you keep access until then. We don't charge cancellation fees.",
  },
  {
    q: "How is my data used?",
    a: "Your practice sessions and personal data are used solely to provide and improve the MyInterview platform. We do not sell your data. You can read the full details in our Privacy Policy.",
  },
  {
    q: "Is there a free plan?",
    a: "Yes! The free plan includes 3 AI practice sessions and up to 3 peer session joins per month. No credit card required to get started. Pro is £13/month billed quarterly for 30 sessions.",
  },
  {
    q: "How quickly will you respond to my message?",
    a: "We aim to respond to all messages within one business day. We're a small team and every message is read and replied to personally.",
  },
];

const topics = [
  "General question",
  "Bug report",
  "Feature request",
  "Billing & subscription",
  "Partnership",
  "Press inquiry",
  "Other",
];

const contactCards = [
  {
    icon: MessageSquare,
    title: "Send a message",
    description: "Fill in the form below and we'll get back to you within one business day.",
    action: "Use the form below",
    href: "#contact-form",
  },
  {
    icon: Briefcase,
    title: "Careers",
    description: "Interested in joining the team? We'd love to hear from you.",
    action: "See open roles",
    href: "/#join-team",
  },
  {
    icon: HelpCircle,
    title: "Common questions",
    description: "Check our FAQ and legal pages for quick answers.",
    action: "Browse below",
    href: "#faq",
  },
];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [topic, setTopic] = useState(topics[0]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const name = (form.elements.namedItem("contact-name") as HTMLInputElement).value;
    const email = (form.elements.namedItem("contact-email") as HTMLInputElement).value;
    const subject = (form.elements.namedItem("contact-subject") as HTMLInputElement).value;
    const message = (form.elements.namedItem("contact-message") as HTMLTextAreaElement).value;

    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, topic, subject, message }),
      });
      if (!res.ok) throw new Error("Failed to send");
      setSubmitted(true);
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Navigation />
      <main id="main-content" className="bg-white min-h-screen">
        {/* Hero */}
        <section className="pt-36 pb-16 px-4 sm:px-6 lg:px-8 bg-cream">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-primary font-bold text-sm uppercase tracking-wider mb-3">
              Get in Touch
            </p>
            <h1 className="text-4xl md:text-6xl font-black text-secondary mb-6">
              We&apos;d Love to Hear<br className="hidden md:block" /> From You
            </h1>
            <p className="text-xl text-neutral-600 max-w-xl mx-auto">
              Have a question, idea, or just want to say hi? We&apos;re a small team and we read every message.
            </p>
          </div>
        </section>

        {/* Info cards */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 border-b border-neutral-100">
          <div className="max-w-6xl mx-auto grid sm:grid-cols-3 gap-5">
            {contactCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.title}
                  href={card.href}
                  className="group rounded-2xl p-6 transition-all duration-200 hover:shadow-md flex flex-col gap-4"
                  style={{
                    background: "linear-gradient(145deg, #071a09 0%, #0d2410 60%, #061508 100%)",
                    border: "1px solid rgba(45,236,41,0.12)",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: "rgba(45,236,41,0.10)", border: "1px solid rgba(45,236,41,0.18)" }}
                  >
                    <Icon className="w-5 h-5" style={{ color: "#2dec29" }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white mb-1">{card.title}</h3>
                    <p className="text-xs leading-relaxed mb-3" style={{ color: "rgba(255,255,255,0.42)" }}>
                      {card.description}
                    </p>
                    <span
                      className="text-sm font-bold flex items-center gap-1 transition-gap duration-200 group-hover:gap-2"
                      style={{ color: "#2dec29" }}
                    >
                      {card.action}
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Contact form */}
        <section id="contact-form" className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-start">

            {/* Left: copy */}
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-secondary mb-6">
                Send us a message
              </h2>
              <p className="text-neutral-600 leading-relaxed mb-8">
                Fill in the form and we&apos;ll get back to you within one business day.
                We read every message and respond personally.
              </p>

              {/* FAQ accordion */}
              <div id="faq">
                <p className="text-sm font-bold text-secondary uppercase tracking-wider mb-4">
                  Common questions
                </p>
                <Accordion type="single" collapsible className="space-y-2">
                  {faqs.map((faq, i) => (
                    <AccordionItem
                      key={i}
                      value={`faq-${i}`}
                      className="border border-neutral-200 rounded-xl px-4 data-[state=open]:border-primary transition-colors"
                    >
                      <AccordionTrigger className="text-sm font-medium text-neutral-700 hover:text-secondary hover:no-underline py-4">
                        {faq.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-neutral-600 leading-relaxed pb-4">
                        {faq.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>

            {/* Right: form */}
            <div
              className="rounded-3xl p-8"
              style={{ background: "#fafdf9", border: "1.5px solid #e8f5e9" }}
            >
              {submitted ? (
                <div className="flex flex-col items-center text-center py-12">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                    style={{ background: "rgba(45,236,41,0.08)", border: "1px solid rgba(45,236,41,0.2)" }}
                  >
                    <CheckCircle className="w-7 h-7" style={{ color: "#2dec29" }} />
                  </div>
                  <h3 className="text-2xl font-black text-secondary mb-3">Message sent!</h3>
                  <p className="text-neutral-600 mb-8">
                    Thanks for reaching out. We&apos;ll get back to you within one business day.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-neutral-200 text-secondary hover:bg-neutral-50 transition"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="contact-name" className="text-neutral-800 font-medium">Name</Label>
                      <Input id="contact-name" placeholder="Jane Smith" required className="border-neutral-300 text-neutral-900 placeholder:text-neutral-400" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="contact-email" className="text-neutral-800 font-medium">Email</Label>
                      <Input id="contact-email" type="email" placeholder="jane@example.com" required className="border-neutral-300 text-neutral-900 placeholder:text-neutral-400" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="contact-topic" className="text-neutral-800 font-medium">Topic</Label>
                    <select
                      id="contact-topic"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="w-full h-9 rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm text-neutral-900 focus-visible:outline-none focus:ring-1 focus:ring-neutral-400"
                    >
                      {topics.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="contact-subject" className="text-neutral-800 font-medium">Subject</Label>
                    <Input id="contact-subject" placeholder="Brief summary of your message" required className="border-neutral-300 text-neutral-900 placeholder:text-neutral-400" />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="contact-message" className="text-neutral-800 font-medium">Message</Label>
                    <Textarea
                      id="contact-message"
                      placeholder="Tell us more..."
                      className="resize-none border-neutral-300 text-neutral-900 placeholder:text-neutral-400"
                      rows={5}
                      required
                    />
                  </div>

                  <Button type="submit" size="lg" className="w-full" disabled={sending}>
                    {sending ? "Sending…" : "Send Message"}
                  </Button>

                  <p className="text-xs text-neutral-400 text-center">
                    By submitting you agree to our{" "}
                    <Link href="/privacy" className="hover:underline">Privacy Policy</Link>.
                  </p>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section
          className="py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
          style={{ background: "linear-gradient(160deg, #071a09 0%, #0d2410 55%, #061508 100%)" }}
        >
          <div
            className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-32 rounded-full blur-3xl"
            style={{ background: "rgba(45,236,41,0.06)" }}
          />
          <div className="relative z-10 max-w-2xl mx-auto text-center">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(45,236,41,0.6)" }}>
              Start today — it&apos;s free
            </p>
            <h2 className="text-3xl font-black text-white mb-3">
              Not sure where to start?
            </h2>
            <p className="mb-8" style={{ color: "rgba(255,255,255,0.45)" }}>
              Try the platform for free — no credit card, no commitment.
            </p>
            <Link
              href="/#pricing"
              className="inline-flex items-center gap-2 font-bold px-8 py-3.5 rounded-xl transition-all hover:brightness-110"
              style={{ background: "#2dec29", color: "#071a09" }}
            >
              Start for Free
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
