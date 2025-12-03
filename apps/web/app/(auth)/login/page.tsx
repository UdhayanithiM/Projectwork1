"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import { 
  Gauge, 
  Mail, 
  Lock, 
  ArrowRight, 
  Github, 
  Twitter, 
  Linkedin,
  Loader2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { ModeToggle } from "@/components/mode-toggle";

// Lazy load Spline to ensure fast initial paint
const SplineScene = dynamic(() => import("@/components/SplineScene"), {
  ssr: false,
});

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  
  const { login, isLoading, error, clearError } = useAuthStore();

  // Handle Error Toasts
  useEffect(() => {
    if (error) {
      toast.error("Access Denied", {
        description: error,
      });
      clearError();
    }
  }, [error, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Trigger "Thinking" state in UI
    const loadingToast = toast.loading("Verifying credentials...");
    
    const success = await login({ email, password });
    
    toast.dismiss(loadingToast);
    
    if (success) {
      toast.success("Identity Verified", {
        description: "Welcome back to Mission Control.",
      });
      
      // Redirect Logic
      const user = useAuthStore.getState().user;
      if (user) {
        setTimeout(() => {
           switch (user.role.toUpperCase()) {
            case "ADMIN":
              window.location.href = '/admin';
              break;
            case "HR":
              window.location.href = '/hr-dashboard';
              break;
            default:
              window.location.href = '/dashboard';
              break;
          }
        }, 800); // Small delay to show success animation
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background relative overflow-hidden font-body selection:bg-primary/30">
      
      {/* --- GLOBAL AURA BACKGROUND --- */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple-600/10 rounded-full blur-[120px] animate-pulse-soft" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse-soft delay-700" />
      </div>

      <div className="container relative z-10 flex h-screen w-full items-center justify-center lg:grid lg:grid-cols-2 lg:gap-10">
        
        {/* --- LEFT: 3D TWIN PORTAL --- */}
        <div className="hidden lg:flex h-full w-full flex-col justify-center relative">
          <div className="absolute top-8 left-0">
             <Link href="/" className="flex items-center gap-2 group">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 border border-primary/10 group-hover:bg-primary/30 transition-colors">
                <Gauge className="h-5 w-5 text-primary" />
              </div>
              <span className="font-heading font-bold text-lg tracking-tight text-foreground">
                <span className="text-primary">Forti</span>Twin
              </span>
            </Link>
          </div>

          <div className="relative w-full h-[600px]">
            {/* The 3D Scene */}
            <SplineScene scene="https://prod.spline.design/qIjHRYzrDY-SIfdj/scene.splinecode" />
            
            {/* Context Overlay */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="absolute bottom-10 left-10 max-w-sm glass-panel p-6 rounded-2xl border-white/5"
            >
              <h3 className="text-white font-heading font-bold text-lg mb-1">
                {isPasswordFocused ? "🙈 Don't worry, I'm not looking." : "Ready to code?"}
              </h3>
              <p className="text-muted-foreground text-sm">
                Your AI Twin is ready to assist you with today's technical challenges.
              </p>
            </motion.div>
          </div>
        </div>

        {/* --- RIGHT: GLASS LOGIN FORM --- */}
        <div className="flex w-full items-center justify-center p-4">
          <div className="absolute top-4 right-4 lg:top-8 lg:right-8">
            <ModeToggle />
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full max-w-md"
          >
            <Card variant="glass" className="border-white/10 bg-black/40 backdrop-blur-2xl shadow-2xl">
              <CardHeader className="text-center space-y-1 pb-2">
                <div className="flex justify-center mb-4 lg:hidden">
                  <Gauge className="h-10 w-10 text-primary animate-pulse-soft" />
                </div>
                <CardTitle className="text-2xl font-bold tracking-tight text-white">
                  Access Portal
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Enter your credentials to sync with the network
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Email</Label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="engineer@fortitwin.com" 
                        className="pl-10" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        required 
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Password</Label>
                      <Link href="#" className="text-xs text-primary hover:text-primary/80 transition-colors">
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      <Input 
                        id="password" 
                        type="password" 
                        placeholder="••••••••" 
                        className="pl-10" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setIsPasswordFocused(true)}
                        onBlur={() => setIsPasswordFocused(false)}
                        required 
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    variant="neon" 
                    className="w-full mt-2 font-bold tracking-wide" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Authenticating...
                      </>
                    ) : (
                      <>
                        Initialize Session <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>

              <CardFooter className="flex-col gap-5 pt-0">
                <div className="relative w-full">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-transparent px-2 text-muted-foreground/50 backdrop-blur-sm">
                      Or connect via
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 w-full">
                  <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 hover:text-white transition-all hover:-translate-y-0.5">
                    <Github className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 hover:text-white transition-all hover:-translate-y-0.5">
                    <Twitter className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 hover:text-white transition-all hover:-translate-y-0.5">
                    <Linkedin className="h-4 w-4" />
                  </Button>
                </div>

                <div className="text-center text-sm text-muted-foreground mt-2">
                  New to FortiTwin?{" "}
                  <Link href="/signup" className="text-primary hover:text-primary/80 font-semibold underline underline-offset-4 transition-colors">
                    Create Identity
                  </Link>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}