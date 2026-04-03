"use client";

import { SystemArchitect } from "@/components/games/system-architect";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Server } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function SystemArchitectPage() {
  const router = useRouter();

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col relative bg-[#060d1a]">
      
      {/* Background Ambient Glow tailored to the "Blueprint" theme */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none" />

      {/* Top Navigation */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8 relative z-10 px-4 pt-4"
      >
        <Button 
          variant="ghost" 
          onClick={() => router.push('/dashboard/achievements')}
          className="text-blue-300/60 hover:text-white hover:bg-blue-500/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Abort Mission
        </Button>
        
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            <Server className="w-4 h-4 text-blue-400" />
          </div>
          <span className="font-heading font-bold text-white tracking-wider">FortiTwin Arcade</span>
        </div>
      </motion.div>

      {/* Game Area Wrapper */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="flex-1 flex flex-col w-full relative z-10 p-4"
      >
        <div className="text-center mb-8 space-y-2">
          <h1 className="text-4xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-200 drop-shadow-lg">
            System Architect
          </h1>
          <p className="text-blue-200/60 max-w-xl mx-auto font-mono text-sm">
            Drag and deploy infrastructure components into the blueprint to create a perfectly scalable cloud environment. 
          </p>
        </div>

        {/* Load the game component here */}
        <SystemArchitect />
      </motion.div>
    </div>
  );
}