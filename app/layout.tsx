import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";
import { MixpanelInit } from "@/components/MixpanelInit";
import { Analytics } from "@vercel/analytics/next"

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  // Optical sizing for large display type, and the SOFT axis used by .fina-display.
  axes: ["opsz", "SOFT"],
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://fina-ai-app.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Fina — Speak a new language with AI tutors",
    template: "%s | Fina",
  },
  description:
    "Practice real conversations out loud with Fina's AI tutors. Roleplays, vocabulary, flashcards and a 30-day plan in 9 languages.",
  keywords: [
    "language learning app",
    "AI language tutor",
    "practice speaking a language",
    "AI conversation practice",
    "roleplay language learning",
    "vocabulary flashcards",
    "learn a language online",
    "30 day language plan",
    "AI language coach",
    "speaking practice app",
  ],
  authors: [{ name: "Fina Team", url: BASE_URL }],
  creator: "Fina",
  publisher: "Fina",
  category: "Education",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "Fina",
    title: "Fina — Speak a new language with AI tutors",
    description:
      "Practice real conversations out loud with Fina's AI tutors. Roleplays, vocabulary, flashcards and a 30-day plan in 9 languages.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Fina — practice a new language out loud with AI tutors",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@finaapp",
    creator: "@finaapp",
    title: "Fina — Speak a new language with AI tutors",
    description:
      "Practice real conversations out loud with Fina's AI tutors. Roleplays, vocabulary, flashcards and a 30-day plan.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  alternates: {
    canonical: BASE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to external origins for faster resource loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${fraunces.variable} ${manrope.variable} font-sans antialiased bg-cream text-ink`}
        suppressHydrationWarning
      >
        {/* Skip-to-content for accessibility and SEO */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-ink focus:font-bold focus:rounded-lg focus:shadow-lg"
        >
          Skip to main content
        </a>
        <MixpanelInit />
        <Analytics />
        {children}
      </body>
    </html>
  );
}
