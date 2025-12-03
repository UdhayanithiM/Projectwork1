"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  PlusCircle, 
  Loader2, 
  Search, 
  FileText, 
  CheckCircle, 
  Clock, 
  Trash2,
  MoreHorizontal
} from "lucide-react";

import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { GlassPanel } from "@/components/ui/glass-panel";
import { toast } from "sonner";

// --- Types ---
interface Assessment {
  id: string; 
  status: string; 
  createdAt: string;
  candidate: { name: string; email: string; };
  technicalAssessment: { questions: { id: string, title: string }[] } | null;
}
interface Candidate { id: string; name: string; email: string; }
interface Question { id: string; title: string; difficulty: string; }

// --- Validation ---
const createAssessmentSchema = z.object({
  candidateId: z.string().min(1, "Please select a candidate."),
  questionIds: z.array(z.string()).min(1, "Please select at least one question."),
});
type CreateAssessmentFormData = z.infer<typeof createAssessmentSchema>;

export default function AdminAssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [filteredAssessments, setFilteredAssessments] = useState<Assessment[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<CreateAssessmentFormData>({
    resolver: zodResolver(createAssessmentSchema),
    defaultValues: { candidateId: "", questionIds: [] },
  });

  // --- Fetch Data ---
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [assessmentsRes, candidatesRes, questionsRes] = await Promise.all([
        fetch("/api/admin/assessments"),
        fetch("/api/admin/candidates"),
        fetch("/api/admin/questions"),
      ]);
      
      if (!assessmentsRes.ok || !candidatesRes.ok || !questionsRes.ok) throw new Error("Failed to fetch initial data.");
      
      const assessmentsData = await assessmentsRes.json();
      setAssessments(assessmentsData);
      setFilteredAssessments(assessmentsData);
      setCandidates(await candidatesRes.json());
      setQuestions(await questionsRes.json());
    } catch (err: any) {
      toast.error("Data Load Error", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInitialData(); }, []);

  // --- Search Logic ---
  useEffect(() => {
    if (!searchQuery) {
        setFilteredAssessments(assessments);
    } else {
        const lower = searchQuery.toLowerCase();
        setFilteredAssessments(assessments.filter(a => 
            a.candidate.name.toLowerCase().includes(lower) || 
            a.candidate.email.toLowerCase().includes(lower)
        ));
    }
  }, [searchQuery, assessments]);

  // --- Submit New Assessment ---
  const onSubmit = async (data: CreateAssessmentFormData) => {
    try {
      const response = await fetch("/api/admin/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to create assessment.");

      toast.success("Mission Assigned", { description: `Assessment dispatched to candidate.` });
      setIsDialogOpen(false);
      form.reset();
      fetchInitialData();
    } catch (err: any) {
      toast.error("Assignment Failed", { description: err.message });
    }
  };

  // --- Delete Assessment ---
  const handleDelete = async (id: string) => {
      try {
          const res = await fetch(`/api/admin/assessments?id=${id}`, { method: 'DELETE' }); 
          if(!res.ok) throw new Error("Delete failed");
          toast.success("Deleted");
          fetchInitialData();
      } catch(e) {
          toast.error("Could not delete");
      }
  }

  const getStatusBadge = (status: string) => {
      switch(status) {
          case "COMPLETED": return <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/30 border-green-500/50"><CheckCircle className="w-3 h-3 mr-1"/> Completed</Badge>;
          case "IN_PROGRESS": return <Badge className="bg-blue-500/20 text-blue-500 hover:bg-blue-500/30 border-blue-500/50"><Loader2 className="w-3 h-3 mr-1 animate-spin"/> Active</Badge>;
          case "PENDING": return <Badge className="bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30 border-yellow-500/50"><Clock className="w-3 h-3 mr-1"/> Pending</Badge>;
          default: return <Badge variant="outline">{status}</Badge>;
      }
  }

  return (
    <div className="space-y-6 p-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white">Technical Missions</h1>
          <p className="text-muted-foreground mt-1">Oversee all active and past technical assessments.</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="bg-primary hover:bg-primary/90 text-white shadow-glow-primary">
            <PlusCircle className="mr-2 h-4 w-4" /> Assign New Mission
        </Button>
      </div>

      {/* Main Panel */}
      <GlassPanel className="p-0 overflow-hidden bg-black/40 border-white/10">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search candidates..." 
                    className="pl-9 bg-black/50 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-primary/50"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <Badge variant="outline" className="border-white/10 text-muted-foreground">
                {filteredAssessments.length} Records
            </Badge>
        </div>

        {/* Table */}
        <Table>
            <TableHeader className="bg-transparent hover:bg-transparent">
                <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-muted-foreground pl-6">Candidate Identity</TableHead>
                    <TableHead className="text-muted-foreground">Mission Status</TableHead>
                    <TableHead className="text-muted-foreground">Scope</TableHead>
                    <TableHead className="text-muted-foreground">Date Assigned</TableHead>
                    <TableHead className="text-right text-muted-foreground pr-6">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                    <TableRow><TableCell colSpan={5} className="h-32 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                ) : filteredAssessments.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground">No assessments found.</TableCell></TableRow>
                ) : (
                    filteredAssessments.map((a) => (
                        <TableRow key={a.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                            <TableCell className="pl-6">
                                <div className="font-medium text-white">{a.candidate.name}</div>
                                <div className="text-xs text-muted-foreground">{a.candidate.email}</div>
                            </TableCell>
                            <TableCell>
                                {getStatusBadge(a.status)}
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2 text-sm text-white/70">
                                    <FileText className="w-4 h-4 text-primary" />
                                    {a.technicalAssessment?.questions.length || 0} Modules
                                </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                                {new Date(a.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right pr-6">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10 text-muted-foreground"><MoreHorizontal className="h-4 w-4" /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-[#0a0a0b] border-white/10 text-white">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem className="text-red-400 focus:bg-red-500/10 focus:text-red-400 cursor-pointer" onClick={() => handleDelete(a.id)}>
                                            <Trash2 className="mr-2 h-3.5 w-3.5" /> Revoke Access
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
      </GlassPanel>

      {/* Dialog: Create Assessment */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-[#0a0a0b] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Assign New Mission</DialogTitle>
            <DialogDescription className="text-muted-foreground">Deploy a technical challenge to a candidate.</DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <FormField control={form.control} name="candidateId" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs uppercase font-bold text-muted-foreground">Select Candidate</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                        <SelectTrigger className="bg-black/50 border-white/10 text-white"><SelectValue placeholder="Choose a candidate..." /></SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-[#0a0a0b] border-white/10 text-white">
                      {candidates.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}/>

              <FormField control={form.control} name="questionIds" render={() => (
                <FormItem>
                  <FormLabel className="text-xs uppercase font-bold text-muted-foreground">Select Modules (Questions)</FormLabel>
                  <ScrollArea className="h-48 rounded-md border border-white/10 bg-black/40 p-4">
                    {questions.map((q) => (
                      <FormField key={q.id} control={form.control} name="questionIds" render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 mb-3 last:mb-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(q.id)}
                              onCheckedChange={(checked) => {
                                // ✅ FIX: Use a fallback empty array to prevent spread on undefined
                                const currentValues = field.value || []; 
                                return checked
                                  ? field.onChange([...currentValues, q.id])
                                  : field.onChange(currentValues.filter((id) => id !== q.id));
                              }}
                              className="border-white/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            />
                          </FormControl>
                          <div className="flex-1 flex justify-between items-center">
                            <FormLabel className="font-normal cursor-pointer text-sm text-white/80">{q.title}</FormLabel>
                            <Badge variant="outline" className="text-[10px] border-white/10 text-muted-foreground">{q.difficulty}</Badge>
                          </div>
                        </FormItem>
                      )}/>
                    ))}
                  </ScrollArea>
                  <FormMessage />
                </FormItem>
              )}/>

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-muted-foreground hover:text-white">Cancel</Button>
                <Button type="submit" disabled={form.formState.isSubmitting} className="bg-primary hover:bg-primary/90 text-white">
                    {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Confirm Assignment"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}