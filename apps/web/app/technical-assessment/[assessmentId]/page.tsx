// in app/technical-assessment/[assessmentId]/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LoaderCircle, Terminal, CheckCircle, XCircle, Play, Send } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import Editor from '@monaco-editor/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

// --- TYPE DEFINITIONS ---
type Question = {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  testCases: any[];
};

type AssessmentData = {
  id:string;
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

  // --- CORE LOGIC ---
  const handleRunCode = async () => {
    const questionIds = assessment?.technicalAssessment?.questions.map(q => q.id);
    if (!questionIds || questionIds.length === 0) {
      toast({ title: "Error", description: "No questions found for evaluation.", variant: "destructive" });
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
      toast({ title: "Evaluation Complete", description: "Check the results panel." });

    } catch (err) {
      toast({ title: "Evaluation Error", description: err instanceof Error ? err.message : 'An unknown error occurred.', variant: "destructive" });
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

      // Using the more robust submit endpoint now
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
      if (!res.ok) throw new Error(result.error || 'Failed to submit assessment.');

      toast({
        title: "Assessment Submitted Successfully!",
        description: `Your final score is ${result.score.toFixed(1)}%. Redirecting to dashboard...`,
        className: "bg-green-100 dark:bg-green-900",
      });

      // Redirect back to the dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh(); // Tell Next.js to refetch server data on the dashboard
      }, 2000);

    } catch (err) {
      toast({ title: "Submission Error", description: err instanceof Error ? err.message : 'An unknown error occurred.', variant: "destructive" });
      setIsSubmitting(false);
    }
  };


  const question = assessment?.technicalAssessment?.questions[0];

  // --- RENDER LOGIC ---
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading Assessment...</p>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-4">
        <Alert variant="destructive" className="max-w-md">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error Loading Assessment</AlertTitle>
          <AlertDescription>
            {error || 'The requested assessment could not be found or is invalid.'}
            <Button variant="link" onClick={() => router.push('/dashboard')}>Return to Dashboard</Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-background text-foreground">
      <header className="flex h-16 items-center justify-between border-b px-6 bg-card">
        <h1 className="text-xl font-bold">
          <span className="text-primary">Forti</span>Twin Technical Assessment
        </h1>
        <div className="flex items-center gap-4">
            {/* THIS IS THE NEW SUBMIT BUTTON WRAPPED IN A CONFIRMATION DIALOG */}
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isSubmitting}>
                        {isSubmitting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4" />}
                        Submit Final Assessment
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action is final. You will not be able to change your code after submission. Your score will be calculated and saved.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSubmitAssessment}>Continue & Submit</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
      </header>

      <ResizablePanelGroup direction="horizontal" className="h-[calc(100vh-4rem)]">
        {/* Left Panel: Question Description */}
        <ResizablePanel defaultSize={40} minSize={25}>
          <ScrollArea className="h-full p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-semibold">{question.title}</h2>
                <Badge>{question.difficulty}</Badge>
              </div>
              <p className="text-muted-foreground whitespace-pre-wrap">{question.description}</p>
              
              <div className="mt-6">
                <h3 className="font-semibold mb-2">Example Test Case:</h3>
                <div className="bg-muted p-4 rounded-md text-sm font-mono">
                  <p>Input: {JSON.stringify(question.testCases[0].input)}</p>
                  <p>Expected Output: {JSON.stringify(question.testCases[0].expectedOutput)}</p>
                </div>
              </div>
            </div>
          </ScrollArea>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Panel: Code Editor and Output */}
        <ResizablePanel defaultSize={60} minSize={40}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={75} minSize={50}>
                <div className="flex h-full flex-col">
                    <div className="flex items-center justify-between p-2 border-b">
                         <Select value={language} onValueChange={setLanguage}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select Language" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="javascript">JavaScript</SelectItem>
                                <SelectItem value="python">Python</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Editor
                        height="100%"
                        language={language}
                        theme="vs-dark"
                        value={code}
                        onChange={(value) => setCode(value || '')}
                        options={{ minimap: { enabled: false } }}
                    />
                </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={25} minSize={15}>
                 <div className="h-full flex flex-col">
                    <div className="flex items-center justify-between p-2 border-b">
                        <h3 className="text-lg font-semibold">Results</h3>
                         <Button size="sm" onClick={handleRunCode} disabled={isEvaluating || isSubmitting}>
                            {isEvaluating ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin"/> : <Play className="mr-2 h-4 w-4" />}
                            Run Code
                        </Button>
                    </div>
                    <ScrollArea className="flex-1 p-4">
                        {!evaluationResults && <p className="text-muted-foreground">Click "Run Code" to see test results.</p>}
                        {isEvaluating && <LoaderCircle className="h-6 w-6 animate-spin" />}
                        {evaluationResults && (
                            <div className="space-y-2">
                                {evaluationResults.map((result, index) => (
                                    <div key={index} className={`flex items-start p-2 rounded-md ${result.status === 'passed' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                                        {result.status === 'passed' ? <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-1"/> : <XCircle className="h-5 w-5 text-red-500 mr-3 mt-1"/>}
                                        <div>
                                            <p className="font-semibold">Test Case #{index + 1}: {result.status.toUpperCase()}</p>
                                            {result.status === 'failed' && (
                                                <div className="text-xs mt-1 font-mono">
                                                    <p>Expected: {JSON.stringify(result.expected)}</p>
                                                    <p>Got: {JSON.stringify(result.actual)}</p>
                                                </div>
                                            )}
                                            {result.status === 'error' && <p className="text-xs mt-1 font-mono text-red-400">{result.message}</p>}
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