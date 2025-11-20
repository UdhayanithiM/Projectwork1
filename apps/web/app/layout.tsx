/**
 * FortiTwin - Root Layout (Server Component)
 * This component handles global metadata, fonts, and the root HTML structure.
 * All client-side logic is delegated to the <Providers> component.
 */

import type React from "react";
import "@/app/globals.css";
import { Inter as FontSans } from "next/font/google";
import type { Metadata, Viewport } from "next";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/providers"; // ✅ IMPORT the new component

// Font configuration remains the same
const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Metadata configuration remains a server-side feature
export const metadata: Metadata = {
  title: {
    default: "FortiTwin",
    template: "%s | FortiTwin",
  },
  description: "A modern, AI-powered platform for conducting fair and effective interviews and assessments.",
  // ... all your other metadata is correct
};

// Viewport configuration remains a server-side feature
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // ... all your other viewport config is correct
};

/**
 * Root layout component that wraps all pages
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className={cn("min-h-screen bg-background font-sans antialiased scroll-smooth", fontSans.variable)}>
        {/* ✅ WRAP children with the new Providers component */}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}