"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { 
  Gauge, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  Briefcase, 
  GraduationCap,
  Loader2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { ModeToggle } from "@/components/mode-toggle";
import { cn } from "@/lib/utils";

// Lazy load Spline
const SplineScene = dynamic(() => import("@/components/SplineScene"), {
  ssr: false,
});

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"STUDENT" | "HR">("STUDENT");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [strength, setStrength] = useState(0);
  
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuthStore();

  // Password Strength Calculator
  useEffect(() => {
    let score = 0;
    if (password.length > 4) score += 25;
    if (password.length > 8) score += 25;
    if (/[A-Z]/.test(password)) score += 25;
    if (/[0-9!@#$%^&*]/.test(password)) score += 25;
    setStrength(score);
  }, [password]);

  useEffect(() => {
    if (error) {
      toast.error("Registration Failed", { description: error });
      clearError();
    }
  }, [error, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!acceptTerms) {
      toast.warning("Terms Required", { 
        description: "Please accept the terms to create your identity." 
      });
      return;
    }
    
    const loadingToast = toast.loading("Creating secure identity...");
    const success = await register({ name, email, password, role });
    toast.dismiss(loadingToast);
    
    if (success) {
      toast.success("Identity Created!", {
        description: "Welcome to the network. Redirecting to login...",
      });
      setTimeout(() => router.push("/login"), 1500);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background relative overflow-hidden font-body selection:bg-primary/30">
      
      {/* --- AURA BACKGROUND (Layered with Layout's aura) --- */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-50">
        <div className="absolute top-[10%] right-[10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[100px] animate-pulse-soft" />
      </div>

      <div className="container relative z-10 flex h-screen w-full items-center justify-center lg:grid lg:grid-cols-2 lg:gap-10">
        
        {/* --- LEFT: 3D VISUAL --- */}
        <div className="hidden lg:flex h-full w-full flex-col justify-center relative order-2 lg:order-1">
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
            <SplineScene scene="https://prod.spline.design/qIjHRYzrDY-SIfdj/scene.splinecode" />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="absolute bottom-20 right-10 max-w-xs glass-panel p-5 rounded-2xl border-white/5"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Join the Elite</p>
                  <p className="text-xs text-muted-foreground">10,000+ Engineers</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* --- RIGHT: SIGNUP FORM --- */}
        <div className="flex w-full items-center justify-center p-4 order-1 lg:order-2">
          <div className="absolute top-4 right-4 lg:top-8 lg:right-8">
            <ModeToggle />
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-lg"
          >
            <Card variant="glass" className="border-white/10 bg-black/40 backdrop-blur-2xl shadow-2xl">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-2xl font-bold tracking-tight text-white">
                  Initialize Profile
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Create your FortiTwin identity to begin the assessment.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  
                  {/* Role Selection Cards */}
                  <div className="grid grid-cols-2 gap-4 mb-2">
                    <div 
                      onClick={() => setRole("STUDENT")}
                      className={cn(
                        "cursor-pointer rounded-xl border p-4 flex flex-col items-center gap-2 transition-all duration-200 hover:bg-white/5",
                        role === "STUDENT" 
                          ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(124,58,237,0.2)]" 
                          : "border-white/10 bg-transparent text-muted-foreground"
                      )}
                    >
                      <GraduationCap className={cn("h-6 w-6", role === "STUDENT" ? "text-primary" : "text-muted-foreground")} />
                      <span className="text-xs font-bold uppercase tracking-wider">Candidate</span>
                    </div>
                    
                    <div 
                      onClick={() => setRole("HR")}
                      className={cn(
                        "cursor-pointer rounded-xl border p-4 flex flex-col items-center gap-2 transition-all duration-200 hover:bg-white/5",
                        role === "HR" 
                          ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(124,58,237,0.2)]" 
                          : "border-white/10 bg-transparent text-muted-foreground"
                      )}
                    >
                      <Briefcase className={cn("h-6 w-6", role === "HR" ? "text-primary" : "text-muted-foreground")} />
                      <span className="text-xs font-bold uppercase tracking-wider">Recruiter</span>
                    </div>
                  </div>

                  {/* Name Field */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative group">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      <Input 
                        id="name" 
                        placeholder="Alex Chen" 
                        className="pl-10" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        required 
                      />
                    </div>
                  </div>

                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="alex@example.com" 
                        className="pl-10" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        required 
                      />
                    </div>
                  </div>

                  {/* Password Field & Strength Meter */}
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      <Input 
                        id="password" 
                        type="password" 
                        placeholder="••••••••" 
                        className="pl-10" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                      />
                    </div>
                    {/* Visual Strength Meter */}
                    <div className="h-1 w-full bg-muted/30 rounded-full overflow-hidden mt-2">
                      <motion.div 
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          strength < 50 ? "bg-red-500" : strength < 100 ? "bg-yellow-500" : "bg-green-500 shadow-[0_0_10px_#22c55e]"
                        )}
                        initial={{ width: 0 }}
                        animate={{ width: `${strength}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground text-right">
                      {strength < 50 ? "Weak" : strength < 100 ? "Medium" : "Strong"} Protection
                    </p>
                  </div>

                  {/* Terms Checkbox */}
                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox
                    id="terms"
                    checked={acceptTerms} 
                    onCheckedChange={(checked: boolean | "indeterminate") =>
                        setAcceptTerms(checked === true)
                    }
                    className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                    />
   
                    <label
                      htmlFor="terms"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground"
                    >
                      I accept the <Link href="#" className="text-primary hover:underline">Terms of Service</Link>
                    </label>
                  </div>

                  <Button 
                    type="submit" 
                    variant="neon" 
                    className="w-full mt-4 font-bold tracking-wide" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                      </>
                    ) : (
                      <>
                        Create Account <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>

              <CardFooter className="justify-center border-t border-white/5 pt-6">
                <p className="text-sm text-muted-foreground">
                  Already have an identity?{" "}
                  <Link href="/login" className="text-primary hover:text-primary/80 font-semibold underline underline-offset-4 transition-colors">
                    Access Portal
                  </Link>
                </p>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}