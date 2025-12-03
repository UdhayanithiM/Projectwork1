import { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full relative bg-background overflow-hidden selection:bg-primary/20">
      
      {/* --- SHARED AURA BACKGROUND --- 
          We move this to the layout so the background doesn't 
          "flash" or reset when switching from Login to Signup.
      */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px] animate-pulse-soft" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse-soft delay-1000" />
      </div>

      {/* --- GLOBAL NAVIGATION --- 
          Floating "Back" button always visible in the top-left
      */}
      <div className="absolute top-4 left-4 z-50 md:top-8 md:left-8">
        <Button variant="ghost" className="group gap-2 text-muted-foreground hover:text-primary" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span className="hidden sm:inline">Back to Home</span>
          </Link>
        </Button>
      </div>

      {/* --- MAIN CONTENT --- 
          Rendered full-width to allow Split-Screen designs.
      */}
      <main className="relative z-10 min-h-screen w-full flex flex-col">
        {children}
      </main>

      {/* --- MOBILE BRANDING --- 
          Only visible on small screens where the Split-View sidebar is hidden 
      */}
      <div className="absolute bottom-6 w-full text-center text-xs text-muted-foreground md:hidden z-10">
        <span className="flex items-center justify-center gap-1 opacity-50">
          <Gauge className="h-3 w-3" /> Powered by FortiTwin AI
        </span>
      </div>
    </div>
  );
}