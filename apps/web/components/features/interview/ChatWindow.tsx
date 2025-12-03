"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { type Socket } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit, Sparkles } from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";

// --- Types ---
export interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: number;
}

interface ChatWindowProps {
  socket: Socket | null;
  interviewId: string | null;
}

export const ChatWindow = ({ socket, interviewId }: ChatWindowProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // --- 1. Socket Event Listeners ---
  useEffect(() => {
    if (!socket) return;

    // Handler: Load Chat History
    const handleChatHistory = (history: any[]) => {
      const formatted = history.map((msg, i) => ({
        id: msg.id || `hist-${i}`,
        sender: msg.role === "assistant" ? "ai" : "user", // Normalize backend roles to UI roles
        text: msg.content || msg.text,
        timestamp: msg.timestamp || Date.now(),
      }));
      setMessages(formatted as Message[]);
    };

    // Handler: Receive AI Reply
    const handleAiResponse = (payload: any) => {
      // Robust handling: payload might be a direct string or an object
      const textContent = typeof payload === 'string' ? payload : (payload.text || payload.content);
      
      const newMessage: Message = {
        id: `msg-${Date.now()}`,
        sender: "ai",
        text: textContent,
        timestamp: Date.now(),
      };
      
      setMessages((prev) => [...prev, newMessage]);
      setIsTyping(false);
    };

    socket.on("chatHistory", handleChatHistory);
    socket.on("aiResponse", handleAiResponse);

    return () => {
      socket.off("chatHistory", handleChatHistory);
      socket.off("aiResponse", handleAiResponse);
    };
  }, [socket]);

  // --- 2. Auto-Scroll Logic ---
  // Scrolls to bottom whenever messages change or typing state changes
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  // --- 3. Send Handler ---
  const handleSendMessage = useCallback((text: string) => {
    if (socket && interviewId && text.trim()) {
      const userMessage: Message = {
        id: `local-${Date.now()}`,
        sender: "user",
        text,
        timestamp: Date.now(),
      };

      // Optimistic UI Update: Show message immediately
      setMessages((prev) => [...prev, userMessage]);
      setIsTyping(true); // Trigger "Thinking" state immediately
      
      // Emit to backend
      socket.emit("sendMessage", { text, interviewId });
    }
  }, [socket, interviewId]);

  return (
    <div className="flex flex-col h-full w-full relative overflow-hidden bg-transparent">
      
      {/* --- CHAT AREA --- */}
      <ScrollArea className="flex-1 px-4 md:px-6">
        <div className="max-w-3xl mx-auto py-6 space-y-6">
          
          {/* Empty State: shown only when no messages exist */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-0 animate-fade-in" style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}>
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 border border-primary/20 shadow-[0_0_30px_rgba(124,58,237,0.2)]">
                <Sparkles className="h-8 w-8 text-primary animate-pulse-soft" />
              </div>
              <h3 className="text-lg font-heading font-bold text-white">Neural Link Established</h3>
              <p className="text-sm text-muted-foreground max-w-xs mt-2">
                The AI is calibrated and listening. Introduce yourself to begin the assessment.
              </p>
            </div>
          )}

          {/* Message Stream with Animations */}
          <AnimatePresence initial={false}>
            {messages.map((msg, index) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <ChatMessage 
                  sender={msg.sender} 
                  text={msg.text} 
                  isLatest={index === messages.length - 1} 
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* "AI is Thinking" Holographic Indicator */}
          {isTyping && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 pl-2"
            >
              <div className="h-8 w-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-glow-soft">
                <BrainCircuit className="h-4 w-4 text-primary animate-pulse" />
              </div>
              <div className="flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-1.5 w-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-1.5 w-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </motion.div>
          )}
          
          {/* Spacer for auto-scroll anchor */}
          <div ref={bottomRef} className="h-4" />
        </div>
      </ScrollArea>

      {/* --- INPUT AREA --- */}
      {/* Gradient fade ensures content scrolls "under" the input smoothly */}
      <div className="p-4 md:p-6 bg-gradient-to-t from-black via-black/90 to-transparent z-10">
        <div className="max-w-3xl mx-auto">
          <ChatInput onSend={handleSendMessage} isLoading={isTyping} />
        </div>
      </div>
    </div>
  );
};