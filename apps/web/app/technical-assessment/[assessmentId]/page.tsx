"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  LoaderCircle, 
  Terminal, 
  CheckCircle, 
  XCircle, 
  Play, 
  Send, 
  Code2, 
  Cpu, 
  ArrowLeft 
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
  const [code, setCode] = useState('// Start writing your code here...');
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
          title: "Error",
          description: err instanceof Error ? err.message : 'Could not load assessment.',
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
      toast({ title: "Error", description: "No questions found.", variant: "destructive" });
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
      if (!res.ok) throw new Error(result.error || 'Failed to evaluate code.');
      
      setEvaluationResults(result.results[0].testCases);
      toast({ title: "Evaluation Complete", description: "Check the results console." });

    } catch (err) {
      toast({ title: "Error", description: "Evaluation failed.", variant: "destructive" });
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleSubmitAssessment = async () => {
    setIsSubmitting(true);
    try {
      const questionIds = assessment?.technicalAssessment?.questions.map(q => q.id);
      if (!questionIds || !assessment?.technicalAssessment?.id) {
          throw new Error("Assessment data is missing.");
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
      if (!res.ok) throw new Error(result.error || 'Failed to submit.');

      toast({
        title: "Success!",
        description: `Final Score: ${result.score.toFixed(1)}%. Redirecting...`,
        variant: "success", // Uses our new variant
      });

      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 2000);

    } catch (err) {
      toast({ title: "Submission Failed", description: "Please try again.", variant: "destructive" });
      setIsSubmitting(false);
    }
  };

  const question = assessment?.technicalAssessment?.questions[0];

  // --- LOADING STATE ---
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background flex-col gap-4">
        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg font-medium text-muted-foreground animate-pulse">Initializing Environment...</p>
      </div>
    );
  }

  // --- ERROR STATE ---
  if (error || !question) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-4">
        <GlassPanel className="max-w-md p-8 text-center border-destructive/30">
          <Terminal className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold text-destructive mb-2">Error Loading Assessment</h2>
          <p className="text-muted-foreground mb-6">{error || 'Invalid assessment data.'}</p>
          <Button variant="outline" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Return to Dashboard
          </Button>
        </GlassPanel>
      </div>
    );
  }

  // --- IDE LAYOUT ---
  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground overflow-hidden">
      
      {/* 1. IDE Header */}
      <header className="h-14 shrink-0 border-b border-white/10 bg-[#0a0a0b] flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')} className="text-muted-foreground hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-primary" />
            <span className="font-bold text-sm tracking-wide">
              <span className="text-primary">Forti</span>Twin IDE
            </span>
          </div>
          <div className="h-4 w-[1px] bg-white/10 mx-2" />
          <h1 className="text-sm font-medium text-muted-foreground truncate max-w-[200px]">
            {question.title}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-[140px] h-8 bg-white/5 border-white/10 text-xs">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent className="bg-[#1e1e1e] border-white/10">
              <SelectItem value="javascript">JavaScript</SelectItem>
              <SelectItem value="python">Python</SelectItem>
            </SelectContent>
          </Select>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="default" disabled={isSubmitting} className="h-8 shadow-lg shadow-green-900/20">
                {isSubmitting ? <LoaderCircle className="mr-2 h-3 w-3 animate-spin"/> : <Send className="mr-2 h-3 w-3" />}
                Submit
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-[#0a0a0b] border-white/10">
              <AlertDialogHeader>
                <AlertDialogTitle>Submit Assessment?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will finalize your score. You cannot edit your code afterwards.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-white/10 hover:bg-white/5">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleSubmitAssessment} className="bg-primary hover:bg-primary/90">
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
        <ResizablePanel defaultSize={35} minSize={25} className="bg-background">
          <ScrollArea className="h-full">
            <div className="p-6 space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Badge variant="outline" className={cn(
                    "text-xs px-2 py-0.5 border-white/20",
                    question.difficulty === "Hard" ? "bg-red-500/10 text-red-400" :
                    question.difficulty === "Medium" ? "bg-yellow-500/10 text-yellow-400" :
                    "bg-green-500/10 text-green-400"
                  )}>
                    {question.difficulty}
                  </Badge>
                  <span className="text-xs text-muted-foreground">Technical Assessment</span>
                </div>
                <h2 className="text-2xl font-bold mb-4 text-gradient w-fit">{question.title}</h2>
                <div className="prose prose-invert prose-sm max-w-none text-muted-foreground/90 leading-relaxed">
                  {question.description}
                </div>
              </div>

              {/* Example Case */}
              <GlassPanel className="p-4 bg-white/5 border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
                  <Code2 className="h-3 w-3" /> Example Case
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-[80px_1fr] gap-2 text-sm">
                    <span className="text-muted-foreground font-mono">Input:</span>
                    <code className="bg-black/30 px-2 py-0.5 rounded text-green-300 font-mono">
                      {JSON.stringify(question.testCases[0]?.input)}
                    </code>
                  </div>
                  <div className="grid grid-cols-[80px_1fr] gap-2 text-sm">
                    <span className="text-muted-foreground font-mono">Output:</span>
                    <code className="bg-black/30 px-2 py-0.5 rounded text-yellow-300 font-mono">
                      {JSON.stringify(question.testCases[0]?.expectedOutput)}
                    </code>
                  </div>
                </div>
              </GlassPanel>
            </div>
          </ScrollArea>
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-white/5 hover:bg-primary/50 transition-colors w-1" />

        {/* RIGHT PANEL: Editor & Console */}
        <ResizablePanel defaultSize={65} minSize={40}>
          <ResizablePanelGroup direction="vertical">
            
            {/* EDITOR AREA */}
            <ResizablePanel defaultSize={70} minSize={30} className="relative">
              <CodeEditor 
                value={code} 
                onChange={setCode} 
                language={language}
                className="bg-[#1e1e1e]" // Explicit VS Code Dark background
              />
              {/* Floating Run Button */}
              <div className="absolute bottom-4 right-4 z-10">
                <Button 
                  size="sm" 
                  onClick={handleRunCode} 
                  disabled={isEvaluating || isSubmitting}
                  className="shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
                >
                  {isEvaluating ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin"/> : <Play className="mr-2 h-4 w-4 fill-current" />}
                  Run Code
                </Button>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle className="bg-white/5 hover:bg-primary/50 transition-colors h-1" />

            {/* CONSOLE AREA */}
            <ResizablePanel defaultSize={30} minSize={10} className="bg-[#0a0a0b]">
              <div className="h-full flex flex-col">
                <div className="h-9 border-b border-white/10 px-4 flex items-center gap-2 bg-white/5">
                  <Terminal className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-mono text-muted-foreground uppercase">Console Output</span>
                </div>
                
                <ScrollArea className="flex-1 p-4 font-mono text-sm">
                  {!evaluationResults && !isEvaluating && (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50 gap-2">
                      <Terminal className="h-8 w-8 opacity-20" />
                      <p>Run your code to see results here.</p>
                    </div>
                  )}
                  
                  {isEvaluating && (
                    <div className="flex items-center gap-2 text-primary animate-pulse">
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Evaluating against test cases...
                    </div>
                  )}

                  {evaluationResults && (
                    <div className="space-y-3">
                      {evaluationResults.map((result, index) => (
                        <div key={index} className={cn(
                          "flex items-start gap-3 p-3 rounded border text-xs",
                          result.status === 'passed' 
                            ? "bg-green-500/5 border-green-500/20 text-green-300" 
                            : "bg-red-500/5 border-red-500/20 text-red-300"
                        )}>
                          {result.status === 'passed' 
                            ? <CheckCircle className="h-4 w-4 shrink-0 text-green-500 mt-0.5"/> 
                            : <XCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5"/>
                          }
                          <div className="space-y-1 w-full">
                            <div className="flex justify-between font-semibold">
                              <span>Test Case #{index + 1}</span>
                              <span className="uppercase">{result.status}</span>
                            </div>
                            
                            {result.status === 'failed' && (
                              <div className="mt-2 p-2 bg-black/40 rounded border border-white/5 space-y-1">
                                <div className="flex gap-2">
                                  <span className="text-muted-foreground w-16">Expected:</span>
                                  <span className="text-green-400">{JSON.stringify(result.expected)}</span>
                                </div>
                                <div className="flex gap-2">
                                  <span className="text-muted-foreground w-16">Actual:</span>
                                  <span className="text-red-400">{JSON.stringify(result.actual)}</span>
                                </div>
                              </div>
                            )}
                            
                            {result.status === 'error' && (
                              <p className="mt-1 text-red-400 break-all">{result.message}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </ResizablePanel>

          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}