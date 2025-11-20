import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Radio, Activity, Volume2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface VoiceWindowProps {
  interviewId: string;
}

export function VoiceWindow({ interviewId }: VoiceWindowProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [lastTranscript, setLastTranscript] = useState<string>("Connecting to secure voice channel...");
  const [aiSpeaking, setAiSpeaking] = useState(false);

  // Refs for WebSocket and Audio Context
  const socketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioQueueRef = useRef<Blob[]>([]);
  const isPlayingRef = useRef(false);

  // 1. Initialize WebSocket
  useEffect(() => {
    // Connect to Next.js Proxy -> Python -> Hume
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws/hume/${interviewId}`;
    
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setLastTranscript("Voice channel active. Click the mic to start.");
    };

    ws.onclose = () => setIsConnected(false);

    ws.onmessage = async (event) => {
      // Handle Audio (Blob)
      if (event.data instanceof Blob) {
        audioQueueRef.current.push(event.data);
        playNextAudioChunk();
      } 
      // Handle Text (JSON)
      else if (typeof event.data === "string") {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "user_message") {
            setLastTranscript(`You: ${msg.message.content}`);
          } else if (msg.type === "assistant_message") {
            setLastTranscript(`AI: ${msg.message.content}`);
          }
        } catch (e) {
          console.error("JSON Parse error", e);
        }
      }
    };

    return () => {
      ws.close();
    };
  }, [interviewId]);

  // 2. Audio Playback Logic (Simple Queue)
  const playNextAudioChunk = async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;

    isPlayingRef.current = true;
    setAiSpeaking(true);

    const blob = audioQueueRef.current.shift();
    if (!blob) return;

    const audio = new Audio(URL.createObjectURL(blob));
    audio.onended = () => {
      isPlayingRef.current = false;
      if (audioQueueRef.current.length === 0) setAiSpeaking(false);
      playNextAudioChunk(); // Play next if available
    };
    await audio.play().catch(e => console.error("Audio play error", e));
  };

  // 3. Microphone Logic
  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
        
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0 && socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(e.data);
          }
        };

        // Send chunks every 250ms for near real-time latency
        recorder.start(250);
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
      } catch (err) {
        console.error("Mic Error:", err);
        setLastTranscript("Error accessing microphone. Please check permissions.");
      }
    }
  };

  return (
    <div className="flex flex-col h-full items-center justify-center bg-gradient-to-b from-background to-muted/20 p-6">
      
      {/* Visualization Area */}
      <div className="relative w-64 h-64 flex items-center justify-center mb-8">
        {/* Outer Rings */}
        <div className={`absolute inset-0 rounded-full border-4 border-primary/20 ${isRecording ? 'animate-ping' : ''}`} />
        <div className={`absolute inset-4 rounded-full border-4 border-primary/40 ${aiSpeaking ? 'animate-pulse' : ''}`} />
        
        {/* Center Icon */}
        <div className="z-10 bg-background rounded-full p-8 shadow-2xl border border-border">
          {aiSpeaking ? (
            <Volume2 className="w-16 h-16 text-primary animate-bounce" />
          ) : isRecording ? (
            <Activity className="w-16 h-16 text-red-500 animate-pulse" />
          ) : (
            <Radio className="w-16 h-16 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Status Text */}
      <div className="text-center space-y-4 max-w-md z-10">
        <h2 className="text-2xl font-bold tracking-tight">
            {aiSpeaking ? "AI is speaking..." : isRecording ? "Listening..." : "Voice Mode Ready"}
        </h2>
        <Alert className="bg-background/50 backdrop-blur">
            <AlertDescription className="text-center italic">
                "{lastTranscript}"
            </AlertDescription>
        </Alert>
      </div>

      {/* Controls */}
      <div className="mt-12 z-10">
        <Button 
            size="lg" 
            variant={isRecording ? "destructive" : "default"}
            className={`rounded-full w-20 h-20 shadow-xl transition-all ${isRecording ? 'scale-110' : 'hover:scale-105'}`}
            onClick={toggleRecording}
            disabled={!isConnected}
        >
            {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
        </Button>
      </div>
      
      {!isConnected && <p className="text-xs text-destructive mt-4">Connecting to secure voice server...</p>}
    </div>
  );
}