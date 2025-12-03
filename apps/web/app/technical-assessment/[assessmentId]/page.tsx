"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ResizableHandle, 
  ResizablePanel, 
  ResizablePanelGroup 
} from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  LoaderCircle, 
  Terminal, 
  CheckCircle2, 
  XCircle, 
  Play, 
  Send, 
  Code2, 
  Cpu, 
  ArrowLeft,
  Settings,
  Bug,
  ListChecks,
  AlertTriangle
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

import { CodeEditor } from '@/components/code-editor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { GlassPanel } from '@/components/ui/glass-panel';
import { cn } from '@/lib/utils';

// --- TYPE DEFINITIONS ---
type Question = {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  testCases: any[];
};

type AssessmentData = {
  id: string;
  status: string;
  technicalAssessment: {
    id: string;
    questions: Question[];
  } | null;
};

type EvaluationResult = {
  status: 'passed' | 'failed' | 'error';
  message?: string;
  expected?: any;
  actual?: any;
};

// --- ANIMATION VARIANTS ---
const listContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const listItem = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0 }
};

// --- MAIN COMPONENT ---
export default function TechnicalAssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const assessmentId = params.assessmentId as string;

  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('// Initialize system...\n// Write your solution below.');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluationResults, setEvaluationResults] = useState<EvaluationResult[] | null>(null);

  // --- DATA FETCHING ---
  useEffect(() => {
    if (!assessmentId) return;
    const fetchAssessment = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/assessment/${assessmentId}`);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to fetch assessment data.');
        }
        const data = await res.json();
        setAssessment(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        toast({
          title: "System Error",
          description: "Could not load assessment module.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchAssessment();
  }, [assessmentId, toast]);

  // --- ACTIONS ---
  const handleRunCode = async () => {
    const questionIds = assessment?.technicalAssessment?.questions.map(q => q.id);
    if (!questionIds || questionIds.length === 0) {
      toast({ title: "Error", description: "No questions found in module.", variant: "destructive" });
      return;
    }

    setIsEvaluating(true);
    setEvaluationResults(null);
    try {
      const res = await fetch('/api/assessment/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language, questionIds }),
      });
      
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Evaluation Protocol Failed');
      
      setEvaluationResults(result.results[0].testCases);
      // toast({ title: "Execution Complete", description: "Diagnostics available in console." });

    } catch (err) {
      toast({ title: "Runtime Error", description: "Code evaluation failed.", variant: "destructive" });
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleSubmitAssessment = async () => {
    setIsSubmitting(true);
    try {
      const questionIds = assessment?.technicalAssessment?.questions.map(q => q.id);
      if (!questionIds || !assessment?.technicalAssessment?.id) {
          throw new Error("Assessment data corrupted.");
      }

      const res = await fetch('/api/assessment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentId: assessment?.id,
          technicalAssessmentId: assessment?.technicalAssessment?.id,
          code,
          language,
          questionIds
        }),
      });
      
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Submission Failed');

      toast({
        title: "Module Complete",
        description: `Final Accuracy: ${result.score.toFixed(1)}%. Uploading results...`,
        className: "bg-green-500 text-white border-0"
      });

      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 2000);

    } catch (err) {
      toast({ title: "Submission Failed", description: "Network error. Please try again.", variant: "destructive" });
      setIsSubmitting(false);
    }
  };

  const question = assessment?.technicalAssessment?.questions[0];

  // --- LOADING STATE ---
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#09090b] flex-col gap-6">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
          <LoaderCircle className="h-16 w-16 animate-spin text-primary relative z-10" />
        </div>
        <div className="space-y-2 text-center">
          <h2 className="text-xl font-bold text-white tracking-widest uppercase">Initializing IDE</h2>
          <p className="text-sm text-muted-foreground font-mono">Loading Sandbox Environment...</p>
        </div>
      </div>
    );
  }

  // --- ERROR STATE ---
  if (error || !question) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#09090b] p-4">
        <GlassPanel className="max-w-md p-8 text-center border-destructive/30 bg-destructive/5">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold text-destructive mb-2">Module Load Error</h2>
          <p className="text-muted-foreground mb-6 font-mono text-sm">{error || 'Data corruption detected.'}</p>
          <Button variant="outline" onClick={() => router.push('/dashboard')} className="border-destructive/30 hover:bg-destructive/10 hover:text-destructive">
            <ArrowLeft className="mr-2 h-4 w-4" /> Return to Mission Control
          </Button>
        </GlassPanel>
      </div>
    );
  }

  // --- CALC PASS RATE ---
  const passedCount = evaluationResults?.filter(r => r.status === 'passed').length || 0;
  const totalCount = evaluationResults?.length || 0;
  const passRate = totalCount > 0 ? (passedCount / totalCount) * 100 : 0;

  // --- IDE LAYOUT ---
  return (
    <div className="h-screen w-screen flex flex-col bg-[#09090b] text-foreground overflow-hidden font-sans selection:bg-primary/30">
      
      {/* 1. IDE Header */}
      <header className="h-14 shrink-0 border-b border-white/5 bg-[#0a0a0b]/80 backdrop-blur-md flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')} className="text-muted-foreground hover:text-white hover:bg-white/5">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
              <Cpu className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="font-bold text-sm tracking-wide text-white leading-none">
                FortiTwin <span className="text-primary">IDE</span>
              </div>
              <div className="text-[10px] text-muted-foreground font-mono mt-0.5 uppercase tracking-wider">
                v2.4.0 Stable
              </div>
            </div>
          </div>
          <div className="h-6 w-[1px] bg-white/10 mx-2" />
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn(
                "text-[10px] px-2 py-0.5 border-0 font-bold uppercase tracking-wider",
                question.difficulty === "Hard" ? "bg-red-500/10 text-red-500" :
                question.difficulty === "Medium" ? "bg-yellow-500/10 text-yellow-500" :
                "bg-green-500/10 text-green-500"
              )}>
                {question.difficulty}
            </Badge>
            <h1 className="text-sm font-medium text-white/80 truncate max-w-[300px]">
              {question.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-[140px] h-9 bg-white/5 border-white/10 text-xs font-medium text-white/80 hover:bg-white/10 transition-colors focus:ring-primary/20">
              <Code2 className="w-3.5 h-3.5 mr-2 text-primary" />
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent className="bg-[#1e1e1e] border-white/10 text-white">
              <SelectItem value="javascript">JavaScript (Node)</SelectItem>
              <SelectItem value="python">Python 3.9</SelectItem>
            </SelectContent>
          </Select>

          <div className="h-6 w-[1px] bg-white/10" />

          <Button 
            size="sm" 
            onClick={handleRunCode} 
            disabled={isEvaluating || isSubmitting}
            className="h-9 px-4 bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 border border-blue-600/20 shadow-none hover:shadow-[0_0_15px_rgba(37,99,235,0.2)] transition-all"
          >
            {isEvaluating ? <LoaderCircle className="mr-2 h-3.5 w-3.5 animate-spin"/> : <Play className="mr-2 h-3.5 w-3.5 fill-current" />}
            Run Code
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" disabled={isSubmitting} className="h-9 px-5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-[0_0_15px_rgba(124,58,237,0.3)]">
                {isSubmitting ? <LoaderCircle className="mr-2 h-3.5 w-3.5 animate-spin"/> : <Send className="mr-2 h-3.5 w-3.5" />}
                Submit
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-[#0a0a0b] border-white/10 text-white">
              <AlertDialogHeader>
                <AlertDialogTitle>Submit Final Solution?</AlertDialogTitle>
                <AlertDialogDescription className="text-white/60">
                  This will execute your code against hidden test cases. Your score will be finalized.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/5 hover:text-white">Back to Editor</AlertDialogCancel>
                <AlertDialogAction onClick={handleSubmitAssessment} className="bg-primary hover:bg-primary/90 text-white">
                  Confirm Submission
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      {/* 2. Main Workspace */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        
        {/* LEFT PANEL: Problem Description */}
        <ResizablePanel defaultSize={35} minSize={25} className="bg-[#0a0a0b] relative">
          <ScrollArea className="h-full">
            <div className="p-6 space-y-8 pb-20">
              {/* Title Block */}
              <div>
                <h2 className="text-2xl font-bold mb-4 text-white font-heading tracking-tight">{question.title}</h2>
                <div className="prose prose-invert prose-sm max-w-none text-muted-foreground/80 leading-relaxed font-body">
                  {question.description}
                </div>
              </div>

              {/* Specs Panel */}
              <GlassPanel className="p-5 bg-white/[0.02] border-white/5 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-white/90 uppercase tracking-widest border-b border-white/5 pb-3">
                  <Terminal className="h-3.5 w-3.5 text-primary" /> Input/Output Specs
                </div>
                
                {question.testCases[0] && (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <span className="text-xs text-muted-foreground font-mono uppercase">Sample Input</span>
                      <div className="bg-black/50 border border-white/5 p-3 rounded-lg font-mono text-sm text-green-400 overflow-x-auto">
                        {JSON.stringify(question.testCases[0].input, null, 2)}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-xs text-muted-foreground font-mono uppercase">Expected Output</span>
                      <div className="bg-black/50 border border-white/5 p-3 rounded-lg font-mono text-sm text-yellow-400 overflow-x-auto">
                        {JSON.stringify(question.testCases[0].expectedOutput, null, 2)}
                      </div>
                    </div>
                  </div>
                )}
              </GlassPanel>

               {/* Constraints (Mock) */}
               <div className="space-y-2">
                 <h4 className="text-xs font-bold text-white/50 uppercase tracking-widest">Constraints</h4>
                 <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1 font-mono">
                   <li>0 ≤ n ≤ 10^5</li>
                   <li>Time Limit: 2.0s</li>
                   <li>Memory Limit: 256MB</li>
                 </ul>
               </div>
            </div>
          </ScrollArea>
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-white/5 hover:bg-primary/50 transition-colors w-1.5 border-l border-white/5" />

        {/* RIGHT PANEL: Editor & Console */}
        <ResizablePanel defaultSize={65} minSize={40}>
          <ResizablePanelGroup direction="vertical">
            
            {/* EDITOR AREA */}
            <ResizablePanel defaultSize={70} minSize={30} className="relative bg-[#1e1e1e]">
              <div className="absolute top-0 left-0 right-0 h-9 bg-[#1e1e1e] border-b border-white/5 flex items-center px-4 justify-between z-10">
                <div className="flex items-center gap-2">
                    <div className="px-3 py-1 bg-[#2d2d2d] rounded-t-sm text-xs text-white border-t-2 border-primary">
                        solution.{language === 'javascript' ? 'js' : 'py'}
                    </div>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-white/30 font-mono">
                    <span>UTF-8</span>
                    <span>{language === 'javascript' ? 'JavaScript' : 'Python'}</span>
                </div>
              </div>
              <div className="pt-9 h-full">
                <CodeEditor 
                    value={code} 
                    onChange={setCode} 
                    language={language}
                    className="h-full font-mono text-[13px]"
                />
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle className="bg-white/5 hover:bg-primary/50 transition-colors h-1.5 border-t border-white/5" />

            {/* CONSOLE AREA */}
            <ResizablePanel defaultSize={30} minSize={15} className="bg-[#0a0a0b] flex flex-col">
              {/* Console Header */}
              <div className="h-10 shrink-0 border-b border-white/10 px-4 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-primary/70" />
                  <span className="text-xs font-bold text-white/70 uppercase tracking-widest">System Console</span>
                </div>
                
                {evaluationResults && (
                   <div className="flex items-center gap-3">
                      <span className={cn("text-xs font-bold", passRate === 100 ? "text-green-400" : "text-orange-400")}>
                         {passRate.toFixed(0)}% Passed
                      </span>
                      <Progress value={passRate} className="w-24 h-1.5 bg-white/10" />
                   </div>
                )}
              </div>
              
              <ScrollArea className="flex-1 p-4">
                <div className="font-mono text-sm min-h-full">
                  {!evaluationResults && !isEvaluating && (
                    <div className="h-full flex flex-col items-center justify-center text-white/20 gap-3 py-8">
                      <Bug className="h-10 w-10 opacity-20" />
                      <p className="text-xs uppercase tracking-widest">Ready to Execute</p>
                    </div>
                  )}
                  
                  {isEvaluating && (
                    <div className="flex flex-col items-center justify-center py-8 gap-3 text-primary animate-pulse">
                      <LoaderCircle className="h-6 w-6 animate-spin" />
                      <span className="text-xs font-bold uppercase tracking-widest">Running Test Suites...</span>
                    </div>
                  )}

                  {evaluationResults && (
                    <motion.div 
                        variants={listContainer}
                        initial="hidden"
                        animate="show"
                        className="space-y-3"
                    >
                      {evaluationResults.map((result, index) => (
                        <motion.div 
                            key={index} 
                            variants={listItem}
                            className={cn(
                                "group relative overflow-hidden rounded border p-3 transition-all",
                                result.status === 'passed' 
                                ? "bg-green-500/[0.03] border-green-500/20 hover:bg-green-500/[0.05]" 
                                : "bg-red-500/[0.03] border-red-500/20 hover:bg-red-500/[0.05]"
                            )}
                        >
                            {/* Decorative Status Line */}
                            <div className={cn(
                                "absolute left-0 top-0 bottom-0 w-1", 
                                result.status === 'passed' ? "bg-green-500" : "bg-red-500"
                            )} />

                            <div className="pl-3 flex items-start gap-3">
                                {result.status === 'passed' 
                                ? <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500 mt-0.5"/> 
                                : <XCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5"/>
                                }
                                
                                <div className="space-y-1 w-full">
                                    <div className="flex justify-between items-center">
                                        <span className={cn("font-bold text-xs uppercase tracking-wider", result.status === 'passed' ? "text-green-400" : "text-red-400")}>
                                            Test Case {index + 1}
                                        </span>
                                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded border uppercase", 
                                            result.status === 'passed' ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400")}>
                                            {result.status}
                                        </span>
                                    </div>

                                    {result.status === 'failed' && (
                                        <div className="mt-2 grid grid-cols-1 gap-2 text-xs">
                                            <div className="bg-black/40 p-2 rounded border border-white/5 flex gap-2 overflow-hidden">
                                                <span className="text-white/40 w-16 shrink-0">Expected:</span>
                                                <span className="text-green-400 font-bold truncate">{JSON.stringify(result.expected)}</span>
                                            </div>
                                            <div className="bg-black/40 p-2 rounded border border-white/5 flex gap-2 overflow-hidden">
                                                <span className="text-white/40 w-16 shrink-0">Actual:</span>
                                                <span className="text-red-400 font-bold truncate">{JSON.stringify(result.actual)}</span>
                                            </div>
                                        </div>
                                    )}

                                    {result.status === 'error' && (
                                        <div className="mt-2 p-2 bg-red-950/20 border border-red-500/10 rounded text-red-300 text-xs font-mono break-all">
                                            {result.message}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </div>
              </ScrollArea>
            </ResizablePanel>

          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* 3. Status Bar */}
      <footer className="h-6 bg-[#007acc] text-white flex items-center px-3 justify-between text-[10px] font-mono select-none">
        <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><Settings className="w-3 h-3" /> MASTER</span>
            <span>{isEvaluating ? "EXECUTING..." : "READY"}</span>
            <span>0 ERRORS</span>
        </div>
        <div className="flex items-center gap-4 opacity-80">
            <span>Ln 1, Col 1</span>
            <span>UTF-8</span>
            <span>{language === 'javascript' ? 'JavaScript' : 'Python'}</span>
        </div>
      </footer>
    </div>
  );
}