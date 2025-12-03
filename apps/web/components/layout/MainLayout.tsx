"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { Gauge, Github, Twitter, Linkedin } from "lucide-react";
import { Navbar } from "./Navbar";
import { Button } from "@/components/ui/button";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-background font-body selection:bg-primary/20">
      {/* The Smart Navbar 
        Handles scrolling, mobile menu, and auth state automatically.
      */}
      <Navbar />

      {/* Main Content Area 
        flex-1 ensures the footer is pushed to the bottom even on short pages.
      */}
      <main className="flex-1 relative flex flex-col">
        {children}
      </main>

      {/* SaaS Style Footer 
        Glassmorphism effect with deep borders for the premium feel.
      */}
      <footer className="border-t border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="container py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
            
            {/* Brand Column */}
            <div className="space-y-4">
              <Link href="/" className="flex items-center gap-2 group w-fit">
                <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 group-hover:bg-primary/20 transition-colors">
                  <Gauge className="h-5 w-5 text-primary" />
                </div>
                <span className="font-heading font-bold text-lg tracking-tight">
                  <span className="text-primary">Forti</span>Twin
                </span>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                The AI-native interview platform for the next generation of engineers. Master your craft with holographic coaching.
              </p>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-white/10">
                  <Github className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-white/10">
                  <Twitter className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-white/10">
                  <Linkedin className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Links Column 1 */}
            <div>
              <h3 className="font-heading font-semibold text-white mb-4">Product</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/features" className="hover:text-primary transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
                <li><Link href="/demo" className="hover:text-primary transition-colors">Live Demo</Link></li>
                <li><Link href="/changelog" className="hover:text-primary transition-colors">Changelog</Link></li>
              </ul>
            </div>

            {/* Links Column 2 */}
            <div>
              <h3 className="font-heading font-semibold text-white mb-4">Company</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
                <li><Link href="/careers" className="hover:text-primary transition-colors">Careers</Link></li>
                <li><Link href="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
                <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
              </ul>
            </div>

            {/* Links Column 3 */}
            <div>
              <h3 className="font-heading font-semibold text-white mb-4">Legal</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                <li><Link href="/cookies" className="hover:text-primary transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} FortiTwin Inc. All rights reserved.</p>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />
              <span>All Systems Operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}