"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { io, type Socket } from "socket.io-client";
import { 
  Clock, 
  Gauge, 
  Loader2, 
  Mic, 
  MessageSquare, 
  LogOut, 
  Activity,
  Wifi,
  WifiOff,
  Cpu
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ChatWindow } from "@/components/features/interview/ChatWindow";
import { VoiceWindow } from "@/components/features/interview/VoiceWindow";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

// ⭐ PERFORMANCE FIX: Dynamically import Spline to prevent SSR crashes
const Spline = dynamic(() => import('@splinetool/react-spline'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
      <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
    </div>
  ),
});

// --- Types ---
type AnalysisData = {
  sentiment: { name: "positive" | "neutral" | "negative"; text: string };
  progress: number;
  skills: { name: string; value: number }[];
  tip: string;
};

// --- Sub-Component: Holographic HUD ---
const InterviewHUD = ({ 
  timer, 
  analysisData, 
  isConnected 
}: { 
  timer: number; 
  analysisData: AnalysisData;
  isConnected: boolean;
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start pointer-events-none z-50">
      {/* Left: System Status & Timer */}
      <div className="pointer-events-auto flex items-center gap-4 p-3 rounded-full bg-black/40 border border-white/10 backdrop-blur-md shadow-2xl">
        <div className="flex items-center gap-3 px-2">
          {isConnected ? (
             <Wifi className="h-4 w-4 text-green-500" />
          ) : (
             <WifiOff className="h-4 w-4 text-red-500 animate-pulse" />
          )}
          <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest hidden sm:block">
            {isConnected ? "System Online" : "Reconnecting..."}
          </span>
        </div>
        <div className="h-4 w-px bg-white/10" />
        <div className="flex items-center gap-2 px-2">
          <Clock className="h-4 w-4 text-primary" />
          <span className="font-mono text-lg font-bold text-white tabular-nums tracking-wider">
            {formatTime(timer)}
          </span>
        </div>
      </div>

      {/* Right: Live Sentiment Analysis */}
      <div className="flex flex-col gap-3 items-end pointer-events-auto">
        <Card className="p-4 w-64 bg-black/60 border-white/10 backdrop-blur-md shadow-2xl transition-all duration-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Activity className="h-3 w-3 text-primary" /> AI Analysis
            </span>
            <Badge variant="outline" className={cn(
              "text-[10px] uppercase border-0 bg-opacity-20",
              analysisData.sentiment.name === "positive" ? "bg-green-500/20 text-green-400" :
              analysisData.sentiment.name === "negative" ? "bg-red-500/20 text-red-400" :
              "bg-blue-500/20 text-blue-400"
            )}>
              {analysisData.sentiment.name}
            </Badge>
          </div>
          <p className="text-xs text-white/80 leading-relaxed font-medium">
            "{analysisData.sentiment.text}"
          </p>
        </Card>

        {/* Skill Ticker */}
        {analysisData.skills.length > 0 && (
          <div className="space-y-2">
            {analysisData.skills.map((skill) => (
              <Card key={skill.name} className="p-3 w-56 bg-black/60 border-white/10 backdrop-blur-md">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Cpu className="w-3 h-3" /> {skill.name}
                  </span>
                  <span className="text-primary font-mono">{skill.value}%</span>
                </div>
                <Progress value={skill.value} className="h-1 bg-white/5" />
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// --- Page Component ---
export default function TakeInterviewPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  
  const assessmentId = typeof params.assessmentId === "string" ? params.assessmentId : null;

  // State
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [timer, setTimer] = useState(0);
  const [mode, setMode] = useState<"text" | "voice">("text");
  const [isEnding, setIsEnding] = useState(false);

  const [analysisData, setAnalysisData] = useState<AnalysisData>({
    sentiment: { name: "neutral", text: "Calibrating sensors..." },
    progress: 0,
    skills: [],
    tip: "Relax. Speak naturally.",
  });

  // 1. Initialize Session
  useEffect(() => {
    if (!assessmentId) return;
    const initSession = async () => {
      try {
        const res = await fetch(`/api/assessment/${assessmentId}/start`, { method: "POST" });
        if (!res.ok) throw new Error("Failed to initialize");
        setIsSessionReady(true);
      } catch (err) {
        toast({ variant: "destructive", title: "Initialization Error", description: "Could not start interview session." });
      }
    };
    initSession();
  }, [assessmentId, toast]);

  // 2. Socket Connection
  useEffect(() => {
    if (!assessmentId || !isSessionReady) return;

    // Connect to same origin
    const newSocket: Socket = io(window.location.origin, {
      withCredentials: true,
      transports: ["websocket"],
    });

    newSocket.on("connect", () => {
      setIsConnected(true);
      newSocket.emit("joinInterview", assessmentId);
      // toast({ description: "Secure Neural Link Established." });
    });

    newSocket.on("disconnect", () => setIsConnected(false));
    
    // Listen for live updates from backend
    newSocket.on("analysisUpdate", (data: Partial<AnalysisData>) => {
      setAnalysisData(prev => ({ ...prev, ...data }));
    });

    setSocket(newSocket);
    const interval = setInterval(() => setTimer(t => t + 1), 1000);

    return () => {
      clearInterval(interval);
      newSocket.disconnect();
    };
  }, [assessmentId, isSessionReady]);

  // 3. End Interview Handler
  const handleEndInterview = async () => {
    setIsEnding(true);
    try {
      await fetch(`/api/assessment/${assessmentId}/finish`, { method: "POST" });
      socket?.disconnect();
      toast({ title: "Session Complete", description: "Generating performance report..." });
      router.push("/dashboard");
    } catch (err) {
      setIsEnding(false);
      toast({ variant: "destructive", title: "Error", description: "Could not end session." });
    }
  };

  // Loading State
  if (!isSessionReady) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-white space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
          <Gauge className="h-16 w-16 text-primary relative z-10 animate-spin-slow" />
        </div>
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-heading font-bold animate-pulse">Initializing Environment</h2>
          <p className="text-muted-foreground font-mono text-sm">Establishing secure handshake...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black text-white font-body selection:bg-primary/30">
      
      {/* --- LAYER 0: 3D AMBIENT BACKGROUND (Desktop Only) --- */}
      <div className="absolute inset-0 z-0 hidden md:block">
        <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black z-10 opacity-90" />
        {/* Placeholder Spline Scene - Replace with your specific avatar scene URL */}
        <Spline scene="https://prod.spline.design/qIjHRYzrDY-SIfdj/scene.splinecode" />
      </div>

      {/* --- LAYER 1: HUD & OVERLAYS --- */}
      <InterviewHUD timer={timer} analysisData={analysisData} isConnected={isConnected} />

      {/* --- LAYER 2: INTERACTION ZONES --- */}
      <div className="absolute inset-0 z-10 flex flex-col md:flex-row">
        
        {/* Left: The Avatar Context (Clickable space) */}
        <div className="flex-1 hidden md:block" />

        {/* Right: The Holographic Terminal */}
        <motion.div 
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full md:w-[500px] lg:w-[600px] h-full flex flex-col bg-black/80 backdrop-blur-2xl border-l border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative"
        >
          {/* Mode Switcher */}
          <div className="flex items-center p-2 mx-6 mt-24 mb-4 bg-white/5 rounded-lg border border-white/5">
            <button
              onClick={() => setMode("text")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all duration-300",
                mode === "text" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-white hover:bg-white/5"
              )}
            >
              <MessageSquare className="h-4 w-4" /> Text Mode
            </button>
            <button
              onClick={() => setMode("voice")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all duration-300",
                mode === "voice" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-white hover:bg-white/5"
              )}
            >
              <Mic className="h-4 w-4" /> Voice Mode
            </button>
          </div>

          {/* Interface Area */}
          <div className="flex-1 overflow-hidden relative">
            <AnimatePresence mode="wait">
              {mode === "text" ? (
                <motion.div 
                  key="text"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="h-full"
                >
                  <ChatWindow socket={socket} interviewId={assessmentId!} />
                </motion.div>
              ) : (
                <motion.div 
                  key="voice"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="h-full"
                >
                  <VoiceWindow interviewId={assessmentId!} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Actions */}
          <div className="p-6 border-t border-white/10 bg-black/40">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full gap-2 font-bold tracking-wide shadow-glow-soft hover:shadow-red-500/20 py-6">
                  <LogOut className="h-4 w-4" /> TERMINATE SESSION
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-zinc-950 border-white/10 text-white">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">End Interview?</AlertDialogTitle>
                  <AlertDialogDescription className="text-zinc-400">
                    This will finalize your session and generate a comprehensive performance report. You cannot undo this action.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/5 hover:text-white">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleEndInterview} className="bg-red-600 hover:bg-red-700 text-white">
                    {isEnding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Termination"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </motion.div>
      </div>
    </div>
  );
}