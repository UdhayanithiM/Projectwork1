"use client";

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

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const audioQueueRef = useRef<ArrayBuffer[]>([]);
  const playingRef = useRef(false);

  // -----------------------------
  // PCM UTIL
  // -----------------------------
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

  // -----------------------------
  // AUDIO PLAYBACK (AI → USER)
  // -----------------------------
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

  // -----------------------------
  // WS HANDLER
  // -----------------------------
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

      if (msg.type === "assistant_message") {
        if (msg.message?.content) setLastTranscript("AI: " + msg.message.content);
      }

      if (msg.type === "user_message") {
        if (msg.message?.content) setLastTranscript("You: " + msg.message.content);
      }

      if (msg.type === "user_partial") {
        if (msg.partial) setLastTranscript("You: " + msg.partial);
      }

      if (msg.type === "audio_output_meta") {
        setAiSpeaking(true);
      }
    }
  }, []);

  // -----------------------------
  // START SESSION (1-click unlock)
  // -----------------------------
  const startSession = useCallback(async () => {
    setHasStarted(true);
    setError(null);
    setLastTranscript("Connecting...");

    // Unlock audio
    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AC({ sampleRate: 48000 });
      audioContextRef.current = audioCtx;
      await audioCtx.resume();
    } catch (err) {
      setError("Audio init failed");
      return;
    }

    // Connect WS
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

      ws.onerror = (e) => console.error("WS error:", e);

      ws.onclose = () => {
        setIsConnected(false);
        setIsRecording(false);
      };

      ws.onmessage = handleWsMessage;
    } catch {
      setError("WS connect failed");
    }
  }, [interviewId, handleWsMessage]);

  // -----------------------------
  // RECORDING: MIC → PCM → WS
  // -----------------------------
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
      gain.gain.value = 0; // avoid echo
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

  useEffect(() => {
    return () => {
      wsRef.current?.close();
      stopRecording();
      audioContextRef.current?.close();
    };
  }, [stopRecording]);

  // ---------------------------------------------------
  // UI
  // ---------------------------------------------------
  if (!hasStarted) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-6 space-y-6">
        <div className="p-6 rounded-full shadow-xl border-4 border-primary/10">
          <Radio className="w-16 h-16 text-primary" />
        </div>

        <div className="text-center max-w-sm">
          <h2 className="text-2xl font-bold mb-2">Voice Interview</h2>
          <p className="text-muted-foreground mb-6">Click start to begin.</p>

          {error && <p className="text-destructive text-sm mb-3">{error}</p>}

          <Button size="lg" onClick={startSession} className="w-full">
            <Power className="mr-2" /> Start Session
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full items-center justify-center p-6">
      <div className="relative w-64 h-64 flex items-center justify-center mb-8">
        <div className={`absolute inset-0 rounded-full border-4 border-primary/20 ${isRecording ? "animate-ping" : ""}`} />
        <div className={`absolute inset-4 rounded-full border-4 border-primary/40 ${aiSpeaking ? "animate-pulse" : ""}`} />

        <div className="z-10 bg-background rounded-full p-8 shadow-xl border">
          {aiSpeaking ? (
            <Volume2 className="w-16 h-16 text-primary animate-bounce" />
          ) : (
            <Activity className="w-16 h-16 text-red-500 animate-pulse" />
          )}
        </div>
      </div>

      <Alert>
        <AlertDescription className="text-center italic">"{lastTranscript}"</AlertDescription>
      </Alert>
    </div>
  );
}
