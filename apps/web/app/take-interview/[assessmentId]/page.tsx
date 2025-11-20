/// INTERVIEW PAGE - TAKE INTERVIEW WITH AI ASSISTANT
//app/take-interview/[assessmentId]/page.tsx

'use client';

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Clock, Gauge, CircleDashed, LoaderCircle, Smile, Meh, Frown, Download } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { io, type Socket } from "socket.io-client";
import { ChatWindow } from "@/components/interview/ChatWindow";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";

// --- COMPONENT: HEADER ---
const InterviewHeader = ({ timer, onEndInterview, isEnding }: { timer: number, onEndInterview: () => void, isEnding: boolean }) => {
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };
    return (
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
            <div className="container flex h-16 items-center justify-between">
                <div className="flex items-center gap-2">
                    <Gauge className="h-6 w-6 text-primary" />
                    <span className="font-bold text-lg"><span className="text-primary">Forti</span>Twin</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <Clock className="h-4 w-4" />
                        <span>{formatTime(timer)}</span>
                    </div>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" disabled={isEnding}>
                                {isEnding && <LoaderCircle className="mr-2 h-4 w-4 animate-spin"/>}
                                End Interview
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>This action is final. We will generate your performance report based on this session.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={onEndInterview}>Confirm & End</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
        </header>
    );
};

// --- COMPONENT: SIDEBAR ---
const AnalysisSidebar = ({ analysisData }: { analysisData: any }) => {
    const getSentimentIcon = () => {
        if (analysisData.sentiment.name === "positive") return <Smile className="h-5 w-5 text-green-500" />;
        if (analysisData.sentiment.name === "negative") return <Frown className="h-5 w-5 text-red-500" />;
        return <Meh className="h-5 w-5 text-muted-foreground" />;
    };
    return (
        <ScrollArea className="h-full p-4">
            <div className="space-y-6">
                <Card>
                    <CardHeader><CardTitle>Real-time Analysis</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h3 className="text-sm font-medium mb-2 flex items-center gap-2">Sentiment {getSentimentIcon()}</h3>
                            <p className="text-sm text-muted-foreground bg-muted p-2 rounded-md">{analysisData.sentiment.text}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium mb-3">Interview Progress</h3>
                            <Progress value={analysisData.progress} />
                        </div>
                    </CardContent>
                </Card>
                
                {analysisData.skills && analysisData.skills.length > 0 && (
                    <Card>
                        <CardHeader><CardTitle>Technical Skills Detected</CardTitle></CardHeader>
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
                    <CardContent><p className="text-sm text-muted-foreground">{analysisData.tip}</p></CardContent>
                </Card>
            </div>
        </ScrollArea>
    );
};

// --- MAIN PAGE ---
export default function TakeInterviewPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    
    // Ensure assessmentId is valid
    const assessmentId = typeof params.assessmentId === 'string' ? params.assessmentId : null;

    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isEnding, setIsEnding] = useState(false);
    const [timer, setTimer] = useState(0);

    // Mock data for now - will be updated by real-time socket events in future phases
    const [analysisData, setAnalysisData] = useState({
        sentiment: { name: "neutral", text: "Analyzing your responses..." },
        progress: 10,
        skills: [
            { name: "Communication", value: 0 },
            { name: "Technical Depth", value: 0 }
        ],
        tip: "Speak clearly and take your time answering."
    });

    useEffect(() => {
        if (!assessmentId) return;

        // 1. START THE SESSION ON THE BACKEND (PYTHON)
        const initSession = async () => {
            try {
                console.log("Initializing AI Session...");
                const res = await fetch(`/api/assessment/${assessmentId}/start`, { method: "POST" });
                if (!res.ok) throw new Error("Failed to start AI session");
                console.log("✅ AI Session Initialized");
            } catch (error) {
                console.error(error);
                toast({ 
                    variant: "destructive", 
                    title: "System Warning", 
                    description: "AI Assistant could not be initialized. Analyzing in offline mode." 
                });
            }
        };

        initSession();

        // 2. CONNECT SOCKET (For Chat/Voice)
        const newSocket = io({ withCredentials: true });

        newSocket.on("connect", () => {
            console.log("✅ Socket connected:", newSocket.id);
            setIsConnected(true);
            newSocket.emit("joinInterview", assessmentId);
        });

        newSocket.on("disconnect", () => {
            console.log("❌ Socket disconnected.");
            setIsConnected(false);
        });

        newSocket.on("connect_error", (err) => {
            console.error("Socket Connection Error:", err.message);
        });
        
        setSocket(newSocket);

        const timerInterval = setInterval(() => setTimer((prev) => prev + 1), 1000);

        return () => {
            console.log("Cleaning up socket connection.");
            newSocket.disconnect();
            clearInterval(timerInterval);
        };
    }, [assessmentId, toast]);

    const handleEndInterview = useCallback(async () => {
        if (!socket || !assessmentId) return;
        
        setIsEnding(true);
        toast({ title: "Finishing Up...", description: "Submitting your interview. Please wait." });

        try {
            // Call the new Finish API which triggers Python Scoring
            const res = await fetch(`/api/assessment/${assessmentId}/finish`, {
                method: 'POST'
            });
            
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to submit interview');
            }

            const data = await res.json();

            toast({ 
                title: "Interview Completed!", 
                description: "Redirecting to your report...",
                className: "bg-green-100 dark:bg-green-900" 
            });
            
            // Disconnect socket manually to be clean
            socket.disconnect();

            // Redirect to dashboard (where user can see the new report)
            setTimeout(() => {
                router.push('/dashboard'); 
            }, 1500);

        } catch (err: any) {
            console.error(err);
            toast({ 
                variant: "destructive", 
                title: "Submission Error", 
                description: err.message || "An unknown error occurred." 
            });
            setIsEnding(false);
        }

    }, [socket, assessmentId, router, toast]);

    if (!assessmentId) return <div className="p-10 text-center">Invalid Assessment ID</div>;

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <InterviewHeader timer={timer} onEndInterview={handleEndInterview} isEnding={isEnding} />
            <ResizablePanelGroup direction="horizontal" className="flex-1">
                <ResizablePanel defaultSize={75} minSize={50}>
                    {isConnected ? (
                        <ChatWindow socket={socket} interviewId={assessmentId} />
                    ) : (
                        <div className="flex h-full items-center justify-center text-center">
                            <div>
                                <CircleDashed className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
                                <p className="mt-4 text-muted-foreground">Connecting to secure environment...</p>
                            </div>
                        </div>
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