"use strict";

import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  sender: "user" | "ai";
  text: string;
}

export const ChatMessage = ({ sender, text }: ChatMessageProps) => {
  const isUser = sender === "user";

  return (
    <div
      className={cn(
        "flex w-full gap-4 p-4 animate-fade-in",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div className={cn(
          "flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center border",
          isUser ? "bg-primary/10 border-primary/20 text-primary" : "bg-white/5 border-white/10 text-muted-foreground"
      )}>
        {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
      </div>

      <div
        className={cn(
          "flex flex-col max-w-[80%]",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-muted-foreground">
                {isUser ? "You" : "FortiTwin AI"}
            </span>
        </div>
        <div
          className={cn(
            "p-4 rounded-2xl text-sm leading-relaxed shadow-sm",
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-none" // User Bubble
              : "glass-panel bg-secondary/30 text-foreground rounded-tl-none border-white/5" // AI Bubble
          )}
        >
          <p className="whitespace-pre-wrap">{text}</p>
        </div>
      </div>
    </div>
  );
};