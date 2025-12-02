//app/(admin)/admin/assessments/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";

// Interfaces for our data
interface Assessment {
  id: string; status: string; createdAt: string;
  candidate: { name: string; };
  technicalAssessment: { questions: { id: string, title: string }[] } | null;
}
interface Candidate { id: string; name: string; email: string; }
interface Question { id: string; title: string; difficulty: string; }

// Zod validation schema for the form
const createAssessmentSchema = z.object({
  candidateId: z.string().min(1, "Please select a candidate."),
  questionIds: z.array(z.string()).min(1, "Please select at least one question."),
});
type CreateAssessmentFormData = z.infer<typeof createAssessmentSchema>;

export default function AdminAssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Initialize React Hook Form
  const form = useForm<CreateAssessmentFormData>({
    resolver: zodResolver(createAssessmentSchema),
    defaultValues: { candidateId: "", questionIds: [] },
  });

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [assessmentsRes, candidatesRes, questionsRes] = await Promise.all([
        fetch("/api/admin/assessments"),
        fetch("/api/admin/candidates"),
        fetch("/api/admin/questions"),
      ]);
      if (!assessmentsRes.ok || !candidatesRes.ok || !questionsRes.ok) throw new Error("Failed to fetch initial data.");
      
      setAssessments(await assessmentsRes.json());
      setCandidates(await candidatesRes.json());
      setQuestions(await questionsRes.json());
    } catch (err: any) {
      toast.error("Error", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInitialData(); }, []);

  const onSubmit = async (data: CreateAssessmentFormData) => {
    try {
      const response = await fetch("/api/admin/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to create assessment.");

      toast.success("Assessment Created!", { description: `Assigned to the candidate successfully.` });
      setIsDialogOpen(false);
      form.reset();
      fetchInitialData(); // Refresh all data
    } catch (err: any) {
      toast.error("Creation Failed", { description: err.message });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div><CardTitle>Technical Assessments</CardTitle><CardDescription>Assign and monitor technical assessments for candidates.</CardDescription></div>
            <Button onClick={() => setIsDialogOpen(true)}><PlusCircle className="mr-2 h-4 w-4" />Create New Assessment</Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? ( <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Candidate</TableHead><TableHead>Status</TableHead><TableHead>Questions</TableHead><TableHead>Assigned On</TableHead></TableRow></TableHeader>
              <TableBody>
                {assessments.map((assessment) => (
                  <TableRow key={assessment.id}>
                    <TableCell className="font-medium">{assessment.candidate.name}</TableCell>
                    <TableCell><Badge>{assessment.status}</Badge></TableCell>
                    <TableCell>{assessment.technicalAssessment?.questions.length || 0}</TableCell>
                    <TableCell>{new Date(assessment.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Create New Assessment</DialogTitle><DialogDescription>Select a candidate and the questions for their technical test.</DialogDescription></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField control={form.control} name="candidateId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign to Candidate</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a candidate..." /></SelectTrigger></FormControl>
                    <SelectContent>
                      {candidates.map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.email})</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}/>
              <FormField control={form.control} name="questionIds" render={() => (
                <FormItem>
                  <FormLabel>Select Questions</FormLabel>
                  <ScrollArea className="h-64 rounded-md border p-4">
                    {questions.map((q) => (
                      <FormField key={q.id} control={form.control} name="questionIds" render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 mb-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(q.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, q.id])
                                  : field.onChange(field.value?.filter((id) => id !== q.id));
                              }}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="font-normal">{q.title}</FormLabel>
                            <Badge variant={q.difficulty === "Hard" ? "destructive" : q.difficulty === "Medium" ? "secondary" : "default"} className="ml-2">{q.difficulty}</Badge>
                          </div>
                        </FormItem>
                      )}/>
                    ))}
                  </ScrollArea>
                  <FormMessage />
                </FormItem>
              )}/>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Creating..." : "Create Assessment"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}

