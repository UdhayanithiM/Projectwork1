"use strict";

import { useState, useEffect, useRef, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { type Socket } from "socket.io-client";
import { Loader2 } from "lucide-react";

interface Message {
  sender: "user" | "ai";
  text: string;
}

interface ChatWindowProps {
    socket: Socket | null;
    interviewId: string | null;
}

export const ChatWindow = ({ socket, interviewId }: ChatWindowProps) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isSending, setIsSending] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isSending]);

    useEffect(() => {
        if (!socket) return;

        const handleChatHistory = (history: Message[]) => {
            setMessages(history);
        };

        const handleAiResponse = (message: Message) => {
            setMessages((prev) => [...prev, message]);
            setIsSending(false);
        };

        socket.on("chatHistory", handleChatHistory);
        socket.on("aiResponse", handleAiResponse);

        return () => {
            socket.off("chatHistory", handleChatHistory);
            socket.off("aiResponse", handleAiResponse);
        };
    }, [socket]);

    const handleSendMessage = useCallback((text: string) => {
        if (socket && interviewId && text.trim()) {
            const userMessage: Message = { sender: "user", text };
            setMessages((prev) => [...prev, userMessage]);
            setIsSending(true);
            socket.emit("sendMessage", userMessage, interviewId);
        }
    }, [socket, interviewId]);

    return (
        <div className="flex flex-col h-full bg-[#0a0a0b] relative">
            {/* Chat Area */}
            <ScrollArea className="flex-1 px-2">
                <div className="max-w-4xl mx-auto py-6 space-y-2">
                    {messages.length === 0 && (
                        <div className="text-center py-20 opacity-50">
                            <p>Start the conversation by saying hello.</p>
                        </div>
                    )}
                    {messages.map((msg, index) => (
                        <ChatMessage key={index} sender={msg.sender} text={msg.text} />
                    ))}
                    
                    {isSending && (
                        <div className="flex items-center gap-3 p-4">
                            <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                            <span className="text-xs text-muted-foreground animate-pulse">
                                AI is thinking...
                            </span>
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>
            </ScrollArea>

            {/* Input Area (Fixed at bottom) */}
            <div className="p-4 border-t border-white/5 bg-background/50 backdrop-blur-md">
                <div className="max-w-4xl mx-auto">
                    <ChatInput onSend={handleSendMessage} isLoading={isSending} />
                </div>
            </div>
        </div>
    );
};