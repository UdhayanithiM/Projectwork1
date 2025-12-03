"use client";

import { motion } from "framer-motion";
import { 
  Trophy, 
  Lock, 
  Unlock, 
  Zap, 
  Target, 
  Code2, 
  BrainCircuit, 
  Rocket,
  Crown,
  Medal,
  Star,
  Shield,
  HelpCircle
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

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
  secret?: boolean; // If true and locked, show "???"
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
    id: "3",
    title: "Neural Sync",
    description: "Maintain a seamless conversation with the AI for 30 minutes.",
    icon: BrainCircuit,
    status: "locked",
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
    id: "6",
    title: "The Architect",
    description: "Complete the System Design challenge in under 20 mins.",
    icon: Crown,
    status: "locked",
    rarity: "legendary",
    xp: 5000,
    secret: true
  }
];

// --- Animation Variants ---
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", bounce: 0.3 } }
};

export default function AchievementsPage() {
  // Stats Calculation
  const totalXP = achievements.reduce((acc, curr) => curr.status === "unlocked" ? acc + curr.xp : acc, 0);
  const unlockedCount = achievements.filter(a => a.status === "unlocked").length;
  const nextLevelXP = 3000;
  const progress = Math.min((totalXP / nextLevelXP) * 100, 100);
  const currentLevel = Math.floor(totalXP / 1000) + 1;

  return (
    <div className="space-y-8 pb-10 min-h-screen">
      
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
          
          {/* Level Progress Card */}
          <GlassPanel className="w-full lg:w-[400px] p-6 border-primary/20 bg-black/40 relative overflow-hidden group">
             {/* Background Glow */}
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

      {/* --- ACHIEVEMENT GRID --- */}
      <TooltipProvider>
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {achievements.map((badge) => (
            <AchievementCard key={badge.id} badge={badge} />
          ))}
        </motion.div>
      </TooltipProvider>
    </div>
  );
}

// --- SUB-COMPONENT: CARD ---
function AchievementCard({ badge }: { badge: Achievement }) {
  const isUnlocked = badge.status === "unlocked";
  const Icon = badge.icon;

  // Rarity Styling Map
  const styles = {
    common: {
      border: "group-hover:border-slate-400/50",
      text: "text-slate-400",
      bg: "group-hover:bg-slate-500/5",
      shadow: "shadow-slate-500/20"
    },
    rare: {
      border: "group-hover:border-blue-400/50",
      text: "text-blue-400",
      bg: "group-hover:bg-blue-500/5",
      shadow: "shadow-blue-500/20"
    },
    epic: {
      border: "group-hover:border-purple-400/50",
      text: "text-purple-400",
      bg: "group-hover:bg-purple-500/5",
      shadow: "shadow-purple-500/20"
    },
    legendary: {
      border: "group-hover:border-orange-400/50",
      text: "text-orange-400",
      bg: "group-hover:bg-orange-500/5",
      shadow: "shadow-orange-500/20"
    }
  };

  const currentStyle = styles[badge.rarity];

  return (
    <motion.div variants={item} className="h-full">
      <GlassPanel 
        className={cn(
          "relative p-1 h-full flex flex-col transition-all duration-500 group overflow-hidden bg-black/40",
          isUnlocked 
            ? `border-white/5 ${currentStyle.border}` 
            : "border-white/5 opacity-80"
        )}
      >
        {/* Inner Content Container */}
        <div className={cn(
            "relative z-10 flex flex-col h-full p-6 rounded-xl transition-all duration-300",
            isUnlocked ? currentStyle.bg : "bg-transparent"
        )}>
          
          {/* Header Row */}
          <div className="flex justify-between items-start mb-5">
            <div className={cn(
              "p-3.5 rounded-2xl border backdrop-blur-md transition-all duration-500 relative",
              isUnlocked 
                ? `bg-black/40 border-white/10 ${currentStyle.text} shadow-[0_0_20px_-5px_rgba(0,0,0,0.5)] group-hover:scale-110 group-hover:shadow-[0_0_25px_-5px_currentColor]`
                : "bg-white/5 border-white/5 text-muted-foreground grayscale"
            )}>
               {/* Icon Glow (Unlocked Only) */}
               {isUnlocked && <div className={cn("absolute inset-0 opacity-20 blur-md rounded-2xl bg-current")} />}
               
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

          {/* Text Content */}
          <div className="flex-1 space-y-2">
            <h3 className={cn(
              "text-lg font-bold font-heading",
              isUnlocked ? "text-white" : "text-muted-foreground/70"
            )}>
              {badge.secret && !isUnlocked ? "???" : badge.title}
            </h3>
            
            <div className="text-sm text-muted-foreground leading-relaxed">
              {badge.secret && !isUnlocked ? (
                 <Tooltip>
                    <TooltipTrigger className="cursor-help text-muted-foreground/50 hover:text-primary transition-colors">
                       This achievement is hidden. Hover to decrypt hint.
                    </TooltipTrigger>
                    <TooltipContent className="bg-black border-white/10 text-xs font-mono">
                       Hint: Focus on speed and architecture.
                    </TooltipContent>
                 </Tooltip>
              ) : (
                 badge.description
              )}
            </div>
          </div>

          {/* Footer Row */}
          <div className="pt-6 mt-4 flex items-center justify-between border-t border-white/5">
            <div className={cn(
              "flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest",
              isUnlocked ? currentStyle.text : "text-muted-foreground/50"
            )}>
               {/* Rarity Dot */}
               <div className={cn("w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_8px_currentColor]")} />
               {badge.rarity}
            </div>
            
            <div className="text-xs font-mono font-bold text-white/40 group-hover:text-white transition-colors">
              {isUnlocked ? `+${badge.xp} XP` : `${badge.xp} XP`}
            </div>
          </div>

          {/* Decorative Scanline (Hover only) */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.03] to-transparent bg-[length:100%_4px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        </div>
      </GlassPanel>
    </motion.div>
  );
}