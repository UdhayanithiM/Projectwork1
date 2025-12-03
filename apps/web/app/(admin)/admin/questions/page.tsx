"use client";

import React, { useState, useEffect } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  PlusCircle, 
  MoreHorizontal, 
  Trash2, 
  Edit2, 
  Code, 
  FileJson,
  Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogClose 
} from "@/components/ui/dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { GlassPanel } from "@/components/ui/glass-panel"; // Use your custom glass component
import { cn } from "@/lib/utils";

// --- Types ---
type Difficulty = "EASY" | "MEDIUM" | "HARD"; // Match Prisma Enum

interface CodingQuestion {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  testCases: any[];
  createdAt: string;
}

const initialFormState = {
  title: "",
  description: "",
  difficulty: "EASY" as Difficulty,
  testCases: [{ input: "1,2", expectedOutput: 3 }],
};

export default function QuestionBankPage() {
  const [questions, setQuestions] = useState<CodingQuestion[]>([]);
  const [formData, setFormData] = useState(initialFormState);
  const [testCasesInput, setTestCasesInput] = useState(JSON.stringify(initialFormState.testCases, null, 2));
  const [isLoading, setIsLoading] = useState(false);

  // State for dialogs
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<CodingQuestion | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [questionToEdit, setQuestionToEdit] = useState<CodingQuestion | null>(null);
  const [editTestCasesInput, setEditTestCasesInput] = useState("");

  const fetchQuestions = async () => {
    try {
      const res = await fetch("/api/admin/questions");
      if (!res.ok) throw new Error("Failed to fetch questions");
      const data = await res.json();
      setQuestions(data);
    } catch (error: any) {
      toast.error("Network Error", { description: error.message });
    }
  };

  useEffect(() => { fetchQuestions(); }, []);

  // --- ADD ---
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Validate JSON before sending
      let parsedTestCases;
      try {
        parsedTestCases = JSON.parse(testCasesInput);
      } catch (e) {
        throw new Error("Invalid JSON in Test Cases field.");
      }

      const res = await fetch("/api/admin/questions", {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, testCases: parsedTestCases }),
      });
      
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to create");
      
      toast.success("Question Added", { description: `"${formData.title}" is now in the bank.` });
      
      // Reset Form
      setFormData(initialFormState);
      setTestCasesInput(JSON.stringify(initialFormState.testCases, null, 2));
      fetchQuestions();

    } catch (error: any) {
      toast.error("Submission Failed", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };
  
  // --- EDIT ---
  const handleEditClick = (question: CodingQuestion) => {
    setQuestionToEdit(question);
    setEditTestCasesInput(JSON.stringify(question.testCases, null, 2));
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionToEdit) return;
    try {
      let parsedTestCases;
      try {
        parsedTestCases = JSON.parse(editTestCasesInput);
      } catch (e) {
        throw new Error("Invalid JSON in Test Cases field.");
      }

      const res = await fetch(`/api/admin/questions/${questionToEdit.id}`, {
        method: "PUT", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...questionToEdit, testCases: parsedTestCases }),
      });
      
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      
      toast.success("Updated", { description: "Question modified successfully." });
      setIsEditDialogOpen(false);
      fetchQuestions();
    } catch (error: any) {
      toast.error("Update Failed", { description: error.message });
    }
  };

  // --- DELETE ---
  const handleDeleteClick = (question: CodingQuestion) => {
    setQuestionToDelete(question);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!questionToDelete) return;
    try {
      const res = await fetch(`/api/admin/questions/${questionToDelete.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Deleted", { description: "Question removed from database." });
      fetchQuestions();
    } catch (err: any) {
      toast.error("Delete Failed", { description: err.message });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const difficultyColor = {
    EASY: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
    MEDIUM: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
    HARD: "bg-red-500/10 text-red-500 hover:bg-red-500/20"
  };

  return (
    <div className="space-y-6 p-6">
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white">Question Bank</h1>
          <p className="text-muted-foreground mt-1">Manage the algorithmic challenges for the assessment engine.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT: Questions List */}
        <div className="lg:col-span-2">
          <GlassPanel className="p-0 overflow-hidden bg-black/40 border-white/10">
            <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
               <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                 <Code className="w-4 h-4" /> Repository
               </span>
               <Badge variant="outline" className="border-white/10">{questions.length} Items</Badge>
            </div>
            
            <div className="p-2">
              <Table>
                <TableHeader className="bg-transparent hover:bg-transparent">
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Title</TableHead>
                    <TableHead className="text-muted-foreground">Difficulty</TableHead>
                    <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {questions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
                        No questions found. Add one to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    questions.map((q) => (
                      <TableRow key={q.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                        <TableCell className="font-medium text-white group-hover:text-primary transition-colors">
                          {q.title}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={cn("border-0 font-bold", difficultyColor[q.difficulty])}>
                            {q.difficulty}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-white/10 text-muted-foreground">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#0a0a0b] border-white/10 text-white">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleEditClick(q)} className="focus:bg-white/10 cursor-pointer">
                                <Edit2 className="mr-2 h-3.5 w-3.5" /> Edit Details
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-400 focus:bg-red-500/10 focus:text-red-400 cursor-pointer" onClick={() => handleDeleteClick(q)}>
                                <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </GlassPanel>
        </div>

        {/* RIGHT: Add New Question Form */}
        <div className="lg:col-span-1">
          <GlassPanel className="p-6 sticky top-6 bg-black/40 border-white/10">
            <div className="flex items-center gap-2 mb-6 text-white">
              <PlusCircle className="w-5 h-5 text-primary" />
              <h3 className="font-heading font-bold text-lg">New Entry</h3>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-xs uppercase text-muted-foreground font-bold">Title</Label>
                <Input 
                  id="title" 
                  value={formData.title} 
                  onChange={(e) => setFormData(p => ({...p, title: e.target.value}))} 
                  required
                  placeholder="e.g. Reverse Linked List"
                  className="bg-black/50 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-primary/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty" className="text-xs uppercase text-muted-foreground font-bold">Difficulty Level</Label>
                <Select 
                  value={formData.difficulty} 
                  onValueChange={(v: Difficulty) => setFormData(p => ({...p, difficulty: v}))}
                >
                  <SelectTrigger className="bg-black/50 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0a0a0b] border-white/10 text-white">
                    <SelectItem value="EASY">EASY</SelectItem>
                    <SelectItem value="MEDIUM">MEDIUM</SelectItem>
                    <SelectItem value="HARD">HARD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-xs uppercase text-muted-foreground font-bold">Problem Description</Label>
                <Textarea 
                  id="description" 
                  value={formData.description} 
                  onChange={(e) => setFormData(p => ({...p, description: e.target.value}))} 
                  required
                  placeholder="Explain the algorithmic problem..."
                  className="bg-black/50 border-white/10 text-white placeholder:text-white/20 min-h-[100px] focus-visible:ring-primary/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="testCases" className="text-xs uppercase text-muted-foreground font-bold flex items-center gap-2">
                  <FileJson className="w-3.5 h-3.5" /> Test Cases (JSON)
                </Label>
                <Textarea 
                  id="testCases" 
                  value={testCasesInput} 
                  onChange={(e) => setTestCasesInput(e.target.value)} 
                  required 
                  rows={5}
                  className="font-mono text-xs bg-black/80 border-white/10 text-green-400 focus-visible:ring-primary/50"
                />
              </div>

              <Button 
                type="submit" 
                disabled={isLoading} 
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold shadow-glow-primary transition-all"
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <PlusCircle className="mr-2 h-4 w-4" />}
                Add Question
              </Button>
            </form>
          </GlassPanel>
        </div>
      </div>

      {/* --- DIALOGS (Styled) --- */}
      
      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#0a0a0b] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-500">Delete Question?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This action cannot be undone. This will permanently remove <span className="text-white font-mono">"{questionToDelete?.title}"</span> from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 bg-transparent text-white hover:bg-white/5 hover:text-white">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">Confirm Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Modal */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl bg-[#0a0a0b] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Edit Question</DialogTitle>
            <DialogDescription className="text-muted-foreground">Update the question details below.</DialogDescription>
          </DialogHeader>
          
          {questionToEdit && (
            <form onSubmit={handleEditSubmit} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Title</Label>
                  <Input id="edit-title" value={questionToEdit.title} onChange={(e) => setQuestionToEdit({...questionToEdit, title: e.target.value})} className="bg-black/50 border-white/10"/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-difficulty">Difficulty</Label>
                  <Select value={questionToEdit.difficulty} onValueChange={(v: Difficulty) => setQuestionToEdit({...questionToEdit, difficulty: v})}>
                    <SelectTrigger className="bg-black/50 border-white/10"><SelectValue/></SelectTrigger>
                    <SelectContent className="bg-[#0a0a0b] border-white/10 text-white">
                      <SelectItem value="EASY">EASY</SelectItem>
                      <SelectItem value="MEDIUM">MEDIUM</SelectItem>
                      <SelectItem value="HARD">HARD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea id="edit-description" value={questionToEdit.description} onChange={(e) => setQuestionToEdit({...questionToEdit, description: e.target.value})} rows={6} className="bg-black/50 border-white/10"/>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-testCases" className="font-mono text-xs text-green-400">testCases.json</Label>
                <Textarea id="edit-testCases" value={editTestCasesInput} onChange={(e) => setEditTestCasesInput(e.target.value)} rows={6} className="font-mono text-xs bg-black/80 border-white/10 text-green-400"/>
              </div>
              
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="ghost" className="text-muted-foreground hover:text-white">Cancel</Button>
                </DialogClose>
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-white">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}