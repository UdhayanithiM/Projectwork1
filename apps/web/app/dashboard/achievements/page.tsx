"use client";

import { motion } from "framer-motion";
import { 
  Trophy, Lock, Unlock, Zap, Target, Code2, BrainCircuit, Rocket,
  Crown, HelpCircle, Gamepad2, Cpu, Server, Play, CheckCircle2, RotateCcw
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

// --- Types ---
type Rarity = "common" | "rare" | "epic" | "legendary";

type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  status: "locked" | "unlocked";
  rarity: Rarity;
  dateUnlocked?: string;
  xp: number;
  secret?: boolean; 
};

// --- Mock Data ---
const achievements: Achievement[] = [
  {
    id: "1",
    title: "First Contact",
    description: "Complete your first interview session successfully.",
    icon: Rocket,
    status: "unlocked",
    rarity: "common",
    dateUnlocked: "2 days ago",
    xp: 100
  },
  {
    id: "2",
    title: "Code Warrior",
    description: "Solve 5 technical assessments with >90% accuracy.",
    icon: Code2,
    status: "unlocked",
    rarity: "rare",
    dateUnlocked: "Yesterday",
    xp: 500
  },
  {
    id: "3", // TIED TO REGEX RUNNER
    title: "Neural Sync",
    description: "Write flawless Regular Expressions to filter target data.",
    icon: BrainCircuit,
    status: "locked", // Change to "unlocked" to see the game card update!
    rarity: "epic",
    xp: 1000
  },
  {
    id: "4",
    title: "Streak Master",
    description: "Keep a 7-day practice streak alive.",
    icon: Zap,
    status: "unlocked",
    rarity: "rare",
    dateUnlocked: "Today",
    xp: 300
  },
  {
    id: "5",
    title: "Perfect Pitch",
    description: "Score 10/10 on soft skills Communication.",
    icon: Target,
    status: "locked",
    rarity: "legendary",
    xp: 2000
  },
  {
    id: "6", // TIED TO SYSTEM ARCHITECT
    title: "The Architect",
    description: "Successfully deploy a scalable Read-Pipeline in System Architect.",
    icon: Crown,
    status: "locked", // Change to "unlocked" to see the game card update!
    rarity: "legendary",
    xp: 5000,
    secret: true
  },
  {
    id: "7", // TIED TO NEURAL MATRIX
    title: "Node Synchronizer",
    description: "Clear the Neural Matrix memory system with a flawless rating.",
    icon: Cpu,
    status: "locked", // Change to "unlocked" to see the game card update!
    rarity: "epic",
    xp: 1500,
  }
];

// --- Animation Variants ---
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const item = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", bounce: 0.3 } }
};

export default function AchievementsPage() {
  const totalXP = achievements.reduce((acc, curr) => curr.status === "unlocked" ? acc + curr.xp : acc, 0);
  const unlockedCount = achievements.filter(a => a.status === "unlocked").length;
  const nextLevelXP = 3000;
  const progress = Math.min((totalXP / nextLevelXP) * 100, 100);
  const currentLevel = Math.floor(totalXP / 1000) + 1;

  // Check Game Unlock Statuses based on Achievement IDs
  const isNeuralMatrixBeaten = achievements.find(a => a.id === "7")?.status === "unlocked";
  const isSystemArchitectBeaten = achievements.find(a => a.id === "6")?.status === "unlocked";
  const isRegexRunnerBeaten = achievements.find(a => a.id === "3")?.status === "unlocked";

  return (
    <div className="space-y-10 pb-10 min-h-screen">
      
      {/* --- HUD HEADER --- */}
      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row gap-8 lg:items-end justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-white tracking-tight">
              Trophy <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">Cabinet</span>
            </h1>
            <p className="text-muted-foreground font-body text-lg max-w-xl leading-relaxed">
              Your hall of fame. Collect badges to override system limits and showcase your mastery.
            </p>
          </div>
          
          <GlassPanel className="w-full lg:w-[400px] p-6 border-primary/20 bg-black/40 relative overflow-hidden group">
             <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/20 blur-[50px] rounded-full group-hover:bg-primary/30 transition-all duration-700" />
             <div className="relative z-10 flex justify-between items-end mb-4">
                <div>
                   <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Current Status</div>
                   <div className="text-3xl font-heading font-bold text-white">Level {currentLevel}</div>
                </div>
                <div className="text-right">
                   <Trophy className="w-8 h-8 text-yellow-500 mb-1 ml-auto" />
                   <div className="text-xs font-mono text-yellow-500 font-bold">{unlockedCount} / {achievements.length} Unlocked</div>
                </div>
             </div>
             <div className="space-y-2">
                <Progress value={progress} className="h-2 bg-white/10" indicatorClassName="bg-gradient-to-r from-primary via-purple-500 to-blue-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                <div className="flex justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                  <span>{totalXP} XP</span>
                  <span className="text-white/50">{nextLevelXP} XP (Next Level)</span>
                </div>
             </div>
          </GlassPanel>
        </div>
      </div>

      {/* --- ARCADE BOUNTIES GRID --- */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-2">
          <Gamepad2 className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-xl font-bold text-white">Arcade Bounties</h2>
        </div>
        
        {/* Responsive Grid for the 3 Games */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Game 1: Neural Matrix */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-transparent p-6 group flex flex-col justify-between">
            <div className="absolute right-0 top-0 -mt-10 -mr-10 h-32 w-32 rounded-full bg-purple-500/20 blur-[50px] group-hover:bg-purple-500/30 transition-colors" />
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-purple-500/20 rounded-lg border border-purple-500/30 text-purple-400">
                  <Cpu className="w-6 h-6" />
                </div>
                {isNeuralMatrixBeaten ? (
                  <span className="flex items-center gap-1 rounded-full bg-green-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-green-400 border border-green-500/30">
                    <CheckCircle2 className="w-3 h-3" /> Bounty Claimed
                  </span>
                ) : (
                  <span className="rounded-full bg-purple-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-300 border border-purple-500/30">
                    Epic Bounty
                  </span>
                )}
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 font-heading">Neural Matrix</h3>
              <p className="text-sm text-purple-200/70 mb-6 font-mono">Synchronize the core memory nodes to unlock the Node Synchronizer badge.</p>
            </div>
            <Link href="/dashboard/achievements/memory-match" className="relative z-10 mt-auto">
              <Button className={cn("w-full font-bold shadow-lg transition-all", isNeuralMatrixBeaten ? "bg-white/10 hover:bg-white/20 text-white" : "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/40")}>
                {isNeuralMatrixBeaten ? <><RotateCcw className="w-4 h-4 mr-2" /> Replay Matrix</> : <><Play className="w-4 h-4 mr-2 fill-current" /> Enter Matrix</>}
              </Button>
            </Link>
          </motion.div>

          {/* Game 2: System Architect */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative overflow-hidden rounded-xl border border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-transparent p-6 group flex flex-col justify-between">
            <div className="absolute right-0 top-0 -mt-10 -mr-10 h-32 w-32 rounded-full bg-blue-500/20 blur-[50px] group-hover:bg-blue-500/30 transition-colors" />
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-500/20 rounded-lg border border-blue-500/30 text-blue-400">
                  <Server className="w-6 h-6" />
                </div>
                {isSystemArchitectBeaten ? (
                  <span className="flex items-center gap-1 rounded-full bg-green-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-green-400 border border-green-500/30">
                    <CheckCircle2 className="w-3 h-3" /> Bounty Claimed
                  </span>
                ) : (
                  <span className="rounded-full bg-yellow-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-yellow-400 border border-yellow-500/30">
                    Legendary Bounty
                  </span>
                )}
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 font-heading">System Architect</h3>
              <p className="text-sm text-blue-200/70 mb-6 font-mono">Deploy a flawless, scalable architecture to claim The Architect title.</p>
            </div>
            <Link href="/dashboard/achievements/system-architect" className="relative z-10 mt-auto">
              <Button className={cn("w-full font-bold shadow-lg transition-all", isSystemArchitectBeaten ? "bg-white/10 hover:bg-white/20 text-white" : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/40")}>
                {isSystemArchitectBeaten ? <><RotateCcw className="w-4 h-4 mr-2" /> Replay Blueprint</> : <><Play className="w-4 h-4 mr-2 fill-current" /> Access Blueprint</>}
              </Button>
            </Link>
          </motion.div>

          {/* Game 3: Regex Runner */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="relative overflow-hidden rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-transparent p-6 group flex flex-col justify-between">
            <div className="absolute right-0 top-0 -mt-10 -mr-10 h-32 w-32 rounded-full bg-emerald-500/20 blur-[50px] group-hover:bg-emerald-500/30 transition-colors" />
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-emerald-500/20 rounded-lg border border-emerald-500/30 text-emerald-400">
                  <BrainCircuit className="w-6 h-6" />
                </div>
                {isRegexRunnerBeaten ? (
                  <span className="flex items-center gap-1 rounded-full bg-green-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-green-400 border border-green-500/30">
                    <CheckCircle2 className="w-3 h-3" /> Bounty Claimed
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300 border border-emerald-500/30">
                    Epic Bounty
                  </span>
                )}
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 font-heading">Regex Runner</h3>
              <p className="text-sm text-emerald-200/70 mb-6 font-mono">Beat the clock writing Regular Expressions to achieve Neural Sync.</p>
            </div>
            <Link href="/dashboard/achievements/regex-runner" className="relative z-10 mt-auto">
              <Button className={cn("w-full font-bold shadow-lg transition-all", isRegexRunnerBeaten ? "bg-white/10 hover:bg-white/20 text-white" : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/40")}>
                {isRegexRunnerBeaten ? <><RotateCcw className="w-4 h-4 mr-2" /> Replay Sequence</> : <><Play className="w-4 h-4 mr-2 fill-current" /> Initialize Link</>}
              </Button>
            </Link>
          </motion.div>

        </div>
      </div>

      {/* --- ACHIEVEMENT GRID --- */}
      <div className="pt-4">
        <h2 className="font-heading text-xl font-bold text-white mb-6 px-2">Acquired Data</h2>
        <TooltipProvider>
          <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {achievements.map((badge) => (
              <AchievementCard key={badge.id} badge={badge} />
            ))}
          </motion.div>
        </TooltipProvider>
      </div>
    </div>
  );
}

// --- SUB-COMPONENT: CARD ---
function AchievementCard({ badge }: { badge: Achievement }) {
  const isUnlocked = badge.status === "unlocked";
  const Icon = badge.icon;

  const styles = {
    common: { border: "group-hover:border-slate-400/50", text: "text-slate-400", bg: "group-hover:bg-slate-500/5" },
    rare: { border: "group-hover:border-blue-400/50", text: "text-blue-400", bg: "group-hover:bg-blue-500/5" },
    epic: { border: "group-hover:border-purple-400/50", text: "text-purple-400", bg: "group-hover:bg-purple-500/5" },
    legendary: { border: "group-hover:border-orange-400/50", text: "text-orange-400", bg: "group-hover:bg-orange-500/5" }
  };
  const currentStyle = styles[badge.rarity];

  return (
    <motion.div variants={item} className="h-full">
      <GlassPanel className={cn("relative p-1 h-full flex flex-col transition-all duration-500 group overflow-hidden bg-black/40", isUnlocked ? `border-white/5 ${currentStyle.border}` : "border-white/5 opacity-80")}>
        <div className={cn("relative z-10 flex flex-col h-full p-6 rounded-xl transition-all duration-300", isUnlocked ? currentStyle.bg : "bg-transparent")}>
          <div className="flex justify-between items-start mb-5">
            <div className={cn("p-3.5 rounded-2xl border backdrop-blur-md transition-all duration-500 relative", isUnlocked ? `bg-black/40 border-white/10 ${currentStyle.text} shadow-[0_0_20px_-5px_rgba(0,0,0,0.5)] group-hover:scale-110` : "bg-white/5 border-white/5 text-muted-foreground grayscale")}>
               {isUnlocked && <div className="absolute inset-0 opacity-20 blur-md rounded-2xl bg-current" />}
               {badge.secret && !isUnlocked ? <HelpCircle className="w-6 h-6" /> : <Icon className="w-6 h-6 relative z-10" />}
            </div>
            {isUnlocked ? (
               <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-[10px] font-bold uppercase tracking-wider text-green-400">
                  <Unlock className="w-3 h-3" /> Unlocked
               </div>
            ) : (
               <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <Lock className="w-3 h-3" /> Locked
               </div>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <h3 className={cn("text-lg font-bold font-heading", isUnlocked ? "text-white" : "text-muted-foreground/70")}>
              {badge.secret && !isUnlocked ? "???" : badge.title}
            </h3>
            <div className="text-sm text-muted-foreground leading-relaxed">
              {badge.secret && !isUnlocked ? (
                 <Tooltip>
                    <TooltipTrigger className="cursor-help text-muted-foreground/50 hover:text-primary transition-colors">This achievement is hidden. Hover to decrypt hint.</TooltipTrigger>
                    <TooltipContent className="bg-black border-white/10 text-xs font-mono">Hint: Focus on speed and architecture.</TooltipContent>
                 </Tooltip>
              ) : ( badge.description )}
            </div>
          </div>
          <div className="pt-6 mt-4 flex items-center justify-between border-t border-white/5">
            <div className={cn("flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest", isUnlocked ? currentStyle.text : "text-muted-foreground/50")}>
               <div className="w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_8px_currentColor]" />
               {badge.rarity}
            </div>
            <div className="text-xs font-mono font-bold text-white/40 group-hover:text-white transition-colors">
              {isUnlocked ? `+${badge.xp} XP` : `${badge.xp} XP`}
            </div>
          </div>
        </div>
      </GlassPanel>
    </motion.div>
  );
}