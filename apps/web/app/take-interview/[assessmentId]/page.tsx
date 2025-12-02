// apps/web/app/take-interview/[assessmentId]/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Clock, Gauge, CircleDashed, LoaderCircle, Smile, Meh, Frown } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { io, type Socket } from "socket.io-client";
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
} from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// --- Header
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

// --- Sidebar (analysis)
const AnalysisSidebar = ({ analysisData }: { analysisData: any }) => {
  const getSentimentIcon = () => {
    if (analysisData.sentiment?.name === "positive") return <Smile className="h-5 w-5 text-green-500" />;
    if (analysisData.sentiment?.name === "negative") return <Frown className="h-5 w-5 text-red-500" />;
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
                {analysisData.sentiment?.text}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-3">Interview Progress</h3>
              <Progress value={analysisData.progress ?? 0} />
            </div>
          </CardContent>
        </Card>

        {Array.isArray(analysisData.skills) && analysisData.skills.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Detected Skills</CardTitle>
            </CardHeader>
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
          <CardHeader>
            <CardTitle>Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{analysisData.tip}</p>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
};

// --- Page
export default function TakeInterviewPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();

  const assessmentId = typeof params.assessmentId === "string" ? params.assessmentId : null;

  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [timer, setTimer] = useState(0);

  const [isSessionReady, setIsSessionReady] = useState(false);
  const [interviewMode, setInterviewMode] = useState<"text" | "voice">("text");

  const [analysisData, setAnalysisData] = useState({
    sentiment: { name: "neutral", text: "Analyzing your responses..." },
    progress: 10,
    skills: [
      { name: "Communication", value: 0 },
      { name: "Technical Depth", value: 0 },
    ],
    tip: "Speak clearly and take your time answering.",
  });

  // 1) Initialize backend session
  useEffect(() => {
    if (!assessmentId) return;

    let mounted = true;
    const initSession = async () => {
      try {
        const res = await fetch(`/api/assessment/${assessmentId}/start`, { method: "POST" });
        if (!res.ok) {
          const text = await res.text().catch(() => "Failed");
          throw new Error(text || "Failed to start AI session");
        }
        if (mounted) setIsSessionReady(true);
      } catch (err) {
        console.error("Session Init Error:", err);
        toast({
          variant: "destructive",
          title: "System Warning",
          description: "AI assistant could not be initialized. Please refresh.",
        });
      }
    };
    initSession();
    return () => {
      mounted = false;
    };
  }, [assessmentId, toast]);

  // 2) Connect socket only after session ready
  useEffect(() => {
    if (!assessmentId || !isSessionReady) return;

    // connect to same origin - ensures cookies/CORS behave as expected
    const url = window.location.origin;
    const newSocket: Socket = io(url, {
      withCredentials: true,
      transports: ["websocket"],
    });

    newSocket.on("connect", () => {
      console.log("Socket connected", newSocket.id);
      setIsConnected(true);
      newSocket.emit("joinInterview", assessmentId);
    });

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    newSocket.on("connect_error", (err: any) => {
      console.error("Socket connect_error", err);
      toast({ variant: "destructive", title: "Socket Error", description: err?.message ?? "Connection failed" });
    });

    // example server -> client update (adjust to your server events)
    newSocket.on("analysisUpdate", (payload: any) => {
      setAnalysisData((prev) => ({ ...prev, ...payload }));
    });

    setSocket(newSocket);

    const timerInterval = setInterval(() => setTimer((t) => t + 1), 1000);

    return () => {
      clearInterval(timerInterval);
      try {
        newSocket.disconnect();
      } catch (e) {
        /* ignore */
      }
      setSocket(null);
    };
  }, [assessmentId, isSessionReady, toast]);

  // 3) End interview
  const handleEndInterview = useCallback(async () => {
    if (!assessmentId) return;
    setIsEnding(true);
    toast({ title: "Finishing...", description: "Generating your report..." });

    try {
      const res = await fetch(`/api/assessment/${assessmentId}/finish`, { method: "POST" });
      if (!res.ok) {
        const text = await res.text().catch(() => "Failed");
        throw new Error(text || "Failed to finish");
      }

      toast({ title: "Interview Completed!", description: "Redirecting..." });
      socket?.disconnect();
      setTimeout(() => router.push("/dashboard"), 1200);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Submission Error",
        description: err?.message ?? "Failed to finish interview",
      });
      setIsEnding(false);
    }
  }, [socket, assessmentId, router, toast]);

  // 4) Early states
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

  // 5) Render UI
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <InterviewHeader timer={timer} onEndInterview={handleEndInterview} isEnding={isEnding} />

      <div className="border-b bg-muted/40 p-2 flex justify-center">
        <Tabs value={interviewMode} onValueChange={(v: string) => setInterviewMode(v as "text" | "voice")}>
          <TabsList>
            <TabsTrigger value="text">Text Interview</TabsTrigger>
            <TabsTrigger value="voice">Voice Interview (Live)</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={75} minSize={50}>
          {interviewMode === "text" ? (
            // pass socket (may be null early) and non-null assessmentId
            <ChatWindow socket={socket} interviewId={assessmentId!} />
          ) : (
            <VoiceWindow interviewId={assessmentId!} />
          )}
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={25} minSize={20} className="hidden md:block">
          <AnalysisSidebar analysisData={analysisData} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
