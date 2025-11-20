"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Code, Gauge, User, BookOpen, CalendarClock, AlertTriangle, FileText, CheckCircle, Pencil, MessageSquare, ShieldCheck, ShieldX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ModeToggle } from "@/components/mode-toggle"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuthStore } from "@/stores/authStore"
import { useRouter } from "next/navigation"

// This type definition now correctly reflects our data structure
type Assessment = {
  id: string;
  status: string;
  createdAt: string;
  technicalAssessment: {
    score?: number | null;
  } | null;
  behavioralInterview: {} | null; // We just need to know if it exists
  report: { id: string; } | null;
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function StudentDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const userName = user?.name?.split(' ')[0] || "Student";

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch('/api/candidate/assessments', {
            credentials: 'include',
        });
        
        if (response.status === 401 || response.status === 403) {
          router.push('/login');
          return;
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch your assessments.');
        }

        const data: Assessment[] = await response.json();
        setAssessments(data);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) {
        fetchAssessments();
    }
  }, [user, router]);

  const upcomingAssessments = assessments.filter(a => a.status === 'PENDING');
  const completedAssessments = assessments.filter(a => a.status === 'COMPLETED');

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <Gauge className="h-6 w-6 text-primary" />
                    <span className="font-bold text-lg hidden sm:inline">
                        <span className="text-primary">Forti</span>Twin
                    </span>
                </Link>
                <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                    <Link href="/dashboard" className="text-primary font-semibold">Dashboard</Link>
                    <Link href="/report" className="text-muted-foreground hover:text-primary transition-colors">Reports</Link>
                </nav>
                <div className="flex items-center gap-4">
                    <ModeToggle />
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/dashboard/settings">
                            <User className="h-4 w-4" />
                            <span className="sr-only">Settings</span>
                        </Link>
                    </Button>
                </div>
            </div>
        </header>
        <main className="flex-1">
            <motion.div 
                className="container py-8 space-y-8"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                <motion.div variants={itemVariants}>
                    <h1 className="text-3xl font-bold">Welcome back, {userName}!</h1>
                    <p className="text-muted-foreground">Here are your assigned assessments and progress.</p>
                </motion.div>
                <div className="grid gap-8 lg:grid-cols-3">
                    <motion.div className="lg:col-span-2 space-y-8">
                        <motion.div variants={itemVariants}>
                            <Tabs defaultValue="upcoming">
                                <TabsList>
                                    <TabsTrigger value="upcoming">Upcoming ({isLoading ? '...' : upcomingAssessments.length})</TabsTrigger>
                                    <TabsTrigger value="completed">Completed ({isLoading ? '...' : completedAssessments.length})</TabsTrigger>
                                </TabsList>
                                <TabsContent value="upcoming" className="pt-4">
                                    <AssessmentList assessments={upcomingAssessments} isLoading={isLoading} error={error} type="upcoming" />
                                </TabsContent>
                                <TabsContent value="completed" className="pt-4">
                                    <AssessmentList assessments={completedAssessments} isLoading={isLoading} error={error} type="completed" />
                                </TabsContent>
                            </Tabs>
                        </motion.div>
                    </motion.div>
                    <div className="lg:col-span-1 space-y-8">
                        <motion.div variants={itemVariants}>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Your Progress</CardTitle>
                                    <CardDescription>An overview of your assessment journey.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-4 text-center">
                                        <div>
                                            <p className="text-2xl font-bold">{isLoading ? "-" : completedAssessments.length}</p>
                                            <p className="text-xs text-muted-foreground">Completed</p>
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold">{isLoading ? "-" : upcomingAssessments.length}</p>
                                            <p className="text-xs text-muted-foreground">Upcoming</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                        <motion.div variants={itemVariants}>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Quick Access</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <Button variant="ghost" className="w-full justify-start" asChild>
                                        <Link href="/report">
                                            <FileText className="mr-2 h-4 w-4" /> View My Reports
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </motion.div>
        </main>
    </div>
  )
}

function AssessmentList({ assessments, isLoading, error, type }: { assessments: Assessment[], isLoading: boolean, error: string | null, type: 'upcoming' | 'completed' }) {
    if (isLoading) {
        return <AssessmentSkeleton />;
    }
    if (error && assessments.length === 0) {
        return <ErrorState message={error} />;
    }
    if (assessments.length === 0) {
        return <EmptyState type={type} />;
    }
    return (
        <div className="space-y-4">
            {assessments.map(assessment => (
                <AssessmentCard key={assessment.id} assessment={assessment} />
            ))}
        </div>
    );
}

function AssessmentCard({ assessment }: { assessment: Assessment }) {
    const PASSING_SCORE = 70;
    const isCompleted = assessment.status === 'COMPLETED';
    const isTechnical = !!assessment.technicalAssessment;
    const isBehavioral = !!assessment.behavioralInterview;
    const score = assessment.technicalAssessment?.score;
    const hasPassed = typeof score === 'number' && score >= PASSING_SCORE;

    let title = "General Assessment";
    let icon = <FileText className="h-4 w-4" />;
    let focusText = "Awaiting details";
    let startLink = `/technical-assessment/${assessment.id}`;
    let statusIcon = <Pencil className="mr-1.5 h-4 w-4"/>;
    let statusText = "Pending";
    let statusColor = "text-blue-600";
    
    // Determine title and other details based on the current state
    if (isCompleted) {
        title = "Assessment Completed";
        icon = <CheckCircle className="h-4 w-4" />;
        focusText = "Awaiting final report";
    } else if (assessment.technicalAssessment && assessment.behavioralInterview) {
        // This is the standard two-stage assessment, and it's pending
        title = "Technical Skills Assessment";
        icon = <Code className="h-4 w-4" />;
        focusText = "Focus: Problem Solving & Algorithms";
        startLink = `/technical-assessment/${assessment.id}`;
    } else if (isBehavioral) {
        // This handles a standalone behavioral interview
        title = "Behavioral Interview";
        icon = <MessageSquare className="h-4 w-4" />;
        focusText = "Focus: Communication & Soft Skills";
        startLink = `/take-interview/${assessment.id}`;
    }


    if (isCompleted) {
        if (hasPassed) {
            statusIcon = <ShieldCheck className="mr-1.5 h-4 w-4"/>;
            statusText = "Passed";
            statusColor = "text-green-600";
        } else {
            statusIcon = <ShieldX className="mr-1.5 h-4 w-4"/>;
            statusText = "Completed";
            statusColor = "text-gray-600";
        }
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>Assigned on {new Date(assessment.createdAt).toLocaleDateString()}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {icon}
                        <span>{focusText}</span>
                    </div>
                    <span className={`font-semibold flex items-center text-sm ${statusColor}`}>
                        {statusIcon}
                        {statusText}
                    </span>
                </div>
                {isCompleted && typeof score === 'number' && (
                     <div className="mt-4">
                         <div className="flex items-center justify-between font-medium text-sm">
                             <span>Final Technical Score:</span>
                             <span className={`font-bold text-lg ${hasPassed ? 'text-primary' : 'text-destructive'}`}>
                                {score.toFixed(1)}%
                             </span>
                         </div>
                         <Progress value={score} className="h-2 mt-2" />
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex justify-end">
                {/* --- THIS IS THE CORRECTED AND FINAL LOGIC --- */}
                
                {/* 1. If the assessment is PENDING, show "Start Assessment" */}
                {assessment.status === 'PENDING' && (
                    <Button asChild><Link href={startLink}>Start Assessment <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                )}

                {/* 2. If the assessment is COMPLETED and they PASSED, show "Proceed to Interview" */}
                {assessment.status === 'COMPLETED' && hasPassed && (
                    // We now link to the dynamic interview page using the main assessment ID
                    <Button asChild><Link href={`/take-interview/${assessment.id}`}>Proceed to Interview <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                )}
                
                {/* 3. If the assessment is COMPLETED but they FAILED, show "View Report" */}
                {assessment.status === 'COMPLETED' && !hasPassed && (
                    <Button variant="secondary" asChild><Link href={`/report/${assessment.id}`}>View Report</Link></Button>
                )}
            </CardFooter>
        </Card>
    );
}

// --- Helper Components (No changes needed) ---
function EmptyState({ type }: { type: 'upcoming' | 'completed' }) {
    const content = {
        upcoming: { title: "No Upcoming Assessments", description: "You're all caught up! New assessments will appear here." },
        completed: { title: "No Completed Assessments", description: "Your past reports will be listed here after you complete an assessment." }
    };
    return (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <div className="inline-block bg-muted p-4 rounded-full mb-4">
                <CalendarClock className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold">{content[type].title}</h3>
            <p className="text-muted-foreground mt-2 max-w-xs mx-auto">{content[type].description}</p>
        </div>
    );
}

function ErrorState({ message }: { message: string }) {
    return (
        <div className="text-center py-12 border-2 border-dashed rounded-lg border-destructive/50 bg-destructive/5">
            <div className="inline-block bg-destructive/10 p-4 rounded-full mb-4">
                <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="text-xl font-semibold text-destructive">Could Not Load Assessments</h3>
            <p className="text-muted-foreground mt-2">{message}</p>
        </div>
    );
}

function AssessmentSkeleton() {
    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-5 w-2/5" />
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Skeleton className="h-10 w-32" />
                </CardFooter>
            </Card>
        </div>
    );
}