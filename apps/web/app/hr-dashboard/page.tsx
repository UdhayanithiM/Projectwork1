"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Users, Search, FilePlus2, Loader2, CheckCircle, Clock, Eye, MoreHorizontal, Trash2 } from 'lucide-react';
import { ModeToggle } from '@/components/mode-toggle';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { GlassPanel } from '@/components/ui/glass-panel';
import Link from 'next/link';

// Types match API response
type CandidateWithAssessment = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  takenAssessments: {
    id: string;
    status: string;
    technicalAssessment: {
      score: number | null;
    } | null;
    report: {
      id: string;
    } | null;
  }[];
};

type CodingQuestion = {
  id: string;
  title: string;
  difficulty: string;
};

const StatusBadge = ({ status }: { status: string | undefined }) => {
    if (status === 'COMPLETED') {
        return <Badge variant="default" className="bg-green-500/20 text-green-500 hover:bg-green-500/30 border-green-500/50"><CheckCircle className="mr-1 h-3 w-3" /> Completed</Badge>;
    }
    if (status === 'IN_PROGRESS') {
        return <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border-blue-500/50"><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Active</Badge>;
    }
    if (status === 'PENDING') {
        return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30 border-yellow-500/50"><Clock className="mr-1 h-3 w-3" /> Pending</Badge>;
    }
    return <Badge variant="outline" className="text-muted-foreground border-white/10">Not Assigned</Badge>;
};

export default function HrDashboardUpgraded() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuthStore();

  const [candidates, setCandidates] = useState<CandidateWithAssessment[]>([]);
  const [questions, setQuestions] = useState<CodingQuestion[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [assessmentToDelete, setAssessmentToDelete] = useState<string | null>(null);

  const fetchData = async () => {
    setIsDataLoading(true);
    setError(null);
    try {
      const [candsRes, questsRes] = await Promise.all([
        fetch('/api/hr/candidates'),
        fetch('/api/admin/questions')
      ]);
      if (!candsRes.ok) throw new Error("Failed to fetch candidates");
      if (!questsRes.ok) throw new Error("Failed to fetch questions");
      const candsData = await candsRes.json();
      const questsData = await questsRes.json();
      setCandidates(candsData);
      setQuestions(questsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user || (user.role !== 'HR' && user.role !== 'ADMIN')) {
        router.push('/login');
        return;
    }
    fetchData();
  }, [user, isAuthLoading, router]);

  const handleCreateAssessment = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/hr/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId: selectedCandidate, questionIds: selectedQuestions }),
      });
      if (!response.ok) {
        throw new Error((await response.json()).error || "Failed to create assessment");
      }
      toast({ title: "Success", description: "New assessment has been assigned." });
      setSelectedCandidate('');
      setSelectedQuestions([]);
      setIsDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (assessmentId: string) => {
    setAssessmentToDelete(assessmentId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!assessmentToDelete) return;
    try {
      const res = await fetch(`/api/hr/assessments/${assessmentToDelete}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error((await res.json()).error || "Failed to delete assessment");
      }
      toast({ title: "Success", description: "Assessment has been deleted." });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsDeleteDialogOpen(false);
      setAssessmentToDelete(null);
    }
  };

  const filteredCandidates = useMemo(() => 
    candidates.filter(
        (c) =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.email.toLowerCase().includes(query.toLowerCase())
    ), [candidates, query]);

  const assignableCandidates = useMemo(() => 
    candidates.filter(c => c.takenAssessments.length === 0), 
    [candidates]
  );

  if (isAuthLoading) {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-black">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    );
  }
  
  return (
    <>
      <div className="flex min-h-screen bg-black text-white font-sans selection:bg-primary/30">
        
        {/* Sidebar Navigation */}
        <aside className="hidden md:flex w-72 flex-col border-r border-white/10 bg-[#0a0a0b] fixed inset-y-0 z-50">
          <div className="p-6 border-b border-white/10">
            <h2 className="font-heading font-extrabold text-2xl tracking-tight">
              <span className="text-primary">Forti</span>Twin
            </h2>
            <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest font-bold">HR Command Center</p>
          </div>
          <nav className="p-4 space-y-2 flex-1">
            <Button variant={'secondary'} className="w-full justify-start bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20">
              <Users className="mr-2 h-4 w-4" />
              Candidates
            </Button>
          </nav>
          <div className="p-4 border-t border-white/10">
             <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">HR</div>
                <div className="text-xs text-muted-foreground">
                    <p className="font-bold text-white">{user?.name}</p>
                    <p>{user?.email}</p>
                </div>
             </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 md:ml-72 bg-black/50">
          <div className="p-6 md:pt-10 md:px-10 max-w-7xl mx-auto space-y-8">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-heading font-bold text-white">Candidate Pipeline</h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        Manage recruitment, assign technical challenges, and review AI reports.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <ModeToggle />
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="shadow-glow-primary bg-primary hover:bg-primary/90 text-white font-bold">
                                <FilePlus2 className="mr-2 h-4 w-4" /> Assign New Task
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] bg-[#0a0a0b] border-white/10 text-white">
                            <DialogHeader>
                                <DialogTitle>Create Assessment</DialogTitle>
                                <DialogDescription className="text-muted-foreground">Assign technical questions to a waiting candidate.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-6 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="candidate" className="text-xs uppercase font-bold text-muted-foreground">Select Candidate</Label>
                                    <Select value={selectedCandidate} onValueChange={setSelectedCandidate}>
                                        <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue placeholder="Choose a candidate..." /></SelectTrigger>
                                        <SelectContent className="bg-[#0a0a0b] border-white/10 text-white">
                                            {assignableCandidates.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase font-bold text-muted-foreground">Select Questions (Multi-select)</Label>
                                    <div className="max-h-60 overflow-y-auto space-y-2 rounded-md border border-white/10 bg-black/40 p-2 custom-scrollbar">
                                            {questions.map(q => (
                                                <div 
                                                    key={q.id} 
                                                    className={`flex items-center justify-between p-3 rounded-md cursor-pointer transition-colors border ${selectedQuestions.includes(q.id) ? 'bg-primary/20 border-primary/50 text-white' : 'border-transparent hover:bg-white/5 text-muted-foreground hover:text-white'}`}
                                                    onClick={() => {
                                                        setSelectedQuestions(prev => 
                                                            prev.includes(q.id) ? prev.filter(id => id !== q.id) : [...prev, q.id]
                                                        );
                                                    }}
                                                >
                                                    <span className="font-medium text-sm">{q.title}</span>
                                                    <Badge variant="outline" className="text-[10px] uppercase border-white/10">{q.difficulty}</Badge>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleCreateAssessment} disabled={isSubmitting || !selectedCandidate || selectedQuestions.length === 0} className="w-full">
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Confirm Assignment"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
            
            {/* Table Card */}
            <GlassPanel className="p-0 overflow-hidden border-white/10 bg-black/40">
                <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Filter candidates..."
                            className="pl-10 bg-black/50 border-white/10 text-white placeholder:text-muted-foreground/50 focus-visible:ring-primary/50"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                        {filteredCandidates.length} Records Found
                    </div>
                </div>

                <Table>
                    <TableHeader className="bg-transparent">
                        <TableRow className="border-white/5 hover:bg-transparent">
                            <TableHead className="text-muted-foreground">Name</TableHead>
                            <TableHead className="text-muted-foreground">Email</TableHead>
                            <TableHead className="text-muted-foreground">Status</TableHead>
                            <TableHead className="text-muted-foreground">Score</TableHead>
                            <TableHead className="text-right text-muted-foreground">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isDataLoading ? (
                            <TableRow><TableCell colSpan={5} className="h-32 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                        ) : filteredCandidates.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground">No candidates match your search.</TableCell></TableRow>
                        ) : (
                            filteredCandidates.map((candidate) => {
                                const latestAssessment = candidate.takenAssessments[0];
                                const status = latestAssessment?.status;
                                const score = latestAssessment?.technicalAssessment?.score;
                                const reportId = latestAssessment?.report?.id;

                                return (
                                    <TableRow key={candidate.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                                        <TableCell className="font-medium text-white group-hover:text-primary transition-colors">{candidate.name}</TableCell>
                                        <TableCell className="text-muted-foreground">{candidate.email}</TableCell>
                                        <TableCell><StatusBadge status={status} /></TableCell>
                                        <TableCell>
                                            {typeof score === 'number' ? (
                                                <span className={`font-mono font-bold ${score >= 70 ? 'text-green-400' : 'text-red-400'}`}>{score.toFixed(0)}%</span>
                                            ) : (
                                                <span className="text-muted-foreground/30">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {latestAssessment ? (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10 text-muted-foreground"><MoreHorizontal className="h-4 w-4" /></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="bg-[#0a0a0b] border-white/10 text-white">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuSeparator className="bg-white/10"/>
                                                        {status === 'COMPLETED' && reportId && (
                                                            <DropdownMenuItem asChild className="cursor-pointer focus:bg-white/10">
                                                                <Link href={`/hr-dashboard/report/${reportId}`}><Eye className="mr-2 h-4 w-4" />View Report</Link>
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem className="text-red-400 focus:bg-red-500/10 focus:text-red-400 cursor-pointer" onClick={() => handleDeleteClick(latestAssessment.id)}>
                                                            <Trash2 className="mr-2 h-4 w-4" />Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            ) : (
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    className="border-primary/30 text-primary hover:bg-primary/10 h-8 text-xs"
                                                    onClick={() => { setSelectedCandidate(candidate.id); setIsDialogOpen(true); }}
                                                >
                                                    Assign
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </GlassPanel>
          </div>
        </main>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#0a0a0b] border-white/10 text-white">
            <AlertDialogHeader>
                <AlertDialogTitle className="text-red-500">Delete Assessment?</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                    This action is irreversible. It will wipe all progress, scores, and reports associated with this assessment.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel className="border-white/10 hover:bg-white/5 hover:text-white">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">Permanently Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}