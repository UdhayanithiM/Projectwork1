"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Power, Activity, Volume2 } from "lucide-react";
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
      <div className="flex flex-col h-full items-center justify-center p-8 space-y-8 relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-32 h-32 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-[0_0_40px_-10px_rgba(124,58,237,0.3)] animate-float">
            <Mic className="w-12 h-12 text-primary" />
          </div>

          <h2 className="text-3xl font-bold mt-8">Voice Interview</h2>

          <p className="text-muted-foreground text-center max-w-sm mt-2">
            Engage in a natural conversation with our AI.
          </p>

          <Button
            size="lg"
            onClick={startSession}
            className="mt-8 px-8 h-12 text-lg shadow-lg shadow-primary/25 rounded-full"
          >
            <Power className="mr-2 h-5 w-5" /> Start Session
          </Button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------
  // UI — SESSION ACTIVE (ORB)
  // -------------------------------------------------------
  return (
    <div className="flex flex-col h-full items-center justify-between p-8 relative">

      {/* Connection Status */}
      <div className="absolute top-4 left-4">
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border",
            isConnected
              ? "bg-green-500/10 text-green-500 border-green-500/20"
              : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
          )}
        >
          <div
            className={cn(
              "w-2 h-2 rounded-full",
              isConnected ? "bg-green-500 animate-pulse" : "bg-yellow-500"
            )}
          />
          {isConnected ? "Live Connection" : "Connecting..."}
        </div>
      </div>

      {/* ORB */}
      <div className="flex-1 flex items-center justify-center w-full">
        <div className="relative flex items-center justify-center">

          {/* Rings */}
          <div
            className={cn(
              "absolute w-64 h-64 rounded-full border border-primary/20 opacity-0 transition-all duration-1000",
              (isRecording || aiSpeaking) && "opacity-100 animate-ping"
            )}
          />
          <div
            className={cn(
              "absolute w-48 h-48 rounded-full border border-primary/40 opacity-0 transition-all duration-1000 delay-75",
              (isRecording || aiSpeaking) && "opacity-100 animate-pulse"
            )}
          />

          {/* Core Orb */}
          <div
            className={cn(
              "w-32 h-32 rounded-full shadow-[0_0_60px_-10px_rgba(124,58,237,0.6)] flex items-center justify-center transition-all duration-500",
              aiSpeaking
                ? "bg-gradient-to-br from-primary to-purple-600 scale-110"
                : "bg-black border-2 border-primary/50"
            )}
          >
            {aiSpeaking ? (
              <Activity className="w-12 h-12 text-white animate-bounce" />
            ) : (
              <Mic
                className={cn(
                  "w-10 h-10 text-primary transition-all",
                  isRecording && "animate-pulse"
                )}
              />
            )}
          </div>
        </div>
      </div>

      {/* Transcript */}
      <div className="w-full max-w-2xl text-center space-y-4">
        <GlassPanel className="p-6 min-h-[100px] flex items-center justify-center">
          <p className="text-lg font-medium leading-relaxed">
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
            className="rounded-full h-12 w-12 border-destructive/30 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
          >
            <Power className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
