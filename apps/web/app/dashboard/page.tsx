"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Flame,
  Trophy,
  Target,
  Zap,
  ArrowRight,
  Calendar,
  Clock,
  Play,
  Code2,
  Sparkles,
  AlertTriangle,
  Loader2,
  CheckCircle2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card"; // Assuming you have your custom Card with variants
import { Progress } from "@/components/ui/progress";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

// --- Types ---
type Assessment = {
  id: string;
  status: string; // "PENDING" | "COMPLETED"
  createdAt: string;
  technicalAssessment: {
    score?: number | null;
  } | null;
  behavioralInterview: {} | null;
  report: { id: string } | null;
};

// --- Animations ---
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const userName = user?.name?.split(" ")[0] || "Candidate";

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Data Fetching ---
  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch("/api/candidate/assessments", {
          credentials: "include",
        });

        if (response.status === 401 || response.status === 403) {
          router.push("/login");
          return;
        }

        if (!response.ok) {
          setAssessments([]); // Fallback to empty
          return;
        }

        const data: Assessment[] = await response.json();
        setAssessments(data);
      } catch (err) {
        console.error(err);
        setAssessments([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchAssessments();
    }
  }, [user, router]);

  // --- Derived State ---
  const upcomingAssessments = assessments.filter((a) => a.status === "PENDING");
  const completedAssessments = assessments.filter((a) => a.status === "COMPLETED");
  
  // Stats Calculation
  const totalCompleted = completedAssessments.length;
  
  // Calculate Average Score (Safely)
  const scoreSum = completedAssessments.reduce((acc, curr) => {
    return acc + (curr.technicalAssessment?.score || 0);
  }, 0);
  const avgScore = totalCompleted > 0 ? Math.round(scoreSum / totalCompleted) : 0;

  // XP Calculation (Mock logic: 100 XP per completed interview)
  const currentXP = totalCompleted * 150; 
  const nextLevelXP = 1000; // Static goal for now
  const xpProgress = Math.min((currentXP / nextLevelXP) * 100, 100);

  // Determine Main Mission (First pending, or generic placeholder)
  const currentMission = upcomingAssessments[0];

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={container}
      className="space-y-8 pb-8 font-body"
    >
      {/* --- HEADER SECTION --- */}
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-white">
            Mission Control
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">
            Welcome back, <span className="text-primary font-semibold">{userName}</span>. Systems online.
          </p>
        </div>

        {/* Global XP Bar */}
        <Card className="p-4 w-full md:w-80 flex flex-col gap-2 border-primary/20 bg-primary/5 backdrop-blur-sm">
          <div className="flex justify-between text-xs font-bold uppercase tracking-wider font-heading">
            <span className="text-primary">Level {Math.floor(totalCompleted / 5) + 1}</span>
            <span className="text-muted-foreground">{currentXP} / {nextLevelXP} XP</span>
          </div>
          <Progress 
            value={xpProgress} 
            className="h-2 bg-primary/10" 
            // Note: If your UI library supports custom indicator class via prop:
            // indicatorClassName="bg-gradient-to-r from-primary to-purple-400"
          />
        </Card>
      </motion.div>

      {/* --- STATS OVERVIEW --- */}
      <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Streak (Mocked for visual, or link to backend later) */}
        <StatsCard 
          icon={<Flame className="h-5 w-5 text-orange-500 animate-pulse-soft" />}
          bgClass="bg-orange-500/20"
          borderHover="hover:border-orange-500/30"
          value={`${totalCompleted > 0 ? "3" : "0"} Days`}
          label="Current Streak"
          decorator={<Flame className="w-16 h-16 text-orange-500" />}
        />

        {/* Avg Score */}
        <StatsCard 
          icon={<Target className="h-5 w-5 text-blue-500" />}
          bgClass="bg-blue-500/20"
          borderHover="hover:border-blue-500/30"
          value={`${avgScore}%`}
          label="Avg. Score"
        />

        {/* Total Interviews */}
        <StatsCard 
          icon={<Zap className="h-5 w-5 text-purple-500" />}
          bgClass="bg-purple-500/20"
          borderHover="hover:border-purple-500/30"
          value={totalCompleted.toString()}
          label="Interviews Done"
        />

        {/* Leaderboard (Mocked) */}
        <StatsCard 
          icon={<Trophy className="h-5 w-5 text-green-500" />}
          bgClass="bg-green-500/20"
          borderHover="hover:border-green-500/30"
          value={avgScore > 80 ? "Top 10%" : "Top 30%"}
          label="Leaderboard"
        />
      </motion.div>

      {/* --- BENTO GRID LAYOUT --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[500px]">
        
        {/* MAIN ACTION: Start Interview (2/3 width) */}
        <motion.div variants={item} className="lg:col-span-2 h-full">
          <Card className="h-full p-8 relative overflow-hidden flex flex-col justify-between group border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 hover:bg-primary/10 transition-all duration-500">
            {/* Background Graphic */}
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/20 blur-[100px] rounded-full pointer-events-none group-hover:bg-primary/30 transition-all duration-500" />

            {/* Dynamic Content based on Pending Assessment */}
            {currentMission ? (
               <ActiveMissionContent assessment={currentMission} />
            ) : (
               <NewMissionContent />
            )}
          </Card>
        </motion.div>

        {/* SIDEBAR: Recent Activity & Quick Actions (1/3 width) */}
        <motion.div variants={item} className="h-full flex flex-col gap-6">
          
          {/* Upcoming List */}
          <Card className="flex-1 p-6 flex flex-col border-white/5 bg-black/20 backdrop-blur-md">
            <h3 className="font-heading font-bold text-lg mb-4 flex items-center gap-2 text-white">
              <Calendar className="w-5 h-5 text-primary" /> 
              {upcomingAssessments.length > 1 ? "Also Pending" : "History"}
            </h3>
            
            <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-[100px]">
              {upcomingAssessments.length > 1 ? (
                 upcomingAssessments.slice(1).map((assessment) => (
                    <SmallAssessmentItem key={assessment.id} assessment={assessment} />
                 ))
              ) : completedAssessments.length > 0 ? (
                 completedAssessments.slice(0, 3).map((assessment) => (
                    <SmallHistoryItem key={assessment.id} assessment={assessment} />
                 ))
              ) : (
                <div className="text-sm text-muted-foreground text-center py-8">
                   No other activity yet.
                </div>
              )}
            </div>
            
            <Button variant="ghost" asChild className="w-full mt-4 text-xs uppercase tracking-wider text-muted-foreground hover:text-white hover:bg-white/5">
              <Link href="/dashboard/interviews">View All History</Link>
            </Button>
          </Card>

          {/* Quick Practice / Daily Coding */}
          <Card className="p-6 border-white/5 relative overflow-hidden group bg-card/50">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-heading font-bold text-lg text-white">Quick Practice</h3>
                <Code2 className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-sm text-muted-foreground mb-5 font-body">
                Keep your mind sharp. Solve a random algorithmic challenge.
              </p>
              <Button 
                variant="outline" 
                asChild
                className="w-full border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-400 hover:border-blue-500/50 transition-all group-hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]"
              >
                <Link href="/technical-assessment/new">
                   <Play className="w-3 h-3 mr-2 fill-current" /> Solve Random
                </Link>
              </Button>
            </div>
          </Card>

        </motion.div>
      </div>
    </motion.div>
  );
}

// --- Sub-Components for Cleanliness ---

function StatsCard({ icon, bgClass, borderHover, value, label, decorator }: any) {
  return (
    <Card className={cn("p-5 flex flex-col gap-4 relative overflow-hidden group transition-colors border-white/5 bg-card/40 backdrop-blur-md", borderHover)}>
      {decorator && (
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
          {decorator}
        </div>
      )}
      <div className={cn("h-10 w-10 rounded-full flex items-center justify-center", bgClass)}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-white font-heading">{value}</div>
        <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{label}</div>
      </div>
    </Card>
  )
}

function ActiveMissionContent({ assessment }: { assessment: Assessment }) {
  const isBehavioral = !!assessment.behavioralInterview;
  const title = isBehavioral ? "Behavioral Interview" : "Technical Assessment";
  const desc = isBehavioral 
    ? "Continue your soft skills evaluation with our AI agent." 
    : "Resume your coding challenge. Time is ticking!";
  
  const link = isBehavioral 
    ? `/take-interview/${assessment.id}` 
    : `/technical-assessment/${assessment.id}`;

  return (
    <>
      <div className="relative z-10 space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-warning/20 text-warning text-xs font-bold uppercase tracking-wider border border-warning/20 backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-warning"></span>
          </span>
          In Progress
        </div>
        
        <div className="space-y-2">
          <h2 className="text-3xl md:text-5xl font-heading font-bold text-white leading-tight">
            Resume: <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-warning to-orange-400 animate-gradient-x">
              {title}
            </span>
          </h2>
          <p className="text-muted-foreground max-w-lg text-lg font-body leading-relaxed">
            {desc}
          </p>
        </div>
      </div>

      <div className="relative z-10 pt-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <Button size="xl" className="group shadow-glow-primary bg-warning hover:bg-warning/90 text-black" asChild>
          <Link href={link}>
            Resume Session
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>
        <div className="flex items-center gap-6 text-sm text-muted-foreground font-medium">
          <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-warning" /> ~30 min left</span>
        </div>
      </div>
    </>
  )
}

function NewMissionContent() {
  return (
    <>
      <div className="relative z-10 space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider border border-primary/20 backdrop-blur-md">
          <Sparkles className="w-3 h-3" />
          Recommended Mission
        </div>
        
        <div className="space-y-2">
          <h2 className="text-3xl md:text-5xl font-heading font-bold text-white leading-tight">
            New Challenge: <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400 animate-gradient-x">
              System Design & DSA
            </span>
          </h2>
          <p className="text-muted-foreground max-w-lg text-lg font-body leading-relaxed">
            Start a new full-stack interview simulation. Test your coding speed and architectural thinking.
          </p>
        </div>
      </div>

      <div className="relative z-10 pt-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <Button size="xl" variant="default" asChild className="group shadow-glow-primary">
          <Link href="/technical-assessment/new">
            Start Simulation
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>
        <div className="flex items-center gap-6 text-sm text-muted-foreground font-medium">
          <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> 45 min</span>
          <span className="flex items-center gap-2"><Target className="w-4 h-4 text-primary" /> Med/Hard</span>
        </div>
      </div>
    </>
  )
}

function SmallAssessmentItem({ assessment }: { assessment: Assessment }) {
  const isBehavioral = !!assessment.behavioralInterview;
  const link = isBehavioral ? `/take-interview/${assessment.id}` : `/technical-assessment/${assessment.id}`;

  return (
    <Link href={link} className="block p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-primary/20 transition-all cursor-pointer group">
      <div className="flex justify-between items-start mb-1">
        <span className="font-semibold text-white group-hover:text-primary transition-colors font-heading">
            {isBehavioral ? "Behavioral" : "Technical"} Round
        </span>
        <span className="text-[10px] text-muted-foreground bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
          PENDING
        </span>
      </div>
      <p className="text-xs text-muted-foreground mt-1 truncate">
        {new Date(assessment.createdAt).toLocaleDateString()}
      </p>
    </Link>
  )
}

function SmallHistoryItem({ assessment }: { assessment: Assessment }) {
    const score = assessment.technicalAssessment?.score || 0;
    const isPassed = score >= 70;

    return (
      <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group">
        <div className="flex justify-between items-start mb-1">
          <span className="font-semibold text-white group-hover:text-primary transition-colors font-heading">
             {assessment.technicalAssessment ? "Technical" : "Behavioral"}
          </span>
          <div className={cn("flex items-center gap-1 text-xs px-2 py-0.5 rounded-md border", isPassed ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20")}>
            {isPassed ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
            {score}%
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Completed on {new Date(assessment.createdAt).toLocaleDateString()}
        </p>
      </div>
    )
}