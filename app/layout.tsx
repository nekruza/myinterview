import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";
import { ComingSoonProvider } from "@/components/ComingSoonProvider";

const sora = Sora({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sora",
  display: "swap",
});

const BASE_URL = "https://myinterview.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "MyInterview — Conquer Interview Anxiety | AI & Peer Practice",
    template: "%s | MyInterview",
  },
  description:
    "MyInterview helps engineers overcome interview anxiety through AI-powered mock interviews and peer practice sessions. 93% of candidates experience mental freeze — we fix that. Free to start.",
  keywords: [
    "interview anxiety",
    "mock interview practice",
    "AI interview practice",
    "peer interview practice",
    "behavioral interview prep",
    "technical interview prep",
    "interview confidence",
    "STAR method",
    "system design interview",
    "software engineer interview",
  ],
  authors: [{ name: "MyInterview Team", url: BASE_URL }],
  creator: "MyInterview",
  publisher: "MyInterview",
  category: "Career Development",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "MyInterview",
    title: "MyInterview — Conquer Interview Anxiety | AI & Peer Practice",
    description:
      "AI-powered mock interview practice and peer coaching to help engineers overcome anxiety and land their dream roles. 500+ beta users. Free to start.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MyInterview — AI and peer interview practice platform for engineers",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@myinterviewapp",
    creator: "@myinterviewapp",
    title: "MyInterview — Conquer Interview Anxiety",
    description:
      "Practice behavioral & technical interviews with AI and peers. Build real confidence. Free to start.",
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
    icon: "/logo.jpg",
    shortcut: "/logo.jpg",
    apple: "/logo.jpg",
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
        <link rel="preconnect" href="https://randomuser.me" />
      </head>
      <body className={`${sora.variable} font-sans antialiased`} suppressHydrationWarning>
        {/* Skip-to-content for accessibility and SEO */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-secondary focus:font-bold focus:rounded-lg focus:shadow-lg"
        >
          Skip to main content
        </a>
        <ComingSoonProvider>{children}</ComingSoonProvider>
      </body>
    </html>
  );
}
