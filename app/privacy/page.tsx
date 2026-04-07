import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — MyInterview",
  description:
    "Learn how MyInterview collects, uses, and protects your personal data. We do not sell your data. Read our full privacy policy.",
  alternates: {
    canonical: "https://myinterview.com/privacy",
  },
  robots: {
    index: true,
    follow: false,
  },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h2 className="text-xl font-black text-secondary mb-4">{title}</h2>
      <div className="space-y-3 text-neutral-700 leading-relaxed">{children}</div>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <>
      <Navigation />
      <main id="main-content" className="bg-white min-h-screen">
        {/* Hero */}
        <section className="pt-36 pb-12 px-4 sm:px-6 lg:px-8 bg-cream">
          <div className="max-w-3xl mx-auto">
            <p className="text-primary font-bold text-sm uppercase tracking-wider mb-3">Legal</p>
            <h1 className="text-4xl md:text-5xl font-black text-secondary mb-4">Privacy Policy</h1>
            <p className="text-neutral-500 text-sm">Last updated: April 7, 2026</p>
          </div>
        </section>

        {/* Content */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">

            <p className="text-neutral-700 leading-relaxed mb-10">
              MyInterview (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to protecting your privacy.
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when
              you use our platform. Please read it carefully. If you disagree with its terms, please stop using the platform.
            </p>

            <Section title="1. Information We Collect">
              <p><strong className="text-secondary">Account information.</strong> When you register, we collect your name and email address. Authentication (sign-in, password management) is handled securely by Supabase — we do not store your password on our servers.</p>
              <p><strong className="text-secondary">Profile and preferences.</strong> During onboarding and in settings you may provide: your age, experience level, target role, preferred interview style and duration, preferred interview language and platform, target companies, and how you heard about us. This information is used to personalise your practice sessions.</p>
              <p><strong className="text-secondary">Practice session data.</strong> When you complete an AI practice session we store a score (0–10), a written feedback summary, and per-competency scores for progress tracking. We do not store raw audio recordings from AI sessions. For peer sessions, session details (title, schedule, meeting link, notes) are stored and visible to matched participants.</p>
              <p><strong className="text-secondary">Resume data.</strong> If you upload a resume, we store the file and its extracted text content. This is used to personalise AI interview questions and feedback to your actual experience.</p>
              <p><strong className="text-secondary">Usage data.</strong> We automatically collect information about how you interact with the platform: pages visited, features used, session duration, and device/browser information.</p>
              <p><strong className="text-secondary">Payment information.</strong> Billing is processed by Stripe. We store only a Stripe customer reference ID — we do not store card numbers or full payment details on our servers.</p>
              <p><strong className="text-secondary">Contact and waitlist data.</strong> If you contact us or join the waitlist, we store your name, email, and message content.</p>
            </Section>

            <Section title="2. How We Use Your Information">
              <p>We use the information we collect to:</p>
              <ul className="space-y-2 ml-4">
                {[
                  "Provide, maintain, and improve the MyInterview platform",
                  "Generate personalised practice recommendations and progress analytics",
                  "Match you with peer practice partners",
                  "Send transactional emails (session reminders, receipts, account updates)",
                  "Send marketing communications (you may opt out at any time)",
                  "Detect and prevent fraud, abuse, or security incidents",
                  "Comply with legal obligations",
                ].map((item, i) => (
                  <li key={i} className="flex items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 mr-3 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </Section>

            <Section title="3. Sharing Your Information">
              <p>We do not sell your personal data. We may share information with:</p>
              <p><strong className="text-secondary">Service providers.</strong> Trusted third parties who assist in operating our platform (e.g. cloud hosting, email delivery, analytics, payment processing). These parties are bound by confidentiality agreements.</p>
              <p><strong className="text-secondary">Practice partners.</strong> When you participate in a peer session, your name and session details (title, schedule, notes) are visible to your matched partner.</p>
              <p><strong className="text-secondary">Legal requirements.</strong> We may disclose your information if required by law or in response to valid legal requests from public authorities.</p>
              <p><strong className="text-secondary">Business transfers.</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred. We will notify you before your data becomes subject to a different privacy policy.</p>
            </Section>

            <Section title="4. Data Retention">
              <p>We retain your account information for as long as your account is active or as needed to provide services. You may request deletion of your account and associated data at any time by emailing <a href="mailto:privacy@myinterview.com" className="text-primary hover:underline">privacy@myinterview.com</a>.</p>
              <p>Anonymised, aggregated data may be retained indefinitely for product analytics and research.</p>
            </Section>

            <Section title="5. Security">
              <p>We implement industry-standard security measures including encryption in transit (TLS), encryption at rest, access controls, and regular security audits. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.</p>
            </Section>

            <Section title="6. Cookies and Tracking">
              <p>We use cookies and similar tracking technologies to maintain session state, remember preferences, and analyse usage patterns. You can control cookies through your browser settings. Disabling cookies may affect platform functionality.</p>
              <p>We use analytics tools (such as PostHog or similar) that collect anonymised usage data to help us understand how the platform is used and improve it.</p>
            </Section>

            <Section title="7. Your Rights">
              <p>Depending on your location, you may have the right to:</p>
              <ul className="space-y-2 ml-4">
                {[
                  "Access the personal data we hold about you",
                  "Correct inaccurate or incomplete data",
                  "Request deletion of your data",
                  "Object to or restrict certain processing",
                  "Data portability (receive your data in a machine-readable format)",
                  "Withdraw consent at any time where processing is based on consent",
                ].map((item, i) => (
                  <li key={i} className="flex items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 mr-3 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <p>To exercise any of these rights, contact us at <a href="mailto:privacy@myinterview.com" className="text-primary hover:underline">privacy@myinterview.com</a>. We will respond within 30 days.</p>
            </Section>

            <Section title="8. Children's Privacy">
              <p>MyInterview is not directed to children under 16. We do not knowingly collect personal data from anyone under 16. If we discover that a child under 16 has provided us with personal data, we will delete it promptly.</p>
            </Section>

            <Section title="9. Changes to This Policy">
              <p>We may update this Privacy Policy periodically. We will notify you of significant changes via email or a prominent notice on the platform. Your continued use of the platform after changes are posted constitutes acceptance of the revised policy.</p>
            </Section>

            <Section title="10. Contact Us">
              <p>If you have questions about this Privacy Policy or our data practices, please contact us:</p>
              <div className="bg-cream rounded-2xl p-6 mt-4">
                <p className="font-bold text-secondary mb-1">MyInterview</p>
                <p>Email: <a href="mailto:privacy@myinterview.com" className="text-primary hover:underline">privacy@myinterview.com</a></p>
              </div>
            </Section>

            <div className="border-t border-neutral-200 pt-8 mt-8 flex gap-6 text-sm">
              <Link href="/terms" className="text-primary hover:underline font-medium">Terms of Service →</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
