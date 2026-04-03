"use client";

import { NeuralMatrix } from "@/components/games/neural-matrix";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BrainCircuit } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function MemoryMatchPage() {
  const router = useRouter();

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col relative">
      
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Top Navigation */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8 relative z-10"
      >
        <Button 
          variant="ghost" 
          onClick={() => router.push('/dashboard/achievements')}
          className="text-muted-foreground hover:text-white hover:bg-white/5"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Achievements
        </Button>
        
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30 shadow-[0_0_10px_rgba(124,58,237,0.3)]">
            <BrainCircuit className="w-4 h-4 text-primary" />
          </div>
          <span className="font-heading font-bold text-white tracking-wider">FortiTwin Arcade</span>
        </div>
      </motion.div>

      {/* Game Area Wrapper */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="flex-1 flex flex-col w-full relative z-10"
      >
        <div className="text-center mb-8 space-y-2">
          <h1 className="text-4xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">
            Neural Matrix
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto font-mono text-sm">
            Calibrate your memory circuits. Match the system nodes in the fewest moves possible to unlock the Epic tier badge.
          </p>
        </div>

        {/* Load the game component here */}
        <NeuralMatrix />
      </motion.div>
    </div>
  );
}