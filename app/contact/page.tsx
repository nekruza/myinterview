"use client";

import { useState } from "react";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui";
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
    emoji: "💬",
    title: "Send a message",
    description: "Fill in the form below and we'll get back to you within one business day.",
    action: "Use the form below ↓",
    href: "#contact-form",
  },
  {
    emoji: "💼",
    title: "Careers",
    description: "Interested in joining the team?",
    action: "See open roles",
    href: "/#join-team",
  },
  {
    emoji: "❓",
    title: "Common questions",
    description: "Check our FAQ and legal pages for quick answers.",
    action: "Browse below ↓",
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
          <div className="max-w-6xl mx-auto grid sm:grid-cols-3 gap-6">
            {contactCards.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="group bg-white rounded-2xl p-6 border-2 border-neutral-100 hover:border-primary transition-all duration-300 flex items-start gap-4"
              >
                <span className="text-3xl">{card.emoji}</span>
                <div>
                  <h3 className="font-bold text-secondary mb-1">{card.title}</h3>
                  <p className="text-sm text-neutral-500 mb-2">{card.description}</p>
                  <span className="text-sm font-semibold text-primary group-hover:underline">
                    {card.action}
                  </span>
                </div>
              </Link>
            ))}
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
            <div className="bg-white rounded-3xl border-2 border-neutral-300 p-8 shadow-sm">
              {submitted ? (
                <div className="flex flex-col items-center text-center py-12">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-black text-secondary mb-3">Message sent!</h3>
                  <p className="text-neutral-600 mb-8">
                    Thanks for reaching out. We&apos;ll get back to you within one business day.
                  </p>
                  <Button variant="outline" onClick={() => setSubmitted(false)}>
                    Send another message
                  </Button>
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
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-secondary">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-black text-white mb-4">
              Not sure where to start?
            </h2>
            <p className="text-neutral-300 mb-8">
              Try the platform for free — no credit card, no commitment.
            </p>
            <Link
              href="/#pricing"
              className="inline-flex items-center bg-primary text-secondary font-bold px-8 py-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:brightness-95 active:translate-y-1 transition-all duration-100"
            >
              Start for Free →
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
