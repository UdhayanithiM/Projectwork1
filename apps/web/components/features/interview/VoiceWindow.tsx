"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Power, Activity } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { cn } from "@/lib/utils";

interface VoiceWindowProps {
  interviewId: string;
}

export function VoiceWindow({ interviewId }: VoiceWindowProps) {
  // -------------------------------------------------------
  // STATE
  // -------------------------------------------------------
  const [hasStarted, setHasStarted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [lastTranscript, setLastTranscript] = useState("Ready to start.");
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // -------------------------------------------------------
  // AUDIO + WS REFERENCES
  // -------------------------------------------------------
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const audioQueueRef = useRef<ArrayBuffer[]>([]);
  const playingRef = useRef(false);

  // -------------------------------------------------------
  // PCM Conversion
  // -------------------------------------------------------
  const floatTo16BitPCM = (float32: Float32Array): ArrayBuffer => {
    const buffer = new ArrayBuffer(float32.length * 2);
    const view = new DataView(buffer);
    let offset = 0;

    for (let i = 0; i < float32.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, float32[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return buffer;
  };

  // -------------------------------------------------------
  // AUDIO PLAYBACK (AI → User)
  // -------------------------------------------------------
  const playPCMChunk = async (pcmBuffer: ArrayBuffer) => {
    const audioCtx = audioContextRef.current;
    if (!audioCtx) return;

    const dv = new DataView(pcmBuffer);
    const samples = pcmBuffer.byteLength / 2;

    const float32 = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
      float32[i] = dv.getInt16(i * 2, true) / 32768;
    }

    const sampleRate = 48000;
    const audioBuffer = audioCtx.createBuffer(1, float32.length, sampleRate);
    audioBuffer.getChannelData(0).set(float32);

    const src = audioCtx.createBufferSource();
    src.buffer = audioBuffer;
    src.connect(audioCtx.destination);

    src.onended = () => {
      playingRef.current = false;
      if (audioQueueRef.current.length > 0) {
        const next = audioQueueRef.current.shift()!;
        setTimeout(() => playPCMChunk(next), 0);
      } else {
        setAiSpeaking(false);
      }
    };

    try {
      playingRef.current = true;
      setAiSpeaking(true);
      src.start();
    } catch (err) {
      console.error("Audio start error:", err);
      playingRef.current = false;
      setAiSpeaking(false);
    }
  };

  const enqueue = (pcm: ArrayBuffer) => {
    audioQueueRef.current.push(pcm);
    if (!playingRef.current) {
      playPCMChunk(audioQueueRef.current.shift()!);
    }
  };

  // -------------------------------------------------------
  // WebSocket Handler
  // -------------------------------------------------------
  const handleWsMessage = useCallback(async (ev: MessageEvent) => {
    if (ev.data instanceof ArrayBuffer || ev.data instanceof Blob) {
      const buf = ev.data instanceof Blob ? await ev.data.arrayBuffer() : ev.data;
      enqueue(buf);
      return;
    }

    if (typeof ev.data === "string") {
      let msg;
      try {
        msg = JSON.parse(ev.data);
      } catch {
        return;
      }

      if (msg.type === "assistant_message" && msg.message?.content) {
        setLastTranscript("AI: " + msg.message.content);
      }

      if (msg.type === "user_message" && msg.message?.content) {
        setLastTranscript("You: " + msg.message.content);
      }

      if (msg.type === "user_partial" && msg.partial) {
        setLastTranscript("You: " + msg.partial);
      }

      if (msg.type === "audio_output_meta") {
        setAiSpeaking(true);
      }
    }
  }, []);

  // -------------------------------------------------------
  // START SESSION
  // -------------------------------------------------------
  const startSession = useCallback(async () => {
    setHasStarted(true);
    setError(null);
    setLastTranscript("Connecting...");

    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AC({ sampleRate: 48000 });
      audioContextRef.current = audioCtx;
      await audioCtx.resume();
    } catch (err) {
      setError("Audio init failed");
      return;
    }

    try {
      const protocol = location.protocol === "https:" ? "wss:" : "ws:";
      const url = `${protocol}//${location.host}/ws/hume/${interviewId}`;

      const ws = new WebSocket(url);
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setLastTranscript("AI ready...");
        startRecording();
      };

      ws.onmessage = handleWsMessage;

      ws.onclose = () => {
        setIsConnected(false);
        setIsRecording(false);
      };
    } catch {
      setError("WS connect failed");
    }
  }, [interviewId, handleWsMessage]);

  // -------------------------------------------------------
  // MIC → PCM → WS
  // -------------------------------------------------------
  const startRecording = useCallback(async () => {
    if (!audioContextRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioCtx = audioContextRef.current;

      const src = audioCtx.createMediaStreamSource(stream);
      sourceRef.current = src;

      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      const gain = audioCtx.createGain();
      gain.gain.value = 0;
      gainNodeRef.current = gain;

      processor.onaudioprocess = (evt) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

        const data = evt.inputBuffer.getChannelData(0);
        const pcm = floatTo16BitPCM(data);
        wsRef.current.send(pcm);
      };

      src.connect(processor);
      processor.connect(gain);
      gain.connect(audioCtx.destination);

      setIsRecording(true);
      setLastTranscript("Listening...");
    } catch (err) {
      console.error("Mic error:", err);
      setError("Mic access denied");
    }
  }, []);

  const stopRecording = useCallback(() => {
    try {
      processorRef.current?.disconnect();
      sourceRef.current?.disconnect();
      gainNodeRef.current?.disconnect();

      const tracks = (sourceRef.current?.mediaStream as MediaStream)?.getTracks();
      tracks?.forEach((t) => t.stop());
    } catch {}

    processorRef.current = null;
    sourceRef.current = null;
    gainNodeRef.current = null;

    setIsRecording(false);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      wsRef.current?.close();
      stopRecording();
      audioContextRef.current?.close();
    };
  }, [stopRecording]);

  // -------------------------------------------------------
  // UI — BEFORE START
  // -------------------------------------------------------
  if (!hasStarted) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8 space-y-8 relative overflow-hidden bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl">
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-32 h-32 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shadow-[0_0_60px_-10px_rgba(124,58,237,0.3)] animate-float">
            <Mic className="w-12 h-12 text-primary drop-shadow-[0_0_15px_rgba(124,58,237,0.8)]" />
          </div>

          <h2 className="text-3xl font-bold mt-8 text-white font-heading">Voice Interface</h2>

          <p className="text-muted-foreground text-center max-w-sm mt-2 font-body">
            Engage in a natural, real-time conversation with the FortiTwin Neural Core.
          </p>

          <Button
            size="lg" // Adjusted size for better fit
            className="mt-8 rounded-full px-10 shadow-glow-primary bg-primary hover:bg-primary/90 text-white"
            onClick={startSession}
          >
            <Power className="mr-2 h-5 w-5" /> Initialize Uplink
          </Button>
        </div>
        
        {/* Background Grid */}
        <div className="absolute inset-0 bg-grid-white/5 opacity-20 pointer-events-none" />
      </div>
    );
  }

  // -------------------------------------------------------
  // UI — SESSION ACTIVE (HOLOGRAPHIC CORE)
  // -------------------------------------------------------
  return (
    <div className="flex flex-col h-full items-center justify-between p-8 relative overflow-hidden">

      {/* Connection Status Pill */}
      <div className="absolute top-4 left-4 z-20">
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border backdrop-blur-md transition-all duration-300",
            isConnected
              ? "bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.2)]"
              : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20 animate-pulse"
          )}
        >
          <div
            className={cn(
              "w-2 h-2 rounded-full",
              isConnected ? "bg-green-500 animate-pulse" : "bg-yellow-500"
            )}
          />
          {isConnected ? "Signal Locked" : "Searching Frequencies..."}
        </div>
      </div>

      {/* CENTRAL CORE (ORB VISUALIZER) */}
      <div className="flex-1 flex items-center justify-center w-full relative z-10">
        <div className="relative flex items-center justify-center">

          {/* Outer Ripple Rings */}
          <div
            className={cn(
              "absolute w-80 h-80 rounded-full border border-primary/10 opacity-0 transition-all duration-1000",
              (isRecording || aiSpeaking) && "opacity-100 animate-ping"
            )}
          />
          <div
            className={cn(
              "absolute w-60 h-60 rounded-full border border-primary/30 opacity-0 transition-all duration-1000 delay-75",
              (isRecording || aiSpeaking) && "opacity-100 animate-pulse"
            )}
          />

          {/* The Core Orb */}
          <div
            className={cn(
              "w-40 h-40 rounded-full flex items-center justify-center transition-all duration-500 ease-in-out relative overflow-hidden",
              aiSpeaking
                ? "bg-gradient-to-br from-primary via-purple-500 to-blue-600 scale-110 shadow-[0_0_100px_rgba(124,58,237,0.8)]"
                : "bg-black/80 border-2 border-primary/50 shadow-[0_0_40px_rgba(124,58,237,0.4)]"
            )}
          >
            {/* Inner Texture/Noise */}
            <div className="absolute inset-0 bg-white/5 opacity-20 mix-blend-overlay" />
            
            {aiSpeaking ? (
              <Activity className="w-16 h-16 text-white animate-bounce drop-shadow-lg" />
            ) : (
              <Mic
                className={cn(
                  "w-12 h-12 text-primary transition-all duration-300",
                  isRecording && "animate-pulse text-white drop-shadow-[0_0_10px_#fff]"
                )}
              />
            )}
          </div>
        </div>
      </div>

      {/* Transcript HUD */}
      <div className="w-full max-w-2xl text-center space-y-6 z-20">
        <GlassPanel className="p-6 min-h-[120px] flex items-center justify-center border-white/10 bg-black/60 shadow-2xl relative overflow-hidden">
          {/* Scanning Line Effect */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-primary/50 animate-shimmer opacity-30" />
          
          <p className={cn(
            "text-lg md:text-xl font-medium leading-relaxed font-heading transition-all",
            aiSpeaking ? "text-primary drop-shadow-[0_0_8px_rgba(124,58,237,0.5)]" : "text-white/90"
          )}>
            "{lastTranscript}"
          </p>
        </GlassPanel>

        <div className="flex justify-center">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              wsRef.current?.close();
              stopRecording();
              setHasStarted(false);
            }}
            className="rounded-full h-14 w-14 border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 shadow-lg hover:shadow-red-500/50 transition-all duration-300"
          >
            <Power className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}