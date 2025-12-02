'use client';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Activity, ListChecks, Clock, CalendarClock, Target, BarChart, CheckCircle, Award } from "lucide-react";
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from "@/lib/utils";

// --- Data Types and Fetch Simulation ---
interface AnalyticsData {
  currentStage: string;
  assessmentsCompleted: number;
  totalAssessments: number;
  avgTimeToCompleteAssessment: string;
  upcomingInterview: string;
  progressPercent: number;
  assessmentResults: { name: string; score: number; avg: number }[];
}

// Simulate fetching data
const fetchAnalyticsData = (): Promise<AnalyticsData> => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({
                currentStage: "Technical Assessment",
                assessmentsCompleted: 1,
                totalAssessments: 2,
                avgTimeToCompleteAssessment: "35 min",
                upcomingInterview: "May 28, 2025 - AI Interview",
                progressPercent: 50,
                assessmentResults: [
                    { name: 'Problem Solving', score: 85, avg: 75 },
                    { name: 'System Design', score: 0, avg: 70 }, // Not yet taken
                    { name: 'Behavioral', score: 92, avg: 80 },
                ]
            });
        }, 500);
    });
};

// --- Animation Variants ---
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};


// --- Sub-components for Cleaner Structure ---

const StatCard = ({ icon, title, value, footer }: { icon: React.ReactNode, title: string, value: string, footer: string }) => (
    <motion.div variants={itemVariants}>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground">{footer}</p>
            </CardContent>
        </Card>
    </motion.div>
);

const ProgressTimeline = ({ progressPercent }: { progressPercent: number }) => {
    const stages = [
        { name: 'Applied', percent: 0 },
        { name: 'Assessment', percent: 50 },
        { name: 'Interview', percent: 75 },
        { name: 'Offer', percent: 100 },
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Application Progress</CardTitle>
                <CardDescription>Your journey through our hiring stages.</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
                <Progress value={progressPercent} className="mb-4 h-2" />
                <div className="flex justify-between">
                    {stages.map((stage, index) => (
                        <div key={stage.name} className="flex flex-col items-center relative">
                            <div className={cn(
                                "h-4 w-4 rounded-full flex items-center justify-center",
                                progressPercent >= stage.percent ? 'bg-primary' : 'bg-muted border'
                            )}>
                                {progressPercent >= stage.percent && <CheckCircle className="h-3 w-3 text-primary-foreground" />}
                            </div>
                            <p className={cn(
                                "text-xs mt-2",
                                progressPercent >= stage.percent ? 'font-semibold text-foreground' : 'text-muted-foreground'
                            )}>{stage.name}</p>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
};


const ResultsChart = ({ data }: { data: AnalyticsData['assessmentResults'] }) => (
    <Card>
        <CardHeader>
            <CardTitle>Assessment Results</CardTitle>
            <CardDescription>Summary of your performance.</CardDescription>
        </CardHeader>
        <CardContent>
            <ResponsiveContainer width="100%" height={250}>
                <RechartsBarChart data={data.filter(d => d.score > 0)} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis type="category" dataKey="name" width={100} tickLine={false} axisLine={false} />
                    <Tooltip
                        cursor={{ fill: 'hsl(var(--muted))' }}
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                return (
                                    <div className="bg-background border p-2 rounded-lg shadow-sm">
                                        <p className="font-bold">{`${payload[0].payload.name}`}</p>
                                        <p className="text-primary">{`Your Score: ${payload[0].value}%`}</p>
                                        <p className="text-muted-foreground">{`Average Score: ${payload[1].value}%`}</p>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Bar dataKey="score" name="Your Score" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={16} />
                    <Bar dataKey="avg" name="Average Score" fill="hsl(var(--muted-foreground))" radius={[0, 4, 4, 0]} barSize={16} />
                </RechartsBarChart>
            </ResponsiveContainer>
        </CardContent>
    </Card>
);


// --- Main Page Component ---
export default function AnalyticsPage() {
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

    useEffect(() => {
        fetchAnalyticsData().then(data => setAnalyticsData(data));
    }, []);

    if (!analyticsData) {
        // Optional: Add a skeleton loader here
        return <div className="flex-1 p-8">Loading analytics...</div>;
    }

    return (
        <motion.div 
            className="flex flex-1 flex-col gap-6 p-4 md:p-8"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <motion.div variants={itemVariants}>
                <h1 className="font-semibold text-2xl md:text-3xl">My Application Analytics</h1>
                <p className="text-muted-foreground">
                    Insights into your application progress and activities.
                </p>
            </motion.div>

            {/* --- Stats Grid --- */}
            <motion.div 
                className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
                variants={containerVariants}
            >
                <StatCard 
                    icon={<Activity className="h-4 w-4 text-muted-foreground" />}
                    title="Current Stage"
                    value={analyticsData.currentStage}
                    footer="Your current step in the process"
                />
                 <StatCard 
                    icon={<ListChecks className="h-4 w-4 text-muted-foreground" />}
                    title="Assessments"
                    value={`${analyticsData.assessmentsCompleted} / ${analyticsData.totalAssessments} Completed`}
                    footer="Required skills assessments"
                />
                 <StatCard 
                    icon={<Clock className="h-4 w-4 text-muted-foreground" />}
                    title="Avg. Assessment Time"
                    value={analyticsData.avgTimeToCompleteAssessment}
                    footer="Your average time per assessment"
                />
                 <StatCard 
                    icon={<CalendarClock className="h-4 w-4 text-muted-foreground" />}
                    title="Next Step"
                    value={analyticsData.upcomingInterview}
                    footer="Your next scheduled event"
                />
            </motion.div>

            {/* --- Charts Grid --- */}
            <motion.div 
                className="grid gap-6 mt-4 md:grid-cols-2"
                variants={containerVariants}
            >
                <motion.div variants={itemVariants}>
                    <ProgressTimeline progressPercent={analyticsData.progressPercent} />
                </motion.div>
                <motion.div variants={itemVariants}>
                   <ResultsChart data={analyticsData.assessmentResults} />
                </motion.div>
            </motion.div>
        </motion.div>
    );
}

