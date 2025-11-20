"use strict";

import { useState, useEffect, useRef, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { type Socket } from "socket.io-client";
import { CircleDashed } from "lucide-react";

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

    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
    }, [messages]);

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
        <div className="flex flex-col h-full bg-background">
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                <div className="max-w-4xl mx-auto space-y-4">
                    {messages.map((msg, index) => (
                        <ChatMessage key={index} sender={msg.sender} text={msg.text} />
                    ))}
                    {isSending && (
                        <div className="flex items-start gap-3">
                            <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border bg-primary text-primary-foreground">
                                <CircleDashed className="h-5 w-5 animate-spin" />
                            </div>
                            <div className="max-w-xs rounded-lg p-3 text-sm bg-muted">
                                <p>Thinking...</p>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>
            <ChatInput onSend={handleSendMessage} isLoading={isSending} />
        </div>
    );
};