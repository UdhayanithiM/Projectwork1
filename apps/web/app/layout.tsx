/**
 * FortiTwin 3.0 — Root Layout (Server Component)
 * Defines global fonts, metadata, theme, and wraps the entire app with Providers.
 */

import type { ReactNode } from "react";
import "./globals.css"; 

import {
  Outfit,
  Space_Grotesk,
  JetBrains_Mono,
} from "next/font/google";

import type { Metadata, Viewport } from "next";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/providers";

/* --------------------------------------------------
   1. Font System (Design Tokens)
-------------------------------------------------- */
const fontHeading = Outfit({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const fontBody = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const fontCode = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-code",
  display: "swap",
});

/* --------------------------------------------------
   2. Metadata (SEO & Social Sharing)
-------------------------------------------------- */
export const metadata: Metadata = {
  title: {
    default: "FortiTwin - AI Interview Mastery",
    template: "%s | FortiTwin",
  },
  description:
    "Ace your technical interviews with FortiTwin. The AI-powered platform for realistic mock interviews, code assessments, and personalized career coaching.",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "FortiTwin - AI Interview Mastery",
    description: "Practice with AI, get instant feedback, and land your dream job.",
    url: "https://fortitwin.com",
    siteName: "FortiTwin",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FortiTwin - AI Interview Mastery",
    description: "The AI-native interview platform for the next generation of engineers.",
  },
};

/* --------------------------------------------------
   3. Viewport (Deep Void Theme)
-------------------------------------------------- */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0b", // Matches the Deep Void background
};

/* --------------------------------------------------
   4. Root Layout
-------------------------------------------------- */
export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(fontHeading.variable, fontBody.variable, fontCode.variable)}
    >
      <body
        className={cn(
          "min-h-screen bg-background font-body antialiased",
          "selection:bg-primary/30 selection:text-primary-foreground", // Better text selection contrast
          "scroll-smooth"
        )}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}