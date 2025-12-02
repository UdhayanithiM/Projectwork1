/**
 * FortiTwin 2.0 — Root Layout (Server Component)
 * Defines global fonts, metadata, theme, and wraps the entire app with Providers.
 */

import type { ReactNode } from "react";
import "./globals.css"; // Ensure this import path is correct based on your file structure

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
   2. Metadata (SEO-safe)
-------------------------------------------------- */
export const metadata: Metadata = {
  title: {
    default: "FortiTwin",
    template: "%s | FortiTwin",
  },
  description:
    "A modern, AI-powered platform for conducting fair and effective interviews and assessments.",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

/* --------------------------------------------------
   3. Viewport (Deep Void Theme)
-------------------------------------------------- */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0b",
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
          "selection:bg-primary/20 selection:text-primary",
          // Smooth scrolling across the app
          "scroll-smooth"
        )}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

