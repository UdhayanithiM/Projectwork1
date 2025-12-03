"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Video,
  Code2,
  Sparkles,
  CheckCircle2,
  Play,
  Trophy,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Navbar } from "@/components/layout/Navbar";

const SplineScene = dynamic(() => import("@/components/SplineScene"), {
  ssr: false,
});





export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden selection:bg-primary/20 font-body">
      <Navbar />

      {/* --- GLOBAL AURA BACKGROUND --- */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px] animate-pulse-soft" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse-soft delay-1000" />
        <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-[100px] animate-float" />
      </div>

      <main className="flex flex-col">
        {/* --- HERO SECTION --- */}
        <section className="relative pt-20 pb-32 md:pt-32 md:pb-48 container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* TEXT CONTENT */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="space-y-8 text-center lg:text-left z-10"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Badge
                  variant="outline"
                  className="px-4 py-1.5 text-sm border-primary/20 bg-primary/10 text-primary backdrop-blur-md animate-fade-in"
                >
                  <Sparkles className="w-3 h-3 mr-2 fill-primary" />
                  The #1 AI Interview Platform
                </Badge>
              </motion.div>

              <h1 className="text-5xl md:text-7xl font-heading font-bold tracking-tight leading-[1.1]">
                Master Your <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-blue-400 animate-gradient-x">
                  Dream Interview
                </span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Practice with our{" "}
                <span className="text-white font-semibold">Holographic AI Agent</span>
                , solve real-world coding challenges, and get instant feedback to land your next role.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                <Button size="xl" variant="neon" asChild className="w-full sm:w-auto">
                  <Link href="/signup">
                    Start Practicing Free{" "}
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button size="xl" variant="glass" asChild className="w-full sm:w-auto">
                  <Link href="/features">
                    <Play className="mr-2 h-5 w-5 fill-current" />
                    Watch Demo
                  </Link>
                </Button>
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-6 pt-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" /> 10k+ Students
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" /> Real-time Feedback
                </div>
              </div>
            </motion.div>

            {/* 3D VISUAL */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="relative h-[500px] w-full hidden lg:block"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent rounded-[2rem] blur-3xl opacity-30" />

              <div className="w-full h-full relative z-10 glass-panel rounded-3xl overflow-hidden border-white/5">
                <SplineScene scene="https://prod.spline.design/qIjHRYzrDY-SIfdj/scene.splinecode" />

              </div>

              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-10 -left-10 z-20"
              >
                <Card variant="glass" className="p-4 flex items-center gap-3 w-auto">
                  <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Code2 className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Coding Score</p>
                    <p className="font-bold text-white">98/100</p>
                  </div>
                </Card>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-20 -right-5 z-20"
              >
                <Card variant="glass" className="p-4 flex items-center gap-3 w-auto">
                  <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Trophy className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Streak</p>
                    <p className="font-bold text-white">12 Days 🔥</p>
                  </div>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* --- BENTO SECTION --- */}
        <section className="py-24 relative">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6">
                Your Personal <span className="text-gradient">Mission Control</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                Track progress, unlock achievements, and grow faster.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <Card variant="interactive" className="md:col-span-2 p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Video className="w-32 h-32" />
                </div>
                <div className="relative z-10">
                  <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center mb-6">
                    <Video className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">AI Twin Interviewer</h3>
                  <p className="text-muted-foreground max-w-md">
                    Realistic mock interviews with an AI-powered 3D agent.
                  </p>
                </div>
              </Card>

              {/* Feature 2 */}
              <Card variant="interactive" className="p-8 group bg-gradient-to-br from-card to-primary/5">
                <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-6">
                  <Code2 className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Live IDE</h3>
                <p className="text-muted-foreground text-sm">Full-featured coding challenges with real execution.</p>
              </Card>

              {/* Feature 3 */}
              <Card variant="interactive" className="p-8 group">
                <div className="h-12 w-12 rounded-xl bg-orange-500/20 flex items-center justify-center mb-6">
                  <Zap className="w-6 h-6 text-orange-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Gamified Growth</h3>
                <p className="text-muted-foreground text-sm">Earn XP, maintain streaks, and level up.</p>
              </Card>

              {/* Feature 4 */}
              <Card variant="interactive" className="md:col-span-2 p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-grid-white/5 mask-image-b-0" />
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">Detailed Analytics</h3>
                    <p className="text-muted-foreground max-w-sm">
                      Get a performance breakdown and personalized improvements.
                    </p>
                  </div>
                  <Button variant="glass" className="shrink-0">View Sample Report</Button>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* --- CTA SECTION --- */}
        <section className="py-24 container relative">
          <div className="absolute inset-0 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
          <Card variant="glass" className="relative p-12 md:p-20 text-center overflow-hidden border-primary/30">
            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6 text-white">Ready to Level Up?</h2>
              <p className="text-xl text-muted-foreground mb-10">
                Join thousands of engineers improving daily with FortiTwin.
              </p>
              <Button size="xl" variant="neon" asChild>
                <Link href="/signup">Get Started for Free</Link>
              </Button>
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
}
