// apps/web/app/take-interview/[assessmentId]/page.tsx

'use client';

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Clock, Gauge, CircleDashed, LoaderCircle, Smile, Meh, Frown } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { io, type Socket } from "socket.io-client";
import { ChatWindow } from "@/components/interview/ChatWindow";
import { VoiceWindow } from "@/components/interview/VoiceWindow";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";


// -----------------------------------------------------
// HEADER
// -----------------------------------------------------
const InterviewHeader = ({
  timer,
  onEndInterview,
  isEnding,
}: {
  timer: number;
  onEndInterview: () => void;
  isEnding: boolean;
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">

        <div className="flex items-center gap-2">
          <Gauge className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">
            <span className="text-primary">Forti</span>Twin
          </span>
        </div>

        <div className="flex items-center gap-4">

          <div className="flex items-center gap-2 text-sm font-medium">
            <Clock className="h-4 w-4" />
            <span>{formatTime(timer)}</span>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isEnding}>
                {isEnding && <LoaderCircle className="h-4 w-4 animate-spin mr-2" />}
                End Interview
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>End Interview?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action is final. A performance report will be generated immediately.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onEndInterview}>Confirm</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

        </div>
      </div>
    </header>
  );
};


// -----------------------------------------------------
// SIDEBAR (Analysis)
// -----------------------------------------------------
const AnalysisSidebar = ({ analysisData }: { analysisData: any }) => {
  const getSentimentIcon = () => {
    if (analysisData.sentiment.name === "positive")
      return <Smile className="h-5 w-5 text-green-500" />;
    if (analysisData.sentiment.name === "negative")
      return <Frown className="h-5 w-5 text-red-500" />;
    return <Meh className="h-5 w-5 text-muted-foreground" />;
  };

  return (
    <ScrollArea className="h-full p-4">
      <div className="space-y-6">

        <Card>
          <CardHeader>
            <CardTitle>Real-time Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                Sentiment {getSentimentIcon()}
              </h3>
              <p className="text-sm text-muted-foreground bg-muted p-2 rounded-md">
                {analysisData.sentiment.text}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-3">Interview Progress</h3>
              <Progress value={analysisData.progress} />
            </div>

          </CardContent>
        </Card>

        {analysisData.skills?.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Detected Skills</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {analysisData.skills.map((skill: any) => (
                <div key={skill.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{skill.name}</span>
                    <span>{skill.value}%</span>
                  </div>
                  <Progress value={skill.value} />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>Tips</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{analysisData.tip}</p>
          </CardContent>
        </Card>

      </div>
    </ScrollArea>
  );
};



// -----------------------------------------------------
// MAIN PAGE
// -----------------------------------------------------
export default function TakeInterviewPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();

  const assessmentId = typeof params.assessmentId === "string" ? params.assessmentId : null;

  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [timer, setTimer] = useState(0);

  // ✅ NEW: Track when the backend session is actually ready
  const [isSessionReady, setIsSessionReady] = useState(false);

  // SWITCHING BETWEEN TEXT + VOICE
  const [interviewMode, setInterviewMode] = useState<"text" | "voice">("text");

  // MOCK ANALYSIS
  const [analysisData, setAnalysisData] = useState({
    sentiment: { name: "neutral", text: "Analyzing your responses..." },
    progress: 10,
    skills: [
      { name: "Communication", value: 0 },
      { name: "Technical Depth", value: 0 },
    ],
    tip: "Speak clearly and take your time answering.",
  });

  // -----------------------------------------------
  // 1. INIT SESSION (Must complete before sockets connect)
  // -----------------------------------------------
  useEffect(() => {
    if (!assessmentId) return;

    const initSession = async () => {
      try {
        console.log("Initializing AI Session...");
        const res = await fetch(`/api/assessment/${assessmentId}/start`, { method: "POST" });
        
        if (!res.ok) {
          const err = await res.text();
          throw new Error(err || "Failed to start AI session");
        }
        
        console.log("✅ AI Session Initialized");
        setIsSessionReady(true); // Unlock the UI and Socket connections
      } catch (error: any) {
        console.error("Session Init Error:", error);
        toast({
          variant: "destructive",
          title: "System Warning",
          description: "AI assistant could not be initialized. Please refresh.",
        });
      }
    };

    initSession();
  }, [assessmentId, toast]);

  // -----------------------------------------------
  // 2. CONNECT SOCKET (Only after isSessionReady)
  // -----------------------------------------------
  useEffect(() => {
    // IMPORTANT: Do NOT connect until session is ready on backend
    if (!assessmentId || !isSessionReady) return;

    const newSocket = io({ withCredentials: true });

    newSocket.on("connect", () => {
      console.log("✅ Socket connected:", newSocket.id);
      setIsConnected(true);
      newSocket.emit("joinInterview", assessmentId);
    });

    newSocket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
      setIsConnected(false);
    });

    newSocket.on("connect_error", (err) => {
        console.error("Socket Connection Error:", err.message);
    });

    setSocket(newSocket);

    const timerInterval = setInterval(() => setTimer((t) => t + 1), 1000);

    return () => {
      console.log("Cleaning up socket");
      newSocket.disconnect();
      clearInterval(timerInterval);
    };
  }, [assessmentId, isSessionReady]); // Added isSessionReady dependency


  // -----------------------------------------------
  // END INTERVIEW
  // -----------------------------------------------
  const handleEndInterview = useCallback(async () => {
    if (!assessmentId) return;

    setIsEnding(true);
    toast({ title: "Finishing...", description: "Generating your report..." });

    try {
      const res = await fetch(`/api/assessment/${assessmentId}/finish`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to submit interview");

      toast({ title: "Interview Completed!", description: "Redirecting..." });

      socket?.disconnect();

      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Submission Error",
        description: err.message,
      });
      setIsEnding(false);
    }
  }, [socket, assessmentId, router, toast]);


  // -----------------------------------------------
  // LOADING / ERROR STATES
  // -----------------------------------------------
  if (!assessmentId) {
    return <div className="p-10 text-center">Invalid Assessment ID</div>;
  }

  if (!isSessionReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background space-y-4">
        <CircleDashed className="h-12 w-12 animate-spin text-primary" />
        <div className="text-lg font-medium text-muted-foreground">Initializing Secure Environment...</div>
      </div>
    );
  }

  // -----------------------------------------------------
  // RENDER MAIN UI
  // -----------------------------------------------------
  return (
    <div className="min-h-screen bg-background flex flex-col">

      <InterviewHeader timer={timer} onEndInterview={handleEndInterview} isEnding={isEnding} />

      {/* TEXT / VOICE SWITCH */}
      <div className="border-b bg-muted/40 p-2 flex justify-center">
        <Tabs value={interviewMode} onValueChange={(v) => setInterviewMode(v as "text" | "voice")}>
          <TabsList>
            <TabsTrigger value="text">Text Interview</TabsTrigger>
            <TabsTrigger value="voice">Voice Interview (Live)</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>


      <ResizablePanelGroup direction="horizontal" className="flex-1">

        {/* LEFT PANEL */}
        <ResizablePanel defaultSize={75} minSize={50}>
          {interviewMode === "text" ? (
            isConnected ? (
              <ChatWindow socket={socket} interviewId={assessmentId} />
            ) : (
              <div className="flex h-full items-center justify-center">
                <CircleDashed className="h-10 w-10 animate-spin text-muted-foreground" />
              </div>
            )
          ) : (
            <VoiceWindow interviewId={assessmentId} />
          )}
        </ResizablePanel>


        {/* DRAG HANDLE */}
        <ResizableHandle withHandle />


        {/* RIGHT PANEL */}
        <ResizablePanel defaultSize={25} minSize={20} className="hidden md:block">
          <AnalysisSidebar analysisData={analysisData} />
        </ResizablePanel>

      </ResizablePanelGroup>
    </div>
  );
}