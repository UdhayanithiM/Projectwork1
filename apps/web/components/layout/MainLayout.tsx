"use client";

import { ReactNode } from "react";
import { Navbar } from "./Navbar"; // Import the new Navbar component
import Link from "next/link";
import { Gauge } from "lucide-react";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Reusable Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 relative">
        {/* Ambient Background Glow (Optional visual flair) */}
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none -z-10" />
        
        {children}
      </main>

      {/* Site Footer */}
      <footer className="py-12 border-t border-white/5 bg-background/50 backdrop-blur-lg">
        <div className="container flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
             <div className="p-2 rounded-lg bg-white/5">
                <Gauge className="h-5 w-5 text-primary" />
             </div>
             <span className="font-bold text-lg tracking-tight">
               <span className="text-primary">Forti</span>Twin
            </span>
          </div>
          
          <div className="text-sm text-muted-foreground text-center">
             © {new Date().getFullYear()} FortiTwin Inc. All rights reserved.
          </div>

           <nav className="flex gap-6">
               <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link>
               <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link>
           </nav>
        </div>
      </footer>
    </div>
  );
}

