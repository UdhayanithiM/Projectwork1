"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
// ❌ We no longer need useRouter here
// import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { ArrowRight, Lock, Mail, Github, Linkedin, Twitter, Gauge } from "lucide-react"
import { toast } from "sonner"
import { ModeToggle } from "@/components/mode-toggle"
import { useAuthStore } from "@/stores/authStore"

const LoginIllustration = () => (
    <div className="w-full h-full">
      <Image
        src="/assets/image1-optimized.webp"
        alt="Login Illustration"
        width={1200}
        height={1200}
        className="w-full h-full object-cover"
        priority
      />
    </div>
);

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  // ❌ const router = useRouter()
  
  const { login, isLoading, error, clearError } = useAuthStore();

  useEffect(() => {
    if (error) {
      toast.error("Login Failed", {
        description: error,
      });
      clearError();
    }
  }, [error, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = await login({ email, password });
    
    if (success) {
      toast.success("Login Successful!", {
        description: "Welcome back to FortiTwin. Redirecting...",
      });
      const user = useAuthStore.getState().user;
      if (user) {
         // ✅ FIXED: Use window.location.href for a full page reload
         // This ensures the cookie is set before the next page loads.
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
      }
    }
  };

  return (
    <div className="w-full h-screen lg:grid lg:grid-cols-2 overflow-hidden">
        <div className="hidden lg:flex bg-muted items-center justify-center">
            <LoginIllustration />
        </div>
        <div className="flex flex-col items-center justify-center p-6 sm:p-8 overflow-y-auto">
            <div className="absolute top-6 right-6 flex items-center gap-4">
                <ModeToggle />
            </div>
            <div className="w-full max-w-md my-auto">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Card>
                        <CardHeader className="text-center">
                            <div className="flex justify-center items-center gap-2 mb-4">
                                <Gauge className="h-8 w-8 text-primary" />
                                <h1 className="text-3xl font-bold">
                                    <span className="text-primary">Forti</span>Twin
                                </h1>
                            </div>
                            <CardTitle className="text-2xl">Welcome Back!</CardTitle>
                            <CardDescription>Sign in to continue your journey.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input id="email" type="email" placeholder="you@example.com" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} required />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password">Password</Label>
                                        <Link href="#" className="text-sm text-primary hover:underline">Forgot password?</Link>
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input id="password" type="password" placeholder="••••••••" className="pl-10" value={password} onChange={(e) => setPassword(e.target.value)} required />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? "Signing in..." : "Sign In"}
                                    {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                                </Button>
                            </form>
                        </CardContent>
                        <CardFooter className="flex-col gap-4">
                            <div className="relative w-full">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3 w-full">
                                <Button variant="outline"><Github className="h-4 w-4" /></Button>
                                <Button variant="outline"><Twitter className="h-4 w-4" /></Button>
                                <Button variant="outline"><Linkedin className="h-4 w-4" /></Button>
                            </div>
                            <p className="text-center text-sm text-muted-foreground">
                                Don't have an account?{" "}
                                <Link href="/signup" className="text-primary hover:underline font-semibold">Sign up</Link>
                            </p>
                        </CardFooter>
                    </Card>
                </motion.div>
            </div>
        </div>
    </div>
  )
}

