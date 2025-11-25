// apps/web/components/interview/VoiceWindow.tsx
import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Radio, Activity, Volume2, Power } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface VoiceWindowProps {
  interviewId: string;
}

export function VoiceWindow({ interviewId }: VoiceWindowProps) {
  const [hasStarted, setHasStarted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [lastTranscript, setLastTranscript] = useState<string>("Ready to start.");
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioQueueRef = useRef<Blob[]>([]);
  const isPlayingRef = useRef(false);
  const mountedRef = useRef(true);

  // Start session & setup socket
  const startSession = useCallback(() => {
    setError(null);
    setHasStarted(true);
    setLastTranscript("Connecting to AI...");

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws/hume/${interviewId}`;

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log("✅ Connected to Voice Socket");
      setIsConnected(true);
      setLastTranscript("AI is thinking...");
    };

    ws.onclose = (e) => {
      console.log("❌ Socket Closed", e.code);
      setIsConnected(false);
      setHasStarted(false);
      if (e.code === 4001) setError("Authentication failed.");
      else if (e.code === 4004) setError("Session not found.");
      else if (e.code !== 1000) setError("Connection lost. Please try again.");
    };

    ws.onerror = (ev) => {
      console.error("WebSocket error", ev);
    };

    ws.onmessage = async (event) => {
      // AUDIO (AI Speech) - binary blobs
      if (event.data instanceof Blob) {
        audioQueueRef.current.push(event.data);
        // when audio arrives, ensure UI shows AI speaking
        setAiSpeaking(true);
        playNextAudioChunk();
        return;
      }

      // TEXT (Transcript & Control)
      if (typeof event.data === "string") {
        try {
          const msg = JSON.parse(event.data);

          // Hume transcription forwarded by backend / user transcript
          if (msg.type === "user_message") {
            const text = msg.message?.content;
            if (text) setLastTranscript(`You: ${text}`);
          }
          // Assistant text that we generated and told Hume to speak
          else if (msg.type === "assistant_message") {
            const text = msg.message?.content;
            if (text) setLastTranscript(`AI: ${text}`);
          }
          // Meta indicating audio is on its way (backend forwards this after sending audio)
          else if (msg.type === "audio_output_meta") {
            // use meta to show animation or other UI state
            setAiSpeaking(true);
          } else {
            // ignore other event types (raw / telemetry)
            // console.debug("WS event:", msg);
          }
        } catch (e) {
          console.error("Failed to parse WS message", e);
        }
      }
    };
  }, [interviewId]);

  // Audio player: sequentially play queued blobs
  const playNextAudioChunk = useCallback(async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;

    isPlayingRef.current = true;
    setAiSpeaking(true);

    const blob = audioQueueRef.current.shift();
    if (!blob) {
      isPlayingRef.current = false;
      setAiSpeaking(false);
      return;
    }

    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);

    audio.onended = () => {
      URL.revokeObjectURL(url);
      isPlayingRef.current = false;
      if (!mountedRef.current) return;
      if (audioQueueRef.current.length === 0) {
        setAiSpeaking(false);
      } else {
        // continue playing next chunk
        playNextAudioChunk();
      }
    };

    audio.onerror = (e) => {
      console.error("Audio playback error:", e);
      URL.revokeObjectURL(url);
      isPlayingRef.current = false;
      setAiSpeaking(false);
    };

    // Attempt playback (may be blocked by browser until user gesture; but toggleRecording StartSession handles user gesture)
    await audio.play().catch((e) => {
      console.error("Audio playback blocked:", e);
      isPlayingRef.current = false;
      // leave aiSpeaking true until next audio chunk ends or queue empties
    });
  }, []);

  // Microphone recording toggle
  const toggleRecording = useCallback(async () => {
    if (!isConnected) return;

    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Use 240ms chunks to be friendly to the websocket / transcription service
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0 && socketRef.current?.readyState === WebSocket.OPEN) {
          try {
            socketRef.current.send(e.data);
          } catch (err) {
            console.error("Failed to send audio chunk:", err);
          }
        }
      };

      recorder.onstart = () => {
        // small UX tweak
      };

      recorder.onstop = () => {
        // stop tracks so browser can release mic
        try {
          stream.getTracks().forEach((t) => t.stop());
        } catch (err) {}
      };

      recorder.start(240); // 240ms chunks
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access error:", err);
      setError("Microphone access denied.");
    }
  }, [isRecording, isConnected]);

  // Cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      try {
        socketRef.current?.close();
      } catch (e) {}
      try {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
          mediaRecorderRef.current.stop();
        }
      } catch (e) {}
    };
  }, []);

  // Render
  if (!hasStarted) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-muted/10 p-6 space-y-6">
        <div className="p-6 bg-background rounded-full shadow-xl border-4 border-primary/10">
          <Radio className="w-16 h-16 text-primary" />
        </div>
        <div className="text-center max-w-sm">
          <h2 className="text-2xl font-bold mb-2">Voice Interview</h2>
          <p className="text-muted-foreground mb-6">Click start to connect to the AI interviewer.</p>
          {error && <p className="text-destructive text-sm mb-4">{error}</p>}
          <Button size="lg" onClick={startSession} className="w-full font-semibold text-lg h-12">
            <Power className="mr-2 h-5 w-5" /> Start Session
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full items-center justify-center bg-gradient-to-b from-background to-muted/20 p-6">
      <div className="relative w-64 h-64 flex items-center justify-center mb-8">
        <div className={`absolute inset-0 rounded-full border-4 border-primary/20 ${isRecording ? "animate-ping" : ""}`} />
        <div className={`absolute inset-4 rounded-full border-4 border-primary/40 ${aiSpeaking ? "animate-pulse" : ""}`} />

        <div className="z-10 bg-background rounded-full p-8 shadow-2xl border border-border transition-all duration-300">
          {aiSpeaking ? (
            <Volume2 className="w-16 h-16 text-primary animate-bounce" />
          ) : isRecording ? (
            <Activity className="w-16 h-16 text-red-500 animate-pulse" />
          ) : (
            <Radio className="w-16 h-16 text-muted-foreground" />
          )}
        </div>
      </div>

      <div className="text-center space-y-4 max-w-md z-10 h-32">
        <h2 className="text-2xl font-bold tracking-tight">{aiSpeaking ? "AI is speaking..." : isRecording ? "Listening..." : "Your Turn"}</h2>
        <Alert className="bg-background/80 backdrop-blur border-primary/20">
          <AlertDescription className="text-center italic text-md">"{lastTranscript}"</AlertDescription>
        </Alert>
      </div>

      <div className="mt-8 z-10">
        <Button
          size="lg"
          variant={isRecording ? "destructive" : "default"}
          className={`rounded-full w-24 h-24 shadow-xl transition-all duration-300 ${isRecording ? "scale-110 ring-4 ring-red-500/30" : "hover:scale-105"}`}
          onClick={toggleRecording}
          disabled={!isConnected || aiSpeaking}
        >
          {isRecording ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
        </Button>
        <p className="text-xs text-muted-foreground mt-4 text-center font-medium uppercase tracking-wider">
          {isRecording ? "Tap to Send" : "Tap to Speak"}
        </p>
      </div>
    </div>
  );
}
