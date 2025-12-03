"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  Cpu, 
  ShieldCheck,
  ScanLine
} from "lucide-react";
import { useDropzone } from "react-dropzone"; 

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { GlassPanel } from "@/components/ui/glass-panel";
import { cn } from "@/lib/utils";

// Mock "Scanning" Logs
const scanSteps = [
  "Initializing file stream...",
  "Parsing PDF structure...",
  "Extracting technical keywords...",
  "Identifying experience level...",
  "Calibrating assessment difficulty...",
  "Generating personalized roadmap...",
  "Profile synchronization complete."
];

export default function OnboardingPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "uploading" | "scanning" | "complete">("idle");
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");

  // Simulate the "AI Scanning" process
  const startScanning = useCallback(() => {
    setStatus("scanning");
    setProgress(0);
    setLogs([]);

    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex >= scanSteps.length) {
        clearInterval(interval);
        setStatus("complete");
        setProgress(100);
        return;
      }

      setLogs((prev) => {
        const newLogs = [...prev, scanSteps[stepIndex]];
        // Keep only last 4 logs to prevent overflow/jumping
        return newLogs.slice(-4); 
      });
      setProgress(((stepIndex + 1) / scanSteps.length) * 100);
      stepIndex++;
    }, 800); // Speed of "Scanning"
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setFileName(file.name);
      setStatus("uploading");
      
      // Simulate upload delay before scanning starts
      setTimeout(() => {
        startScanning();
      }, 1500);
    }
  }, [startScanning]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    disabled: status !== "idle"
  });

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden font-body selection:bg-primary/30">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-grid-white/5 opacity-20 pointer-events-none" />
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] animate-pulse-soft" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px]" />

      <div className="max-w-2xl w-full relative z-10">
        
        {/* Header */}
        <div className="text-center mb-10 space-y-4">
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono font-bold tracking-wider"
          >
            <Cpu className="w-3 h-3" /> SYSTEM INITIALIZATION
          </motion.div>
          
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-heading font-bold text-white tracking-tight"
          >
            Upload Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">Profile</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg max-w-lg mx-auto"
          >
            Our AI will scan your resume to extract skills, calibrate difficulty, and generate your training simulation.
          </motion.p>
        </div>

        <GlassPanel className="p-1 border-white/10 bg-black/40 backdrop-blur-2xl shadow-2xl min-h-[420px] relative overflow-hidden flex flex-col">
          <div className="flex-1 flex flex-col justify-center p-8 bg-black/40 rounded-xl relative overflow-hidden">
            
            <AnimatePresence mode="wait">
              
              {/* STATE: IDLE (Upload Zone) */}
              {status === "idle" && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="h-full flex flex-col"
                >
                  <div 
                    {...getRootProps()} 
                    className={cn(
                      "flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-10 transition-all duration-300 cursor-pointer group relative overflow-hidden",
                      isDragActive 
                        ? "border-primary bg-primary/5 shadow-[0_0_30px_rgba(124,58,237,0.1)]" 
                        : "border-white/10 hover:border-primary/50 hover:bg-white/5"
                    )}
                  >
                    <input {...getInputProps()} />
                    
                    {/* Hover Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-white/5 shadow-lg relative z-10">
                      <UploadCloud className={cn("w-10 h-10 transition-colors", isDragActive ? "text-primary" : "text-muted-foreground group-hover:text-white")} />
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-2 relative z-10">
                      {isDragActive ? "Drop profile here..." : "Drag & Drop Resume (PDF)"}
                    </h3>
                    <p className="text-sm text-muted-foreground relative z-10">or click to browse system files</p>
                  </div>
                  
                  <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground/60 font-mono">
                    <ShieldCheck className="w-3 h-3 text-green-500" />
                    <span>ENCRYPTED UPLINK ESTABLISHED</span>
                  </div>
                </motion.div>
              )}

              {/* STATE: UPLOADING / SCANNING */}
              {(status === "uploading" || status === "scanning") && (
                <motion.div
                  key="scanning"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center space-y-8"
                >
                  {/* Visual Scanner Animation */}
                  <div className="relative">
                    <div className="w-32 h-40 border-2 border-primary/30 rounded-xl flex items-center justify-center bg-primary/5 relative overflow-hidden shadow-[0_0_30px_rgba(124,58,237,0.15)]">
                      <FileText className="w-16 h-16 text-primary opacity-50" />
                      
                      {/* Laser Scan Line */}
                      <motion.div 
                        className="absolute top-0 left-0 w-full h-[2px] bg-cyan-400 shadow-[0_0_15px_#22d3ee] z-20"
                        animate={{ top: ["0%", "100%", "0%"] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                      />
                      
                      {/* Grid overlay inside doc */}
                      <div className="absolute inset-0 bg-grid-white/10 opacity-20 pointer-events-none" />
                    </div>
                    
                    {/* Ping Ripples */}
                    <div className="absolute inset-0 border border-primary/20 rounded-xl animate-ping opacity-50" />
                  </div>

                  <div className="w-full max-w-md space-y-4">
                    <div className="flex justify-between text-xs font-mono uppercase tracking-widest text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <ScanLine className="w-3 h-3 animate-pulse" />
                        {status === "uploading" ? "Uploading..." : "Analysing Data"}
                      </span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    
                    <Progress value={progress} className="h-1 bg-white/10" indicatorClassName="bg-gradient-to-r from-primary to-cyan-400" />
                    
                    {/* Cyberpunk Terminal Logs */}
                    <div className="h-28 bg-black/60 rounded-lg p-4 font-mono text-[10px] sm:text-xs border border-white/10 overflow-hidden flex flex-col justify-end shadow-inner">
                      {logs.map((log, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="text-green-400/90 mb-1.5 whitespace-nowrap overflow-hidden text-ellipsis"
                        >
                          <span className="text-white/30 mr-2">[{new Date().toLocaleTimeString([], { hour12: false, second:"2-digit", minute:"2-digit" })}]</span> 
                          {">"} {log}
                        </motion.div>
                      ))}
                      {status === "uploading" && <span className="text-primary animate-pulse">Establishing handshake...</span>}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STATE: COMPLETE */}
              {status === "complete" && (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="h-full flex flex-col items-center justify-center text-center space-y-8"
                >
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/50 shadow-[0_0_40px_rgba(34,197,94,0.4)] relative z-10">
                      <CheckCircle2 className="w-12 h-12 text-green-500 drop-shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
                    </div>
                    <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full" />
                  </div>
                  
                  <div className="space-y-2">
                    <h2 className="text-3xl font-heading font-bold text-white">Profile Calibrated</h2>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                      We've analyzed <strong>{fileName}</strong> and customized the simulation difficulty matrix.
                    </p>
                  </div>

                  <Button 
                    size="xl" 
                    variant="neon" // Assuming you have this variant, otherwise default
                    onClick={() => router.push("/dashboard")}
                    className="w-full max-w-xs group relative overflow-hidden"
                  >
                    Enter Mission Control <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}