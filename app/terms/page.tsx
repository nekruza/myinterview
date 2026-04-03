import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — MyInterview",
  description:
    "Read the terms and conditions governing your use of the MyInterview platform, including subscription terms, acceptable use, peer session rules, and AI content policies.",
  alternates: {
    canonical: "https://myinterview.com/terms",
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

export default function TermsPage() {
  return (
    <>
      <Navigation />
      <main id="main-content" className="bg-white min-h-screen">
        {/* Hero */}
        <section className="pt-36 pb-12 px-4 sm:px-6 lg:px-8 bg-cream">
          <div className="max-w-3xl mx-auto">
            <p className="text-primary font-bold text-sm uppercase tracking-wider mb-3">Legal</p>
            <h1 className="text-4xl md:text-5xl font-black text-secondary mb-4">Terms of Service</h1>
            <p className="text-neutral-500 text-sm">Last updated: February 15, 2026</p>
          </div>
        </section>

        {/* Content */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">

            <p className="text-neutral-700 leading-relaxed mb-10">
              These Terms of Service (&quot;Terms&quot;) govern your access to and use of the MyInterview platform,
              including our website, applications, and services (collectively the &quot;Service&quot;). By accessing
              or using the Service, you agree to be bound by these Terms. If you do not agree, do not use the Service.
            </p>

            <Section title="1. Eligibility">
              <p>You must be at least 16 years old to use MyInterview. By using the Service, you represent that you meet this age requirement and have the legal capacity to enter into a binding agreement.</p>
              <p>If you are using the Service on behalf of an organisation, you represent that you have the authority to bind that organisation to these Terms.</p>
            </Section>

            <Section title="2. Your Account">
              <p>You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. Notify us immediately at <a href="mailto:support@myinterview.com" className="text-primary hover:underline">support@myinterview.com</a> if you suspect unauthorised access.</p>
              <p>You agree to provide accurate, current, and complete information when creating your account and to keep it updated.</p>
              <p>We reserve the right to suspend or terminate accounts that violate these Terms, engage in fraudulent activity, or remain inactive for more than 24 months.</p>
            </Section>

            <Section title="3. Acceptable Use">
              <p>You agree not to:</p>
              <ul className="space-y-2 ml-4">
                {[
                  "Use the Service for any unlawful purpose or in violation of these Terms",
                  "Harass, threaten, or harm other users during peer sessions",
                  "Impersonate another person or misrepresent your identity or credentials",
                  "Scrape, crawl, or systematically extract data from the platform",
                  "Attempt to gain unauthorised access to any part of the Service or its systems",
                  "Use the Service to distribute spam, malware, or unsolicited communications",
                  "Reproduce or resell any part of the Service without our written consent",
                  "Reverse engineer, decompile, or disassemble any aspect of the platform",
                ].map((item, i) => (
                  <li key={i} className="flex items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 mr-3 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </Section>

            <Section title="4. Subscriptions and Payments">
              <p><strong className="text-secondary">Free plan.</strong> MyInterview offers a free tier with limited features. No payment is required to access the free tier.</p>
              <p><strong className="text-secondary">Paid plans.</strong> The Pro subscription is billed quarterly. All payments are processed by Stripe and are subject to Stripe&apos;s terms.</p>
              <p><strong className="text-secondary">Cancellation.</strong> You may cancel your subscription at any time. Cancellation takes effect at the end of the current billing period. We do not offer refunds for partial billing periods, except where required by applicable law.</p>
              <p><strong className="text-secondary">Price changes.</strong> We reserve the right to change subscription prices. We will provide at least 30 days&apos; notice before any price increase takes effect for existing subscribers.</p>
            </Section>

            <Section title="5. Peer Sessions and Community">
              <p>MyInterview facilitates peer practice sessions between users. By participating, you acknowledge that:</p>
              <ul className="space-y-2 ml-4">
                {[
                  "Peer partners are independent users, not MyInterview employees or agents",
                  "MyInterview does not guarantee the quality or accuracy of peer feedback",
                  "You are solely responsible for your conduct during sessions",
                  "Sessions may be recorded with your consent for progress tracking purposes",
                ].map((item, i) => (
                  <li key={i} className="flex items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 mr-3 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <p>We reserve the right to remove users from the peer matching system who receive multiple substantiated complaints about their conduct.</p>
            </Section>

            <Section title="6. AI-Generated Content">
              <p>MyInterview uses AI systems to generate interview questions, feedback, and recommendations. You acknowledge that:</p>
              <p><strong className="text-secondary">No guarantee of accuracy.</strong> AI-generated content may contain errors or be outdated. It should not be treated as professional career advice.</p>
              <p><strong className="text-secondary">Your content.</strong> Your inputs to the AI (answers, responses) may be used to improve our models in aggregated, anonymised form unless you opt out in your account settings.</p>
            </Section>

            <Section title="7. Intellectual Property">
              <p><strong className="text-secondary">Our content.</strong> The MyInterview platform, including its design, code, question library, and original content, is owned by MyInterview and protected by intellectual property laws.</p>
              <p><strong className="text-secondary">Your content.</strong> You retain ownership of content you create (answers, notes, uploaded resumes). By submitting content to the platform, you grant us a limited, non-exclusive, royalty-free licence to store and display that content solely for the purpose of providing the Service.</p>
            </Section>

            <Section title="8. Disclaimer of Warranties">
              <p>The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, either express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, or non-infringement.</p>
              <p>We do not warrant that the Service will be uninterrupted, error-free, or that defects will be corrected. We do not guarantee any specific outcome from using the platform, including employment offers or interview success.</p>
            </Section>

            <Section title="9. Limitation of Liability">
              <p>To the maximum extent permitted by applicable law, MyInterview shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the Service.</p>
              <p>Our total liability to you for any claims under these Terms shall not exceed the greater of (a) the amount you paid us in the 12 months preceding the claim, or (b) $100 USD.</p>
            </Section>

            <Section title="10. Termination">
              <p>You may terminate your account at any time by contacting us or using the account deletion feature in settings. Upon termination, your right to access the Service ceases immediately.</p>
              <p>We may terminate or suspend your account without notice if you violate these Terms. Sections 7, 8, 9, and 11 survive termination.</p>
            </Section>

            <Section title="11. Governing Law">
              <p>These Terms are governed by and construed in accordance with applicable laws. Any disputes arising under these Terms shall be resolved through binding arbitration, except that either party may seek injunctive relief in a court of competent jurisdiction.</p>
            </Section>

            <Section title="12. Changes to These Terms">
              <p>We may update these Terms from time to time. We will notify you of material changes via email or a prominent notice in the platform. Your continued use of the Service after the effective date of changes constitutes acceptance of the revised Terms.</p>
            </Section>

            <Section title="13. Contact">
              <p>Questions about these Terms? Contact us:</p>
              <div className="bg-cream rounded-2xl p-6 mt-4">
                <p className="font-bold text-secondary mb-1">MyInterview</p>
                <p>Email: <a href="mailto:legal@myinterview.com" className="text-primary hover:underline">legal@myinterview.com</a></p>
              </div>
            </Section>

            <div className="border-t border-neutral-200 pt-8 mt-8 flex gap-6 text-sm">
              <Link href="/privacy" className="text-primary hover:underline font-medium">Privacy Policy →</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
