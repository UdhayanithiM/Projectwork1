'use client';

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MoreHorizontal, Video, MessageSquare, FileText, ArrowRight, CalendarPlus } from "lucide-react";
import { cn } from "@/lib/utils";

// --- Data Types and Sample Data ---
type InterviewStatus = "Scheduled" | "Completed" | "In Progress";
type InterviewType = "Video" | "Text" | "Assessment";

interface Interview {
  id: string;
  type: InterviewType;
  position: string;
  date: string;
  status: InterviewStatus;
  interviewer: string;
}

const interviews: Interview[] = [
  { id: "INT-001", type: "Video", position: "Product Manager", date: "2025-05-20", status: "Completed", interviewer: "Dr. Evelyn Reed" },
  { id: "INT-002", type: "Video", position: "Software Engineer", date: "2025-08-28", status: "Scheduled", interviewer: "Mr. Ken Alvarez" },
  { id: "INT-003", type: "Text", position: "Software Engineer", date: "2025-09-05", status: "Scheduled", interviewer: "AI Assistant" },
  { id: "INT-004", type: "Assessment", position: "Software Engineer", date: "2025-05-18", status: "Completed", interviewer: "N/A" },
];

// --- Animation Variants ---
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

// --- Helper Components ---

const InterviewIcon = ({ type }: { type: InterviewType }) => {
    const icons: Record<InterviewType, React.ReactNode> = {
        Video: <Video className="h-5 w-5" />,
        Text: <MessageSquare className="h-5 w-5" />,
        Assessment: <FileText className="h-5 w-5" />,
    };
    return <div className="p-3 bg-muted rounded-lg text-muted-foreground">{icons[type]}</div>;
};

const StatusBadge = ({ status }: { status: InterviewStatus }) => (
    <Badge
        className={cn(
            "capitalize",
            status === 'Completed' && 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
            status === 'Scheduled' && 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
            status === 'In Progress' && 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
        )}
    >
        {status}
    </Badge>
);

const EmptyState = ({ title, description }: { title: string, description: string }) => (
    <div className="text-center py-16 border-2 border-dashed rounded-lg">
        <div className="inline-block bg-muted p-4 rounded-full mb-4">
            <CalendarPlus className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="text-muted-foreground mt-2">{description}</p>
        <Button asChild variant="outline" className="mt-4">
            <Link href="/assessment-list">Browse Assessments</Link>
        </Button>
    </div>
);


// --- Main Page Component ---
export default function InterviewsPage() {
    const upcomingInterviews = interviews.filter(i => i.status !== 'Completed');
    const completedInterviews = interviews.filter(i => i.status === 'Completed');

    return (
        <motion.div 
            className="flex flex-1 flex-col gap-6 p-4 md:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <div>
                <h1 className="font-semibold text-2xl md:text-3xl">My Interviews & Assessments</h1>
                <p className="text-muted-foreground">
                    Review your scheduled and completed sessions.
                </p>
            </div>

            <Tabs defaultValue="upcoming">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                </TabsList>

                <TabsContent value="upcoming" className="mt-6">
                    {upcomingInterviews.length > 0 ? (
                        <motion.div 
                            className="grid gap-6"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            {upcomingInterviews.map((interview) => (
                                <motion.div variants={itemVariants} key={interview.id}>
                                    <Card>
                                        <CardContent className="p-6 flex items-center gap-6">
                                            <InterviewIcon type={interview.type} />
                                            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                                <div>
                                                    <p className="font-semibold">{interview.position}</p>
                                                    <p className="text-sm text-muted-foreground">{interview.type} Interview</p>
                                                </div>
                                                <div>
                                                    <p className="font-semibold">{interview.date}</p>
                                                    <p className="text-sm text-muted-foreground">with {interview.interviewer}</p>
                                                </div>
                                                <div className="flex items-center justify-start md:justify-center">
                                                    <StatusBadge status={interview.status} />
                                                </div>
                                            </div>
                                            <Button asChild className="ml-auto hidden md:inline-flex">
                                                <Link href="/take-interview">
                                                    Join Interview <ArrowRight className="ml-2 h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </CardContent>
                                         <CardFooter className="md:hidden bg-muted/50 p-4">
                                             <Button asChild className="w-full">
                                                <Link href="/take-interview">
                                                    Join Interview <ArrowRight className="ml-2 h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <EmptyState 
                            title="No Upcoming Interviews"
                            description="You have no interviews scheduled. Get started by taking an assessment."
                        />
                    )}
                </TabsContent>

                <TabsContent value="completed" className="mt-6">
                    {completedInterviews.length > 0 ? (
                         <motion.div 
                            className="grid gap-6"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            {completedInterviews.map((interview) => (
                                <motion.div variants={itemVariants} key={interview.id}>
                                    <Card>
                                        <CardContent className="p-6 flex items-center gap-6">
                                            <InterviewIcon type={interview.type} />
                                            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                                <div>
                                                    <p className="font-semibold">{interview.position}</p>
                                                    <p className="text-sm text-muted-foreground">{interview.type} Interview</p>
                                                </div>
                                                <div>
                                                    <p className="font-semibold">{interview.date}</p>
                                                    <p className="text-sm text-muted-foreground">with {interview.interviewer}</p>
                                                </div>
                                                <div className="flex items-center justify-start md:justify-center">
                                                    <StatusBadge status={interview.status} />
                                                </div>
                                            </div>
                                            <Button asChild variant="secondary" className="ml-auto hidden md:inline-flex">
                                                <Link href="/report">View Report</Link>
                                            </Button>
                                        </CardContent>
                                         <CardFooter className="md:hidden bg-muted/50 p-4">
                                             <Button asChild variant="secondary" className="w-full">
                                                <Link href="/report">View Report</Link>
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                         <EmptyState 
                            title="No Completed Interviews"
                            description="Your completed interviews and reports will appear here."
                        />
                    )}
                </TabsContent>
            </Tabs>
        </motion.div>
    );
}