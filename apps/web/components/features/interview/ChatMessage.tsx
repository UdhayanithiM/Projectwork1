"use client";

import { useState, useEffect } from "react";
import { Bot, User, Cpu, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  sender: "user" | "ai";
  text: string;
  isLatest?: boolean;
}

export const ChatMessage = ({ sender, text, isLatest }: ChatMessageProps) => {
  const isUser = sender === "user";
  
  // --- Typewriter Logic ---
  // We initialize with text if it's the user (instant) or if it's an old message.
  // We initialize empty only if it's the AI's *newest* message.
  const [displayedText, setDisplayedText] = useState(isLatest && !isUser ? "" : text);

  useEffect(() => {
    // If it is the user, or an old message, show full text immediately
    if (isUser || !isLatest) {
      setDisplayedText(text);
      return;
    }

    // AI Typewriter Effect
    if (displayedText.length < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(text.slice(0, displayedText.length + 1));
      }, 15); // Adjust speed: Lower = faster typing
      return () => clearTimeout(timeout);
    }
  }, [text, isLatest, isUser, displayedText]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn(
        "flex w-full gap-4",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar Module */}
      <div className={cn(
          "flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center border shadow-lg backdrop-blur-sm mt-1 transition-all duration-300",
          isUser 
            ? "bg-primary/20 border-primary/30 text-primary shadow-[0_0_15px_rgba(124,58,237,0.2)]" 
            : "bg-cyan-950/30 border-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
      )}>
        {isUser ? <User className="h-5 w-5" /> : <Cpu className="h-5 w-5" />}
      </div>

      {/* Message Content Column */}
      <div className={cn(
          "flex flex-col max-w-[85%] md:max-w-[75%]",
          isUser ? "items-end" : "items-start"
        )}
      >
        {/* Header / Name Tag */}
        <div className="flex items-center gap-2 mb-1.5 px-1 opacity-70">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {isUser ? "Candidate" : "FortiTwin AI"}
            </span>
            {!isUser && isLatest && displayedText.length < text.length && (
               <span className="flex h-2 w-2 relative">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
               </span>
            )}
        </div>
        
        {/* Holographic Glass Bubble */}
        <div
          className={cn(
            "p-4 md:p-5 text-sm md:text-base leading-relaxed transition-all duration-300 shadow-xl backdrop-blur-md relative overflow-hidden",
            isUser
              ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-none border border-primary/50 shadow-[0_4px_20px_rgba(124,58,237,0.25)]" 
              : "glass-panel bg-zinc-900/60 text-zinc-100 rounded-2xl rounded-tl-none border border-white/10"
          )}
        >
          {/* Subtle Scanline effect for AI only */}
          {!isUser && (
             <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent pointer-events-none bg-[length:100%_4px]" />
          )}

          <p className="whitespace-pre-wrap font-sans relative z-10">
            {isUser ? text : displayedText}
            
            {/* Blinking Cursor for AI Typing */}
            {!isUser && isLatest && displayedText.length < text.length && (
              <span className="inline-block w-2 h-4 ml-1 align-middle bg-cyan-400 animate-pulse shadow-[0_0_10px_#22d3ee]" />
            )}
          </p>
        </div>
      </div>
    </motion.div>
  );
};