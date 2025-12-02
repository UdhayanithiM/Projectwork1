// app/(admin)/admin/questions/page.tsx

"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

// We need a more detailed interface for the edit form
interface CodingQuestion {
  id: string;
  title: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  testCases: any[];
  createdAt: string;
}

const initialFormState = {
  title: "",
  description: "",
  difficulty: "Easy" as "Easy" | "Medium" | "Hard",
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
      setQuestions(await res.json());
    } catch (error: any) {
      toast.error("Error", { description: error.message });
    }
  };

  useEffect(() => { fetchQuestions(); }, []);

  // --- ADD ---
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const parsedTestCases = JSON.parse(testCasesInput);
      const res = await fetch("/api/admin/questions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, testCases: parsedTestCases }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      toast.success("Success!", { description: `Question "${formData.title}" created.` });
      setFormData(initialFormState);
      setTestCasesInput(JSON.stringify(initialFormState.testCases, null, 2));
      fetchQuestions();
    } catch (error: any) {
      toast.error("Error", { description: error.message });
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
      const parsedTestCases = JSON.parse(editTestCasesInput);
      const res = await fetch(`/api/admin/questions/${questionToEdit.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...questionToEdit, testCases: parsedTestCases }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      toast.success("Success!", { description: "Question updated successfully." });
      setIsEditDialogOpen(false);
      fetchQuestions();
    } catch (error: any) {
      toast.error("Error", { description: error.message });
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
      toast.success("Question deleted successfully!");
      fetchQuestions();
    } catch (err: any) {
      toast.error("Error", { description: err.message });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Questions List */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader><CardTitle>Question Bank</CardTitle><CardDescription>A list of all coding questions in the system.</CardDescription></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Difficulty</TableHead><TableHead>Created</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {questions.map((q) => (
                    <TableRow key={q.id}>
                      <TableCell className="font-medium">{q.title}</TableCell>
                      <TableCell><Badge variant={q.difficulty === "Hard" ? "destructive" : q.difficulty === "Medium" ? "secondary" : "default"}>{q.difficulty}</Badge></TableCell>
                      <TableCell>{new Date(q.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEditClick(q)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-500" onClick={() => handleDeleteClick(q)}>Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        {/* Add New Question Form */}
        <div>
          <Card>
            <CardHeader><CardTitle>Add New Question</CardTitle><CardDescription>Add a new coding problem to the bank.</CardDescription></CardHeader>
            <CardContent>
              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div className="space-y-2"><Label htmlFor="title">Title</Label><Input id="title" value={formData.title} onChange={(e) => setFormData(p => ({...p, title: e.target.value}))} required/></div>
                <div className="space-y-2"><Label htmlFor="difficulty">Difficulty</Label>
                  <Select value={formData.difficulty} onValueChange={(v: any) => setFormData(p => ({...p, difficulty: v}))}><SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent><SelectItem value="Easy">Easy</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="Hard">Hard</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label htmlFor="description">Description</Label><Textarea id="description" value={formData.description} onChange={(e) => setFormData(p => ({...p, description: e.target.value}))} required/></div>
                <div className="space-y-2"><Label htmlFor="testCases">Test Cases (JSON)</Label><Textarea id="testCases" value={testCasesInput} onChange={(e) => setTestCasesInput(e.target.value)} required rows={5}/></div>
                <Button type="submit" disabled={isLoading} className="w-full"><PlusCircle className="mr-2 h-4 w-4" />{isLoading ? "Adding..." : "Add Question"}</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* DIALOGS */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{questionToDelete?.title}".</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDelete}>Continue</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>Edit Question</DialogTitle><DialogDescription>Make changes to the question below.</DialogDescription></DialogHeader>
          {questionToEdit && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2"><Label htmlFor="edit-title">Title</Label><Input id="edit-title" value={questionToEdit.title} onChange={(e) => setQuestionToEdit({...questionToEdit, title: e.target.value})} /></div>
              <div className="space-y-2"><Label htmlFor="edit-difficulty">Difficulty</Label>
                <Select value={questionToEdit.difficulty} onValueChange={(v: any) => setQuestionToEdit({...questionToEdit, difficulty: v})}><SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent><SelectItem value="Easy">Easy</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="Hard">Hard</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label htmlFor="edit-description">Description</Label><Textarea id="edit-description" value={questionToEdit.description} onChange={(e) => setQuestionToEdit({...questionToEdit, description: e.target.value})} rows={8} /></div>
              <div className="space-y-2"><Label htmlFor="edit-testCases">Test Cases (JSON)</Label><Textarea id="edit-testCases" value={editTestCasesInput} onChange={(e) => setEditTestCasesInput(e.target.value)} rows={8} /></div>
              <DialogFooter><DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose><Button type="submit">Save Changes</Button></DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

