// app/signup/page.tsx

"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { ArrowRight, Lock, Mail, User, Gauge } from "lucide-react"
import { toast } from "sonner"
import { ModeToggle } from "@/components/mode-toggle"
import { useAuthStore } from "@/stores/authStore"

const SignupIllustration = () => (
    <div className="w-full h-full">
      <Image
        src="/assets/image1-optimized.webp"
        alt="Signup Illustration"
        width={1200}
        height={1200}
        className="w-full h-full object-cover"
        priority
      />
    </div>
);

export default function SignupPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("STUDENT")
  const [acceptTerms, setAcceptTerms] = useState(false)
  const router = useRouter()
  
  const { register, isLoading, error } = useAuthStore();

  useEffect(() => {
    if (error) {
      toast.error("Registration Failed", {
        description: error,
      });
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptTerms) {
      toast.error("Error", { 
        description: "You must accept the terms and conditions." 
      });
      return;
    }
    
    const success = await register({ name, email, password, role });
    
    if (success) {
      toast.success("Account Created!", {
        description: "Welcome to FortiTwin. You can now log in.",
      });
      router.push("/login");
    }
  };

  return (
    <div className="w-full h-screen lg:grid lg:grid-cols-2 overflow-hidden">
        <div className="hidden lg:flex bg-muted items-center justify-center">
            <SignupIllustration />
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
                            <CardTitle className="text-2xl">Create an Account</CardTitle>
                            <CardDescription>Start your interview preparation journey today.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Form fields for name, email, password, role */}
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input id="name" placeholder="John Doe" className="pl-10" value={name} onChange={(e) => setName(e.target.value)} required />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input id="email" type="email" placeholder="you@example.com" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} required />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input id="password" type="password" placeholder="•••••••• (min 8 characters)" className="pl-10" value={password} onChange={(e) => setPassword(e.target.value)} required />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>I am a</Label>
                                    <RadioGroup value={role} onValueChange={setRole} className="flex gap-4 pt-1">
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="STUDENT" id="student" />
                                            <Label htmlFor="student" className="font-normal cursor-pointer">Student</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="HR" id="hr" />
                                            <Label htmlFor="hr" className="font-normal cursor-pointer">HR Professional</Label>
                                        </div>
                                    </RadioGroup>
                                </div>
                                
                                <div className="flex items-start space-x-2 pt-2">
                                    {/* <-- FIX: Added the 'boolean' type to the 'checked' parameter --> */}
                                    <Checkbox id="terms" checked={acceptTerms} onCheckedChange={(checked: boolean) => setAcceptTerms(checked)} />
                                    <div className="grid gap-1.5 leading-none">
                                        <Label htmlFor="terms" className="text-sm font-medium leading-none cursor-pointer">
                                            I agree to the{" "}
                                            <Link href="#" className="text-primary hover:underline">Terms of Service</Link>
                                        </Label>
                                    </div>
                                </div>
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? "Creating Account..." : "Create Account"}
                                    {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                                </Button>
                            </form>
                        </CardContent>
                        <CardFooter>
                            <p className="w-full text-center text-sm text-muted-foreground">
                                Already have an account?{" "}
                                <Link href="/login" className="text-primary hover:underline font-semibold">Sign in</Link>
                            </p>
                        </CardFooter>
                    </Card>
                </motion.div>
            </div>
        </div>
    </div>
  )
}