// in app/hr-dashboard/page.tsx

'use client';

// --- THIS IS THE CORRECTED IMPORT STATEMENT ---
import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Users, Search, FilePlus2, LoaderCircle, CheckCircle, Clock, Eye, MoreHorizontal, Trash2 } from 'lucide-react';
import { ModeToggle } from '@/components/mode-toggle';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

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
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600"><CheckCircle className="mr-1 h-3 w-3" /> Completed</Badge>;
    }
    if (status === 'PENDING') {
        return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" /> Pending</Badge>;
    }
    return <Badge variant="outline">Not Assigned</Badge>;
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
    if (!user || (user.role.toUpperCase() !== 'HR' && user.role.toUpperCase() !== 'ADMIN')) {
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
        <div className="flex min-h-screen w-full items-center justify-center">
            <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
        </div>
    );
  }
  
  return (
    <>
      <div className="flex min-h-screen bg-background">
        <aside className="hidden md:flex w-72 flex-col border-r bg-card fixed inset-y-0">
          <div className="p-5 border-b">
            <h2 className="font-extrabold text-2xl">
              <span className="text-primary">Forti</span>Twin
            </h2>
            <p className="text-xs text-muted-foreground mt-1">HR Dashboard</p>
          </div>
          <nav className="p-4 space-y-2 flex-1">
            <Button variant={'secondary'} className="w-full justify-start">
              <Users className="mr-2 h-4 w-4" />
              Candidates
            </Button>
          </nav>
        </aside>
        <main className="flex-1 md:ml-72">
          <div className="p-6 md:pt-8 md:px-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center mb-6 md:mb-8 justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Candidate Management</h1>
                    <p className="text-muted-foreground mt-1">
                        View, track, and manage all candidates in your pipeline.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <ModeToggle />
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button><FilePlus2 className="mr-2 h-4 w-4" />Create Assessment</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Create New Assessment</DialogTitle>
                                <DialogDescription>Assign a technical assessment to a candidate who has not been assessed yet.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="candidate">Candidate</Label>
                                    <Select value={selectedCandidate} onValueChange={setSelectedCandidate}>
                                        <SelectTrigger><SelectValue placeholder="Select a candidate..." /></SelectTrigger>
                                        <SelectContent>
                                            {assignableCandidates.map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.email})</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Coding Questions</Label>
                                    <div className="max-h-48 overflow-y-auto space-y-2 rounded-md border p-2">
                                        {questions.map(q => (
                                            <div key={q.id} className={`flex items-center justify-between p-2 rounded-md cursor-pointer ${selectedQuestions.includes(q.id) ? 'bg-primary/10' : ''}`}
                                                onClick={() => {
                                                    setSelectedQuestions(prev => 
                                                        prev.includes(q.id) ? prev.filter(id => id !== q.id) : [...prev, q.id]
                                                    );
                                                }}
                                            >
                                                <span>{q.title}</span>
                                                <Badge variant="secondary">{q.difficulty}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleCreateAssessment} disabled={isSubmitting || !selectedCandidate || selectedQuestions.length === 0}>
                                    {isSubmitting ? "Assigning..." : "Assign Assessment"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
            
            <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                      <div>
                          <CardTitle>All Candidates</CardTitle>
                          <CardDescription>A list of all registered candidates and their assessment status.</CardDescription>
                      </div>
                      <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                              placeholder="Search by name or email..."
                              className="pl-10 w-64"
                              value={query}
                              onChange={(e) => setQuery(e.target.value)}
                          />
                      </div>
                  </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Assessment Status</TableHead>
                                    <TableHead>Score</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isDataLoading ? (
                                    <TableRow><TableCell colSpan={5} className="text-center p-10"><LoaderCircle className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                                ) : error ? (
                                    <TableRow><TableCell colSpan={5} className="text-center p-10 text-destructive">{error}</TableCell></TableRow>
                                ) : filteredCandidates.length === 0 ? (
                                    <TableRow><TableCell colSpan={5} className="text-center p-10 text-muted-foreground">No candidates found.</TableCell></TableRow>
                                ) : (
                                    filteredCandidates.map((candidate) => {
                                        const latestAssessment = candidate.takenAssessments[0];
                                        const status = latestAssessment?.status;
                                        const score = latestAssessment?.technicalAssessment?.score;
                                        const reportId = latestAssessment?.report?.id;

                                        return (
                                            <TableRow key={candidate.id}>
                                                <TableCell className="font-medium">{candidate.name}</TableCell>
                                                <TableCell>{candidate.email}</TableCell>
                                                <TableCell><StatusBadge status={status} /></TableCell>
                                                <TableCell>{typeof score === 'number' ? (<span className="font-semibold">{score.toFixed(1)}%</span>) : (<span className="text-muted-foreground">-</span>)}</TableCell>
                                                <TableCell className="text-right">
                                                    {!latestAssessment ? (
                                                        <Button variant="outline" size="sm" onClick={() => { setSelectedCandidate(candidate.id); setIsDialogOpen(true); }}>
                                                            <FilePlus2 className="mr-2 h-4 w-4" />Assign
                                                        </Button>
                                                    ) : (
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                                <DropdownMenuSeparator />
                                                                {status === 'COMPLETED' && reportId && (
                                                                    <DropdownMenuItem asChild>
                                                                        <Link href={`/hr-dashboard/report/${reportId}`}><Eye className="mr-2 h-4 w-4" />View Report</Link>
                                                                    </DropdownMenuItem>
                                                                )}
                                                                <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteClick(latestAssessment.id)}>
                                                                    <Trash2 className="mr-2 h-4 w-4" />Delete Assessment
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the assessment and all of its data, including any reports.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}