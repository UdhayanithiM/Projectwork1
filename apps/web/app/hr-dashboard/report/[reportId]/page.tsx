// in app/hr-dashboard/report/[reportId]/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { LoaderCircle, ArrowLeft, User, Calendar, FileText, CheckCircle, BrainCircuit, BarChart3, Star, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Define the shape of our report data
type ReportData = {
  id: string;
  summary: string | null;
  technicalScore: number | null;
  strengths: string[];
  areasForImprovement: string[];
  behavioralScores: {
    communication: number;
    problemSolving: number;
    leadership: number;
  };
  candidate: {
    name: string;
    email: string;
  };
  assessment: {
    createdAt: string;
  };
};

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const reportId = params.reportId as string;

  const [report, setReport] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!reportId) return;

    const fetchReport = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/hr/report/${reportId}`);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to fetch report.');
        }
        setReport(await res.json());
      } catch (err) {
        toast({
          title: 'Error',
          description: err instanceof Error ? err.message : 'Could not load the report.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchReport();
  }, [reportId, toast]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex h-screen items-center justify-center text-center">
        <div>
            <h2 className="text-xl font-bold text-destructive">Report Not Found</h2>
            <p className="text-muted-foreground">The report you are looking for does not exist.</p>
            <Button onClick={() => router.push('/hr-dashboard')} className="mt-4">Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  const chartData = report.behavioralScores ? Object.entries(report.behavioralScores).map(([name, score]) => ({ name, score })) : [];

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <Button variant="ghost" onClick={() => router.push('/hr-dashboard')} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Interview Report</CardTitle>
          <CardDescription>
            AI-generated analysis for the assessment completed on {new Date(report.assessment.createdAt).toLocaleDateString()}.
          </CardDescription>
          <div className="flex flex-wrap gap-x-6 gap-y-2 pt-4 text-sm text-muted-foreground">
              <div className="flex items-center"><User className="mr-2 h-4 w-4" /><span>{report.candidate.name}</span></div>
              <div className="flex items-center"><Calendar className="mr-2 h-4 w-4" /><span>{report.candidate.email}</span></div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
            <Separator />
            
            {/* AI Summary */}
            <section>
                <h2 className="text-xl font-semibold flex items-center mb-4"><FileText className="mr-3 h-5 w-5 text-primary"/>AI Summary</h2>
                <p className="text-muted-foreground">{report.summary || "No summary available."}</p>
            </section>

            {/* Scores Overview */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle className="flex items-center text-lg"><Zap className="mr-2 h-4 w-4"/>Technical Score</CardTitle></CardHeader>
                    <CardContent>
                        <p className="text-5xl font-bold">{report.technicalScore?.toFixed(1) ?? 'N/A'}<span className="text-2xl text-muted-foreground">%</span></p>
                        <p className="text-xs text-muted-foreground mt-2">Based on automated coding challenge results.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="flex items-center text-lg"><BrainCircuit className="mr-2 h-4 w-4"/>Behavioral Analysis</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={150}>
                            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" domain={[0, 100]} />
                                <YAxis type="category" dataKey="name" width={100} />
                                <Tooltip />
                                <Bar dataKey="score" fill="#8884d8" background={{ fill: '#eee' }} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </section>
            
            {/* Strengths & Improvements */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle className="flex items-center text-lg"><CheckCircle className="mr-2 h-4 w-4 text-green-500"/>Key Strengths</CardTitle></CardHeader>
                    <CardContent>
                        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                            {report.strengths?.map((strength, i) => <li key={i}>{strength}</li>)}
                        </ul>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle className="flex items-center text-lg"><Star className="mr-2 h-4 w-4 text-yellow-500"/>Areas for Improvement</CardTitle></CardHeader>
                    <CardContent>
                        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                            {report.areasForImprovement?.map((area, i) => <li key={i}>{area}</li>)}
                        </ul>
                    </CardContent>
                </Card>
            </section>
        </CardContent>
      </Card>
    </div>
  );
}