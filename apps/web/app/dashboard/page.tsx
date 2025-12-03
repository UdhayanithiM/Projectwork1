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
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// --- Types ---
type Assessment = {
  id: string;
  status: string; // "PENDING" | "IN_PROGRESS" | "COMPLETED" | "PASSED_TECH"
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
  const [isGenerating, setIsGenerating] = useState(false);

  // --- Data Fetching ---
  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        setIsLoading(true);
        // Note: You need to implement GET /api/candidate/assessments to return the list
        // For now, we assume this endpoint exists or will be built next.
        const response = await fetch("/api/candidate/assessments");

        if (response.status === 401 || response.status === 403) {
          router.push("/login");
          return;
        }

        if (!response.ok) {
          setAssessments([]); 
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

  // --- Logic: Handle "Start Mission" Click ---
  const handleStartMission = async () => {
    setIsGenerating(true);
    try {
      // Call our new Auto-Generate API
      const res = await fetch("/api/assessment/auto-generate", {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Failed to initialize mission");
      }

      const data = await res.json();
      
      if (data.success && data.assessmentId) {
        toast.success(data.message || "Mission Initialized");
        // Redirect to the Technical Assessment
        router.push(`/technical-assessment/${data.assessmentId}`);
      } else {
        toast.error("System Malfunction: Could not generate assessment.");
      }

    } catch (error) {
      toast.error("Network Error: Unable to reach command center.");
    } finally {
      setIsGenerating(false);
    }
  };

  // --- Derived State ---
  const upcomingAssessments = assessments.filter((a) => 
    ["PENDING", "IN_PROGRESS", "PASSED_TECH"].includes(a.status)
  );
  const completedAssessments = assessments.filter((a) => a.status === "COMPLETED");
  
  // Stats
  const totalCompleted = completedAssessments.length;
  const scoreSum = completedAssessments.reduce((acc, curr) => acc + (curr.technicalAssessment?.score || 0), 0);
  const avgScore = totalCompleted > 0 ? Math.round(scoreSum / totalCompleted) : 0;
  
  // XP
  const currentXP = totalCompleted * 150; 
  const nextLevelXP = 1000;
  const xpProgress = Math.min((currentXP / nextLevelXP) * 100, 100);

  // Main Mission Logic
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
      {/* --- HEADER --- */}
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-white">
            Mission Control
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">
            Welcome back, <span className="text-primary font-semibold">{userName}</span>. Systems online.
          </p>
        </div>

        {/* XP Bar */}
        <Card className="p-4 w-full md:w-80 flex flex-col gap-2 border-primary/20 bg-primary/5 backdrop-blur-sm">
          <div className="flex justify-between text-xs font-bold uppercase tracking-wider font-heading">
            <span className="text-primary">Level {Math.floor(totalCompleted / 5) + 1}</span>
            <span className="text-muted-foreground">{currentXP} / {nextLevelXP} XP</span>
          </div>
          <Progress value={xpProgress} className="h-2 bg-primary/10" />
        </Card>
      </motion.div>

      {/* --- STATS --- */}
      <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard 
          icon={<Flame className="h-5 w-5 text-orange-500 animate-pulse-soft" />}
          bgClass="bg-orange-500/20"
          borderHover="hover:border-orange-500/30"
          value={`${totalCompleted > 0 ? "3" : "0"} Days`}
          label="Current Streak"
          decorator={<Flame className="w-16 h-16 text-orange-500" />}
        />
        <StatsCard 
          icon={<Target className="h-5 w-5 text-blue-500" />}
          bgClass="bg-blue-500/20"
          borderHover="hover:border-blue-500/30"
          value={`${avgScore}%`}
          label="Avg. Score"
        />
        <StatsCard 
          icon={<Zap className="h-5 w-5 text-purple-500" />}
          bgClass="bg-purple-500/20"
          borderHover="hover:border-purple-500/30"
          value={totalCompleted.toString()}
          label="Interviews Done"
        />
        <StatsCard 
          icon={<Trophy className="h-5 w-5 text-green-500" />}
          bgClass="bg-green-500/20"
          borderHover="hover:border-green-500/30"
          value={avgScore > 80 ? "Top 10%" : "Top 30%"}
          label="Leaderboard"
        />
      </motion.div>

      {/* --- BENTO GRID --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[500px]">
        
        {/* MAIN MISSION CARD */}
        <motion.div variants={item} className="lg:col-span-2 h-full">
          <Card className="h-full p-8 relative overflow-hidden flex flex-col justify-between group border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 hover:bg-primary/10 transition-all duration-500">
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/20 blur-[100px] rounded-full pointer-events-none group-hover:bg-primary/30 transition-all duration-500" />

            {currentMission ? (
               <ActiveMissionContent assessment={currentMission} />
            ) : (
               <NewMissionContent onStart={handleStartMission} isStarting={isGenerating} />
            )}
          </Card>
        </motion.div>

        {/* SIDEBAR */}
        <motion.div variants={item} className="h-full flex flex-col gap-6">
          <Card className="flex-1 p-6 flex flex-col border-white/5 bg-black/20 backdrop-blur-md">
            <h3 className="font-heading font-bold text-lg mb-4 flex items-center gap-2 text-white">
              <Calendar className="w-5 h-5 text-primary" /> 
              History
            </h3>
            
            <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-[100px]">
              {completedAssessments.length > 0 ? (
                 completedAssessments.slice(0, 3).map((assessment) => (
                    <SmallHistoryItem key={assessment.id} assessment={assessment} />
                 ))
              ) : (
                <div className="text-sm text-muted-foreground text-center py-8">
                   No completed missions yet.
                </div>
              )}
            </div>
            
            <Button variant="ghost" className="w-full mt-4 text-xs uppercase tracking-wider text-muted-foreground hover:text-white hover:bg-white/5">
              View All
            </Button>
          </Card>

          {/* Quick Practice */}
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
                onClick={handleStartMission} // Reuse the start logic for now
                disabled={isGenerating}
                className="w-full border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-400 hover:border-blue-500/50 transition-all group-hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]"
              >
                {isGenerating ? <Loader2 className="w-3 h-3 mr-2 animate-spin"/> : <Play className="w-3 h-3 mr-2 fill-current" />} 
                Solve Random
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}

// --- Sub-Components ---

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
  // Logic: If they passed tech (or have interview pending), send to interview. Else tech.
  const isInterviewReady = assessment.status === "PASSED_TECH" || assessment.behavioralInterview;
  
  const title = isInterviewReady ? "Behavioral Interview" : "Technical Assessment";
  const desc = isInterviewReady 
    ? "Technical round passed. Initialize the AI Interviewer for the final phase." 
    : "Resume your coding challenge. Time is ticking!";
  
  const link = isInterviewReady 
    ? `/take-interview/${assessment.id}/intro` // Go to Mirror Room first!
    : `/technical-assessment/${assessment.id}`;

  const statusLabel = isInterviewReady ? "Interview Ready" : "In Progress";
  const statusColor = isInterviewReady ? "text-green-400 border-green-500/20 bg-green-500/10" : "text-warning border-warning/20 bg-warning/20";

  return (
    <>
      <div className="relative z-10 space-y-6">
        <div className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border backdrop-blur-md", statusColor)}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
          </span>
          {statusLabel}
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

function NewMissionContent({ onStart, isStarting }: { onStart: () => void, isStarting: boolean }) {
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
              AI-Generated Simulation
            </span>
          </h2>
          <p className="text-muted-foreground max-w-lg text-lg font-body leading-relaxed">
            Start a new full-stack interview simulation tailored to your resume skills and seniority level.
          </p>
        </div>
      </div>

      <div className="relative z-10 pt-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <Button 
            size="xl" 
            variant="default" 
            onClick={onStart}
            disabled={isStarting}
            className="group shadow-glow-primary"
        >
          {isStarting ? (
             <><Loader2 className="mr-2 h-5 w-5 animate-spin"/> Generating...</>
          ) : (
             <>Start Simulation <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" /></>
          )}
        </Button>
        <div className="flex items-center gap-6 text-sm text-muted-foreground font-medium">
          <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> 45 min</span>
          <span className="flex items-center gap-2"><Target className="w-4 h-4 text-primary" /> Adaptive</span>
        </div>
      </div>
    </>
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