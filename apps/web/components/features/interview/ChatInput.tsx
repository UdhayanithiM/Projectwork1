"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Mic, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

export const ChatInput = ({ onSend, isLoading }: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // --- Auto-resize Logic ---
  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to auto to get the correct scrollHeight for shrinking
      textareaRef.current.style.height = "auto";
      // Set to scrollHeight to expand
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSend = () => {
    if (message.trim() && !isLoading) {
      onSend(message);
      setMessage("");
      
      // Reset height immediately after sending
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full relative group">
      {/* 1. Neon Glow Gradient (Behind) */}
      <div 
        className={cn(
          "absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-primary/50 to-cyan-500/50 opacity-0 transition-opacity duration-500 blur-md pointer-events-none",
          isFocused && "opacity-40"
        )} 
      />

      {/* 2. Glass Container */}
      <div 
        className={cn(
          "relative flex items-end gap-2 p-2 rounded-2xl border transition-all duration-300",
          "bg-black/80 backdrop-blur-xl", // High contrast background for readability
          isFocused 
            ? "border-primary/50 shadow-[0_0_20px_rgba(124,58,237,0.15)]" 
            : "border-white/10 hover:border-white/20"
        )}
      >
        {/* Voice Trigger (Visual Hook) */}
        <Button
          size="icon"
          variant="ghost"
          className="h-10 w-10 shrink-0 rounded-xl text-muted-foreground hover:text-white hover:bg-white/10 transition-colors"
          disabled={isLoading}
          title="Voice Input (Switch Mode)"
        >
          <Mic className="h-5 w-5" />
        </Button>

        {/* Text Input */}
        <Textarea
          ref={textareaRef}
          placeholder={isLoading ? "AI is processing..." : "Type your answer..."}
          className={cn(
            "min-h-[40px] max-h-[200px] w-full resize-none border-0 bg-transparent px-2 py-2.5 text-sm",
            "focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50",
            "text-white font-sans custom-scrollbar leading-relaxed"
          )}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={isLoading}
          rows={1}
        />

        {/* Send Button */}
        <Button
          size="icon"
          onClick={handleSend}
          disabled={isLoading || !message.trim()}
          className={cn(
            "h-10 w-10 shrink-0 rounded-xl transition-all duration-300 shadow-lg",
            message.trim() && !isLoading
              ? "bg-primary text-primary-foreground shadow-glow-primary hover:bg-primary/90 hover:scale-105" 
              : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white"
          )}
        >
          {isLoading ? (
            <Sparkles className="h-5 w-5 animate-pulse text-primary" />
          ) : (
            <Send className={cn("h-5 w-5", message.trim() && "fill-current")} />
          )}
        </Button>
      </div>
      
      {/* 3. Keyboard Hint */}
      <div className="absolute -bottom-6 right-2 text-[10px] text-muted-foreground opacity-0 transition-opacity duration-300 lg:group-hover:opacity-100">
        Press <kbd className="font-mono bg-white/10 px-1.5 py-0.5 rounded text-white border border-white/10">Enter</kbd> to send
      </div>
    </div>
  );
};