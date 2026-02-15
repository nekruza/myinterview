import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";
import { ComingSoonProvider } from "@/components/ComingSoonProvider";

const sora = Sora({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sora",
});

export const metadata: Metadata = {
  title: "InterviewPrep - Conquer Interview Anxiety | Build Real Confidence",
  description: "Overcome interview anxiety with peer support and proven techniques. Practice with people who understand, build genuine confidence, and land your dream role.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sora.variable} font-sans antialiased`} suppressHydrationWarning>
        <ComingSoonProvider>{children}</ComingSoonProvider>
      </body>
    </html>
  );
}
