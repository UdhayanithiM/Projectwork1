"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Camera, 
  Mic, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  ShieldCheck, 
  Wifi,
  Loader2,
  Gauge,
  ScanFace
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { toast } from "@/hooks/use-toast"; // Adjusted import based on previous context
import { cn } from "@/lib/utils";

export default function MirrorRoomPage() {
  const router = useRouter();
  const params = useParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [permissions, setPermissions] = useState({ video: false, audio: false });
  const [checking, setChecking] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [progress, setProgress] = useState(0);

  // 1. Initialize Hardware Check
  useEffect(() => {
    const checkHardware = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        
        setStream(mediaStream);
        setPermissions({ video: true, audio: true });
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Hardware access denied:", err);
        toast({
            variant: "destructive",
            title: "Access Denied",
            description: "Camera and Microphone permissions are required."
        });
        setPermissions({ video: false, audio: false });
      } finally {
        setChecking(false);
      }
    };

    // Simulate "System Scanning" progress bar
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          checkHardware();
          return 100;
        }
        return prev + 4; // Speed of check
      });
    }, 50);

    return () => {
      clearInterval(interval);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []); 

  const allSystemsGo = permissions.video && permissions.audio && progress === 100;

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 font-body text-white overflow-hidden relative selection:bg-primary/30">
      
      {/* Background Grid & Ambient Light */}
      <div className="absolute inset-0 bg-grid-white/5 opacity-20 pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
      <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
        
        {/* LEFT: INSTRUCTIONS & STATUS */}
        <div className="flex flex-col justify-center space-y-8">
          <div>
            <div className="flex items-center gap-2 mb-4 text-primary animate-pulse-soft">
              <Gauge className="w-5 h-5" />
              <span className="text-sm font-mono tracking-widest uppercase">System Calibration</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4 tracking-tight">
              Pre-Flight <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">
                Identity Check
              </span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-md leading-relaxed">
              We are establishing a secure environment for your assessment. Please verify your equipment to proceed.
            </p>
          </div>

          {/* Status List */}
          <div className="space-y-4">
            <StatusItem 
              icon={Camera} 
              label="Video Feed" 
              status={checking ? "checking" : permissions.video ? "ready" : "error"} 
            />
            <StatusItem 
              icon={Mic} 
              label="Audio Input" 
              status={checking ? "checking" : permissions.audio ? "ready" : "error"} 
            />
            <StatusItem 
              icon={Wifi} 
              label="Network Latency" 
              status={checking ? "checking" : "ready"} // Mock check
            />
          </div>

          {/* Error Message */}
          {!allSystemsGo && !checking && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 animate-fade-in">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="text-sm text-red-200">
                <p className="font-bold">Hardware Missing</p>
                <p>We cannot detect your camera or microphone. Please allow permissions in your browser settings.</p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: THE MIRROR (Video Feed) */}
        <div className="relative">
          <GlassPanel className="p-2 border-white/10 bg-black/40 backdrop-blur-2xl h-[400px] lg:h-[500px] flex flex-col relative overflow-hidden shadow-2xl">
            
            {/* Holographic Scanning Line */}
            {checking && (
              <motion.div 
                className="absolute top-0 left-0 w-full h-[2px] bg-primary z-20 shadow-[0_0_20px_rgba(124,58,237,0.8)]"
                animate={{ top: ["0%", "100%", "0%"] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              />
            )}

            {/* Video Canvas */}
            <div className="relative flex-1 bg-black rounded-lg overflow-hidden flex items-center justify-center border border-white/5 group">
              {permissions.video ? (
                <>
                    <video 
                    ref={videoRef} 
                    autoPlay 
                    muted 
                    playsInline 
                    className="w-full h-full object-cover transform scale-x-[-1] opacity-90" 
                    />
                    {/* Face Target Reticle Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                        <ScanFace className="w-32 h-32 text-primary" strokeWidth={0.5} />
                    </div>
                </>
              ) : (
                <div className="text-center space-y-4 p-6">
                  {checking ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                      <p className="text-sm text-muted-foreground font-mono uppercase tracking-wider">Initializing Sensors...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                        <Camera className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground font-mono text-sm">Signal Lost</p>
                    </div>
                  )}
                </div>
              )}

              {/* Overlay HUD */}
              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end z-30">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur border border-white/10 text-[10px] font-mono font-bold tracking-wider uppercase">
                  <span className={cn("w-2 h-2 rounded-full", allSystemsGo ? "bg-green-500 animate-pulse" : "bg-yellow-500")} />
                  {allSystemsGo ? "Systems Online" : `Calibrating ${progress}%`}
                </div>
                <ShieldCheck className={cn("w-5 h-5 transition-colors", allSystemsGo ? "text-green-500" : "text-white/20")} />
              </div>
            </div>

            {/* Action Bar */}
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-[10px] text-muted-foreground/60 max-w-[200px] text-center sm:text-left">
                Session ID: <span className="font-mono text-primary/60">{params.assessmentId?.slice(0,8)}</span><br/>
                Recording enabled for quality assurance.
              </div>
              <Button 
                size="lg" 
                // Uses custom 'neon' variant if available, otherwise default
                className={cn(
                    "min-w-[180px] transition-all duration-300 shadow-lg",
                    allSystemsGo 
                        ? "bg-primary hover:bg-primary/90 text-white shadow-glow-primary" 
                        : "opacity-50 cursor-not-allowed bg-white/5 text-muted-foreground"
                )}
                disabled={!allSystemsGo}
                onClick={() => router.push(`/take-interview/${params.assessmentId}`)}
              >
                {checking ? (
                  <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/> Scanning...</span>
                ) : (
                  <>
                    Enter Simulation <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}

// --- Sub-Component: Status Row ---
function StatusItem({ icon: Icon, label, status }: { icon: any, label: string, status: "checking" | "ready" | "error" }) {
  return (
    <div className={cn(
        "flex items-center justify-between p-4 rounded-xl border transition-all duration-300",
        status === "ready" ? "bg-green-500/5 border-green-500/20" : 
        status === "error" ? "bg-red-500/5 border-red-500/20" : 
        "bg-white/5 border-white/5"
    )}>
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
          status === "ready" ? "bg-green-500/20 text-green-500" :
          status === "error" ? "bg-red-500/20 text-red-500" :
          "bg-white/10 text-muted-foreground"
        )}>
          <Icon className="w-5 h-5" />
        </div>
        <span className={cn(
            "font-medium",
            status === "ready" ? "text-white" : "text-muted-foreground"
        )}>{label}</span>
      </div>
      
      {status === "checking" && <Loader2 className="w-5 h-5 text-primary animate-spin" />}
      {status === "ready" && <CheckCircle2 className="w-5 h-5 text-green-500" />}
      {status === "error" && <AlertTriangle className="w-5 h-5 text-red-500" />}
    </div>
  )
}