"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, User, Calendar, FileText, CheckCircle, BrainCircuit, Star, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { GlassPanel } from '@/components/ui/glass-panel';
import { Separator } from '@/components/ui/separator';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// --- Types ---
type ReportData = {
  id: string;
  summary: string | null;
  technicalScore: number | null;
  strengths: string[];
  areasForImprovement: string[];
  behavioralScores: { [key: string]: number }; // Flexible JSON
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
        // Note: You need to implement GET /api/hr/report/[reportId] if not exists
        // (Assuming you will copy the pattern from previous routes)
        const res = await fetch(`/api/hr/report/${reportId}`);
        if (!res.ok) {
          throw new Error('Failed to fetch report.');
        }
        setReport(await res.json());
      } catch (err: any) {
        toast({
          title: 'Error',
          description: err.message,
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
      <div className="flex h-screen items-center justify-center bg-black">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex h-screen items-center justify-center text-center bg-black text-white">
        <div>
            <h2 className="text-xl font-bold text-red-500">Report Not Found</h2>
            <p className="text-muted-foreground mt-2">The analysis data is unavailable.</p>
            <Button variant="outline" onClick={() => router.push('/hr-dashboard')} className="mt-6 border-white/10 text-white hover:bg-white/10">
                Return to Command Center
            </Button>
        </div>
      </div>
    );
  }

  // Transform scores for chart
  const chartData = report.behavioralScores 
    ? Object.entries(report.behavioralScores).map(([name, score]) => ({ 
        name: name.replace(/_/g, ' '), // Clean up keys if needed
        score 
      })) 
    : [];

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-primary/30 p-6 md:p-10">
      
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Navigation */}
        <Button variant="ghost" onClick={() => router.push('/hr-dashboard')} className="text-muted-foreground hover:text-white hover:bg-white/5 pl-0">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>

        {/* Header Card */}
        <GlassPanel className="p-8 border-white/10 bg-white/[0.02]">
            <div className="flex flex-col md:flex-row justify-between md:items-start gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline" className="text-primary border-primary/30 bg-primary/10 uppercase tracking-widest font-bold text-[10px]">
                            Confidential Report
                        </Badge>
                        <span className="text-xs text-muted-foreground font-mono">ID: {report.id.slice(0, 8)}</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-heading font-bold text-white">Candidate Evaluation</h1>
                    <div className="flex flex-wrap gap-6 mt-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2"><User className="h-4 w-4 text-white/50" /><span className="text-white">{report.candidate.name}</span></div>
                        <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-white/50" /><span>{new Date(report.assessment.createdAt).toLocaleDateString()}</span></div>
                    </div>
                </div>
                
                {/* Overall Score Badge */}
                <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/5 border border-white/10 min-w-[120px]">
                    <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-1">Tech Score</span>
                    <span className="text-4xl font-bold font-mono text-primary">{report.technicalScore?.toFixed(0) ?? 0}%</span>
                </div>
            </div>
        </GlassPanel>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT COLUMN: Summary & Behavioral */}
            <div className="lg:col-span-2 space-y-8">
                
                {/* AI Summary */}
                <section>
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-purple-400" /> Executive Summary
                    </h3>
                    <GlassPanel className="p-6 bg-purple-500/5 border-purple-500/20 text-purple-100/90 leading-relaxed text-sm md:text-base">
                        {report.summary || "No summary generated."}
                    </GlassPanel>
                </section>

                {/* Behavioral Chart */}
                <section>
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <BrainCircuit className="h-5 w-5 text-blue-400" /> Soft Skills Analysis
                    </h3>
                    <GlassPanel className="p-6 bg-black/40 border-white/10 h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                <XAxis type="number" domain={[0, 100]} hide />
                                <YAxis type="category" dataKey="name" width={120} tick={{fill: '#a1a1aa', fontSize: 12}} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                />
                                <Bar dataKey="score" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </GlassPanel>
                </section>
            </div>

            {/* RIGHT COLUMN: Strengths/Weaknesses */}
            <div className="space-y-8">
                
                <section>
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-400" /> Key Strengths
                    </h3>
                    <GlassPanel className="p-5 bg-green-500/5 border-green-500/10">
                        <ul className="space-y-3">
                            {report.strengths?.length > 0 ? report.strengths.map((item, i) => (
                                <li key={i} className="flex gap-3 text-sm text-green-100/80">
                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                                    {item}
                                </li>
                            )) : <li className="text-sm text-muted-foreground">None identified.</li>}
                        </ul>
                    </GlassPanel>
                </section>

                <section>
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Zap className="h-5 w-5 text-yellow-400" /> Areas to Improve
                    </h3>
                    <GlassPanel className="p-5 bg-yellow-500/5 border-yellow-500/10">
                        <ul className="space-y-3">
                            {report.areasForImprovement?.length > 0 ? report.areasForImprovement.map((item, i) => (
                                <li key={i} className="flex gap-3 text-sm text-yellow-100/80">
                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-yellow-500 shrink-0" />
                                    {item}
                                </li>
                            )) : <li className="text-sm text-muted-foreground">None identified.</li>}
                        </ul>
                    </GlassPanel>
                </section>

            </div>
        </div>
      </div>
    </div>
  );
}