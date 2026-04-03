"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Terminal, ShieldAlert, CheckCircle2, XCircle, 
  BrainCircuit, ArrowRight, Play, RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

// --- Game Levels ---
const LEVELS = [
  {
    id: 1,
    title: "Node 1: PIN Extraction",
    objective: "Write a Regex to match only the numeric security PINs.",
    match: ["1234", "0000", "987654"],
    skip: ["ACCESS", "admin123", "password"],
  },
  {
    id: 2,
    title: "Node 2: File Filter",
    objective: "Match only the JavaScript files.",
    match: ["app.js", "server.js", "utils.js"],
    skip: ["style.css", "index.html", "app.json", "js_guide.txt"],
  },
  {
    id: 3,
    title: "Node 3: Hex Override",
    objective: "Match the valid 6-character Hex color codes (starting with #).",
    match: ["#FF0000", "#aacc22", "#000000"],
    skip: ["#FF000", "FF0000", "#xyz123", "color#ffffff"],
  }
];

export function RegexRunner() {
  const router = useRouter();
  const [currentLevel, setCurrentLevel] = useState(0);
  const [regexInput, setRegexInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds to beat all 3 levels
  const [gameState, setGameState] = useState<"idle" | "playing" | "won" | "lost">("idle");
  const [showError, setShowError] = useState(false);

  const level = LEVELS[currentLevel];

  // --- Timer Logic ---
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === "playing" && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && gameState === "playing") {
      setGameState("lost");
    }
    return () => clearTimeout(timer);
  }, [timeLeft, gameState]);

  const startGame = () => {
    setGameState("playing");
    setCurrentLevel(0);
    setRegexInput("");
    setTimeLeft(60);
  };

  const checkRegex = (input: string) => {
    if (!input) return false;
    try {
      // Test if it's a valid regex syntax first
      const re = new RegExp(input);
      
      // Check if it matches ALL targets
      const matchesAllTargets = level.match.every(target => re.test(target));
      // Check if it skips ALL decoys
      const skipsAllDecoys = level.skip.every(decoy => !re.test(decoy));

      return matchesAllTargets && skipsAllDecoys;
    } catch (e) {
      // Invalid regex syntax (e.g. unclosed bracket)
      return false;
    }
  };

  const handleBypassClick = () => {
    if (checkRegex(regexInput)) {
      if (currentLevel === LEVELS.length - 1) {
        setGameState("won");
      } else {
        setCurrentLevel(c => c + 1);
        setRegexInput("");
      }
    } else {
      setShowError(true);
      setTimeout(() => setShowError(false), 500);
    }
  };

  // Helper to test individual strings for the UI feedback
  const getMatchStatus = (str: string, isTarget: boolean) => {
    if (!regexInput) return "neutral";
    try {
      const re = new RegExp(regexInput);
      const isMatch = re.test(str);
      
      if (isTarget) return isMatch ? "good" : "bad";
      return isMatch ? "bad" : "good";
    } catch {
      return "neutral";
    }
  };

  if (gameState === "idle") {
    return (
      <GlassPanel className="w-full max-w-2xl mx-auto p-12 text-center bg-black/60 border-green-500/20">
        <Terminal className="w-16 h-16 text-green-500 mx-auto mb-6" />
        <h2 className="text-3xl font-mono font-bold text-green-400 mb-4">Regex Runner Terminal</h2>
        <p className="text-muted-foreground font-mono mb-8 max-w-md mx-auto">
          System corrupted. You have 60 seconds to write Regular Expressions to filter the clean data from the corrupted nodes.
        </p>
        <Button onClick={startGame} className="bg-green-600 hover:bg-green-500 text-white font-mono text-lg px-8 py-6 shadow-[0_0_20px_rgba(34,197,94,0.4)]">
          <Play className="w-5 h-5 mr-2 fill-current" /> Initialize Sequence
        </Button>
      </GlassPanel>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto relative">
      
      {/* HUD Header */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-mono font-bold text-green-400 flex items-center gap-2">
            <BrainCircuit className="w-6 h-6" /> {level?.title}
          </h2>
          <p className="text-sm text-green-200/60 font-mono mt-1">Progress: Node {currentLevel + 1} of {LEVELS.length}</p>
        </div>
        
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold font-mono">System Timer</p>
          <p className={cn(
            "text-3xl font-mono font-bold",
            timeLeft <= 15 ? "text-red-500 animate-pulse" : "text-white"
          )}>
            00:{timeLeft.toString().padStart(2, '0')}
          </p>
        </div>
      </div>

      {gameState === "playing" && level && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Left Panel: The Target Data */}
          <GlassPanel className="p-6 bg-black/40 border-green-500/20">
            <div className="flex items-center gap-2 mb-4 text-green-400 border-b border-green-500/20 pb-2">
              <CheckCircle2 className="w-4 h-4" />
              <h3 className="font-mono text-sm font-bold uppercase tracking-widest">Data to Match</h3>
            </div>
            <div className="space-y-2 font-mono">
              {level.match.map((str, i) => {
                const status = getMatchStatus(str, true);
                return (
                  <div key={i} className={cn(
                    "p-2 rounded border transition-colors",
                    status === "good" ? "bg-green-500/20 border-green-500/50 text-green-300" : 
                    status === "bad" ? "bg-red-500/10 border-red-500/30 text-red-300" : "bg-white/5 border-white/10 text-white"
                  )}>
                    {str}
                  </div>
                );
              })}
            </div>
          </GlassPanel>

          {/* Right Panel: The Corrupted Data */}
          <GlassPanel className="p-6 bg-black/40 border-red-500/20">
            <div className="flex items-center gap-2 mb-4 text-red-400 border-b border-red-500/20 pb-2">
              <ShieldAlert className="w-4 h-4" />
              <h3 className="font-mono text-sm font-bold uppercase tracking-widest">Data to Skip</h3>
            </div>
            <div className="space-y-2 font-mono">
              {level.skip.map((str, i) => {
                const status = getMatchStatus(str, false);
                return (
                  <div key={i} className={cn(
                    "p-2 rounded border transition-colors",
                    status === "good" ? "bg-green-500/10 border-green-500/30 text-green-300/50" : 
                    status === "bad" ? "bg-red-500/30 border-red-500/50 text-red-400" : "bg-white/5 border-white/10 text-muted-foreground"
                  )}>
                    {str}
                  </div>
                );
              })}
            </div>
          </GlassPanel>

          {/* Bottom Panel: The Input Terminal */}
          <GlassPanel className="md:col-span-2 p-6 bg-[#0a192f] border-green-500/30">
            <p className="text-green-300 mb-4 font-mono text-sm border-l-2 border-green-500 pl-3">
              {level.objective}
            </p>
            <div className="flex gap-4 items-center relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500 font-mono text-xl">/</div>
              <Input 
                value={regexInput}
                onChange={(e) => setRegexInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleBypassClick()}
                placeholder="Type your regex here..."
                autoFocus
                className="bg-black/50 border-green-500/50 text-green-400 font-mono text-lg py-6 px-8 focus-visible:ring-green-500"
              />
              <div className="absolute right-32 top-1/2 -translate-y-1/2 text-green-500 font-mono text-xl">/</div>
              
              <motion.div animate={showError ? { x: [-10, 10, -10, 10, 0] } : {}}>
                <Button 
                  onClick={handleBypassClick}
                  className={cn(
                    "py-6 px-8 font-mono font-bold text-lg transition-all",
                    checkRegex(regexInput) 
                      ? "bg-green-500 hover:bg-green-400 text-black shadow-[0_0_20px_rgba(34,197,94,0.4)]" 
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  )}
                >
                  Bypass <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </motion.div>
            </div>
          </GlassPanel>
        </div>
      )}

      {/* End Game Overlays */}
      <AnimatePresence>
        {gameState === "won" && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md rounded-xl">
            <div className="text-center p-8 max-w-md border border-green-500/30 bg-green-950/20 rounded-2xl">
              <BrainCircuit className="w-16 h-16 text-green-400 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]" />
              <h2 className="text-3xl font-mono font-bold text-white mb-2">Neural Sync Achieved</h2>
              <p className="text-green-400 font-mono mb-8 text-sm">You successfully parsed all data streams with {timeLeft} seconds remaining.</p>
              <Button onClick={() => router.push('/dashboard/achievements')} className="bg-green-600 hover:bg-green-500 text-white w-full py-6 font-bold shadow-[0_0_20px_rgba(34,197,94,0.4)]">
                Claim 'Neural Sync' Badge
              </Button>
            </div>
          </motion.div>
        )}

        {gameState === "lost" && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md rounded-xl">
            <div className="text-center p-8 max-w-md border border-red-500/30 bg-red-950/20 rounded-2xl">
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
              <h2 className="text-3xl font-mono font-bold text-white mb-2">System Locked</h2>
              <p className="text-red-400 font-mono mb-8 text-sm">Time expired. The corrupted data overwhelmed the neural link.</p>
              <div className="flex gap-4">
                <Button onClick={startGame} className="flex-1 bg-red-600 hover:bg-red-500 text-white py-6 font-bold shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                  <RotateCcw className="w-4 h-4 mr-2" /> Retry
                </Button>
                <Button onClick={() => router.push('/dashboard/achievements')} variant="outline" className="flex-1 border-white/10 py-6">
                  Abort
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}