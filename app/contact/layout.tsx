import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us — MyInterview",
  description:
    "Get in touch with the MyInterview team. We read and respond to every message personally within one business day. Have a question, bug report, or partnership inquiry? We'd love to hear from you.",
  alternates: {
    canonical: "https://myinterview.com/contact",
  },
  openGraph: {
    title: "Contact Us — MyInterview",
    description:
      "Get in touch with the MyInterview team. We respond to every message personally within one business day.",
    url: "https://myinterview.com/contact",
    type: "website",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
