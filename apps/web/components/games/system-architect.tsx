"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Monitor, Network, Server, Database, Zap, 
  RotateCcw, ShieldCheck, ArrowRight, CheckCircle2, XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

// The architectural components available to the player
const COMPONENTS = [
  { id: "client", name: "Client App", icon: Monitor, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/50" },
  { id: "lb", name: "Load Balancer", icon: Network, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/50" },
  { id: "api", name: "API Gateway", icon: Server, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/50" },
  { id: "cache", name: "Redis Cache", icon: Zap, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/50" },
  { id: "db", name: "PostgreSQL DB", icon: Database, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/50" },
];

// The correct sequence to win
const SOLUTION = ["client", "lb", "api", "cache", "db"];

export function SystemArchitect() {
  const router = useRouter();
  const [slots, setSlots] = useState<(string | null)[]>([null, null, null, null, null]);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<"win" | "lose" | null>(null);

  const handleToolSelect = (id: string) => {
    // If tool is already placed, don't allow selecting it again
    if (slots.includes(id)) return;
    setSelectedTool(id === selectedTool ? null : id);
  };

  const handleSlotClick = (index: number) => {
    if (result === "win") return; // Game over

    const newSlots = [...slots];
    
    // If clicking a filled slot, empty it
    if (newSlots[index] !== null && !selectedTool) {
      newSlots[index] = null;
      setSlots(newSlots);
      return;
    }

    // If holding a tool, place it in the slot
    if (selectedTool) {
      // If the slot is already full, swap it out
      newSlots[index] = selectedTool;
      setSlots(newSlots);
      setSelectedTool(null);
    }
  };

  const checkSolution = () => {
    setIsChecking(true);
    
    setTimeout(() => {
      const isCorrect = slots.every((slot, i) => slot === SOLUTION[i]);
      setResult(isCorrect ? "win" : "lose");
      setIsChecking(false);
      
      if (!isCorrect) {
        // Auto-reset after a failed attempt
        setTimeout(() => {
          setResult(null);
        }, 2000);
      }
    }, 1000);
  };

  const resetGame = () => {
    setSlots([null, null, null, null, null]);
    setSelectedTool(null);
    setResult(null);
  };

  const allSlotsFilled = slots.every(slot => slot !== null);

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-8 relative">
      
      {/* Blueprint Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none -z-10" />

      {/* Header Info */}
      <GlassPanel className="w-full p-6 bg-[#0a192f]/80 border-blue-500/20 shadow-[0_0_30px_rgba(37,99,235,0.1)]">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-heading font-bold text-blue-400 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" /> Mission: High-Traffic Read Pipeline
            </h2>
            <p className="text-sm text-blue-200/60 font-mono mt-1">
              Assemble the architecture in the correct order to handle 10k requests/sec.
            </p>
          </div>
          <Button onClick={resetGame} variant="outline" className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300">
            <RotateCcw className="w-4 h-4 mr-2" /> Clear Draft
          </Button>
        </div>
      </GlassPanel>

      {/* The Build Area (Slots) */}
      <div className="flex flex-wrap justify-center items-center gap-2 md:gap-4 w-full py-10">
        {slots.map((slotId, index) => {
          const comp = COMPONENTS.find(c => c.id === slotId);
          
          return (
            <React.Fragment key={`slot-${index}`}>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSlotClick(index)}
                className={cn(
                  "w-24 h-24 md:w-32 md:h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative overflow-hidden",
                  slotId 
                    ? `border-solid ${comp?.border} ${comp?.bg} shadow-[0_0_20px_rgba(0,0,0,0.3)]` 
                    : selectedTool ? "border-blue-500/50 bg-blue-500/5 hover:bg-blue-500/20" : "border-slate-700 bg-black/20"
                )}
              >
                {comp ? (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex flex-col items-center text-center gap-2 z-10">
                    <comp.icon className={cn("w-8 h-8 md:w-10 md:h-10", comp.color)} />
                    <span className="text-[10px] md:text-xs font-bold font-mono text-white/80 leading-tight">{comp.name}</span>
                  </motion.div>
                ) : (
                  <span className="text-xs font-mono text-slate-600 font-bold uppercase">Slot {index + 1}</span>
                )}

                {/* Status Overlays */}
                <AnimatePresence>
                  {result === "lose" && slotId !== SOLUTION[index] && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-red-500/20 backdrop-blur-sm flex items-center justify-center z-20">
                      <XCircle className="w-8 h-8 text-red-500" />
                    </motion.div>
                  )}
                  {result === "win" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.1 }} className="absolute inset-0 bg-green-500/20 backdrop-blur-sm flex items-center justify-center z-20 border-2 border-green-500 rounded-xl">
                      <CheckCircle2 className="w-8 h-8 text-green-400" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Arrow Connector */}
              {index < 4 && (
                <div className="hidden md:flex text-slate-700">
                  <ArrowRight className={cn("w-6 h-6", result === "win" ? "text-green-500" : "")} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Action Area */}
      {allSlotsFilled && result !== "win" && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
          <Button 
            size="lg" 
            onClick={checkSolution} 
            disabled={isChecking || result === "lose"}
            className={cn(
              "font-bold text-lg px-12 py-6 shadow-[0_0_30px_rgba(37,99,235,0.4)]",
              result === "lose" ? "bg-red-500 hover:bg-red-600 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"
            )}
          >
            {isChecking ? "Running Diagnostics..." : result === "lose" ? "Architecture Failed. Retrying..." : "Deploy Architecture"}
          </Button>
        </motion.div>
      )}

      {/* Toolbar (Inventory) */}
      <GlassPanel className={cn(
        "w-full max-w-3xl p-4 transition-all duration-500",
        result === "win" ? "opacity-0 pointer-events-none translate-y-10" : "opacity-100 translate-y-0"
      )}>
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest text-center mb-4 font-bold">Available Components</p>
        <div className="flex flex-wrap justify-center gap-4">
          {COMPONENTS.map((comp) => {
            const isUsed = slots.includes(comp.id);
            const isSelected = selectedTool === comp.id;
            
            return (
              <Button
                key={comp.id}
                variant="outline"
                disabled={isUsed}
                onClick={() => handleToolSelect(comp.id)}
                className={cn(
                  "h-auto py-3 px-4 flex flex-col gap-2 transition-all",
                  isUsed ? "opacity-30 grayscale cursor-not-allowed border-slate-800" : "hover:scale-105",
                  isSelected ? `border-solid ${comp.border} ${comp.bg} ring-2 ring-primary ring-offset-2 ring-offset-[#09090b]` : "border-white/10 bg-black/40"
                )}
              >
                <comp.icon className={cn("w-5 h-5", isUsed ? "text-slate-500" : comp.color)} />
                <span className={cn("text-xs font-mono", isUsed ? "text-slate-500" : "text-white/80")}>{comp.name}</span>
              </Button>
            );
          })}
        </div>
      </GlassPanel>

      {/* Victory Overlay */}
      <AnimatePresence>
        {result === "win" && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md rounded-2xl"
          >
            <div className="text-center p-8">
              <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-green-500 shadow-[0_0_50px_rgba(34,197,94,0.5)]">
                <CheckCircle2 className="w-12 h-12 text-green-400" />
              </div>
              <h2 className="text-4xl font-heading font-bold text-white mb-2">System Online</h2>
              <p className="text-green-400 font-mono mb-8">10,000 requests/sec stabilized. Zero latency detected.</p>
              
              <Button onClick={() => router.push('/dashboard/achievements')} className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg font-bold shadow-[0_0_20px_rgba(34,197,94,0.4)]">
                Claim 'The Architect' Badge
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}