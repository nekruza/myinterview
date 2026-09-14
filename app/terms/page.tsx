import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocument, LegalList, LegalSection } from "@/components/LegalDocument";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms for using Fina, including acceptable use, AI-generated content, Fina Pro subscriptions on the web, and how to contact us.",
  alternates: { canonical: "/terms" },
};

const inlineLink =
  "font-medium text-accent-brand underline decoration-accent-brand/40 underline-offset-4 hover:decoration-accent-brand";

// Text ported from the Fina mobile app (fina/app/terms-of-service.tsx), plus the
// "Using Fina on the Web" section for web subscriptions and web-only services.
export default function TermsPage() {
  return (
    <LegalDocument title="Terms of Service" updated="October 2025" updatedIso="2025-10">
      <LegalSection title="Agreement to Terms">
        <p>
          By accessing or using Fina (&quot;the App&quot;), you agree to be bound by these Terms of Service
          (&quot;Terms&quot;). If you do not agree to these Terms, please do not use the App.
        </p>
      </LegalSection>

      <LegalSection title="Account Registration">
        <p>To use certain features of the App, you must create an account. You agree to:</p>
        <LegalList>
          <li>Provide accurate, current, and complete information</li>
          <li>Maintain the security of your account credentials</li>
          <li>Promptly update your account information</li>
          <li>Accept responsibility for all activities under your account</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="Acceptable Use Policy">
        <p>You agree not to:</p>
        <LegalList>
          <li>Use the App for any illegal or unauthorized purpose</li>
          <li>Attempt to gain unauthorized access to the App or its systems</li>
          <li>Interfere with or disrupt the App&apos;s functionality</li>
          <li>Upload malicious code, viruses, or harmful content</li>
          <li>Abuse or spam the AI features or API services</li>
          <li>Share offensive, inappropriate, or harmful content</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="AI-Generated Content">
        <p>
          Fina uses artificial intelligence to generate vocabulary lessons and conversation responses. While we strive
          for accuracy, we cannot guarantee that all AI-generated content is error-free or appropriate. You should verify
          important information and use your own judgment when relying on AI-generated content.
        </p>
      </LegalSection>

      <LegalSection title="Intellectual Property">
        <p>
          The App and its original content, features, and functionality are owned by Fina and are protected by
          international copyright, trademark, and other intellectual property laws. You retain ownership of content you
          create (custom vocabulary topics, feedback), but grant us a license to use it to provide and improve our
          services.
        </p>
      </LegalSection>

      <LegalSection title="User-Generated Content">
        <p>
          When you create custom vocabulary topics, provide feedback, or submit content to the App, you grant us a
          worldwide, non-exclusive, royalty-free license to use, reproduce, and modify that content to improve our
          services. We will not share your content publicly without your permission.
        </p>
      </LegalSection>

      <LegalSection title="Service Availability">
        <p>
          We strive to provide reliable service but cannot guarantee that the App will be available at all times. The
          App may be temporarily unavailable due to maintenance, updates, or technical issues. We are not liable for any
          interruptions or data loss resulting from service unavailability.
        </p>
      </LegalSection>

      <LegalSection title="Limitation of Liability">
        <p>
          To the maximum extent permitted by law, Fina shall not be liable for any indirect, incidental, special,
          consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or
          indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your use of the App.
        </p>
      </LegalSection>

      <LegalSection title="Account Termination">
        <p>
          You may delete your account at any time through the App settings. We reserve the right to suspend or terminate
          your account if you violate these Terms or engage in conduct that we believe is harmful to other users or the
          App. Upon termination, your right to use the App will immediately cease.
        </p>
      </LegalSection>

      <LegalSection title="Third-Party Services">
        <p>
          The App uses third-party services (Google Gemini, Inworld, Supabase) to provide certain features. These
          services have their own terms and privacy policies. We are not responsible for the actions or policies of
          third-party service providers.
        </p>
      </LegalSection>

      <LegalSection title="Using Fina on the Web">
        <p>These additional terms apply when you use Fina in a web browser.</p>
        <LegalList>
          <li>
            <strong className="font-semibold text-ink">Fina Pro subscriptions:</strong> Fina Pro on the web is a
            subscription billed in US dollars through Stripe, monthly or yearly, at the price shown before you pay.
          </li>
          <li>
            <strong className="font-semibold text-ink">Renewal:</strong> Your subscription renews automatically at the
            end of each billing period until you cancel.
          </li>
          <li>
            <strong className="font-semibold text-ink">Cancellation:</strong> You can cancel at any time from Settings,
            using Manage subscription to open the Stripe billing portal. Pro stays active until the end of the period you
            have already paid for.
          </li>
          <li>
            <strong className="font-semibold text-ink">App store purchases:</strong> Subscriptions bought through the
            Apple App Store or Google Play are billed and managed by those stores and do not currently unlock Pro on the
            web.
          </li>
          <li>
            <strong className="font-semibold text-ink">Web services:</strong> On the web, Fina also uses Stripe
            (payments), Vercel (hosting and web analytics), Mixpanel (product analytics) and OpenAI (backup AI
            provider). Payments are also subject to Stripe&apos;s own terms. See our{" "}
            <Link href="/privacy" className={inlineLink}>
              Privacy Policy
            </Link>{" "}
            for what each service receives.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection title="Changes to Terms">
        <p>
          We reserve the right to modify these Terms at any time. We will notify you of any changes by posting the
          updated Terms in the App and updating the &quot;Last Updated&quot; date. Your continued use of the App after
          changes constitutes acceptance of the modified Terms.
        </p>
      </LegalSection>

      <LegalSection title="Governing Law">
        <p>
          These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Fina
          operates, without regard to its conflict of law provisions.
        </p>
      </LegalSection>

      <LegalSection title="Dispute Resolution">
        <p>
          Any disputes arising from these Terms or your use of the App shall be resolved through good faith negotiations.
          If negotiations fail, you agree to resolve disputes through binding arbitration in accordance with applicable
          arbitration rules.
        </p>
      </LegalSection>

      <LegalSection title="Contact Us">
        <p>If you have any questions about these Terms of Service, please contact us:</p>
        <p>
          Email:{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className={inlineLink}>
            {CONTACT_EMAIL}
          </a>
          <br />
          Mobile app: Use the Feedback section in Profile settings.
          <br />
          Web: Use &quot;Give us feedback&quot; on your dashboard.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
