'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, UserPlus, MessageCircle, CalendarCheck2, BarChartHorizontal, Settings, ArrowRight, Route } from 'lucide-react';
import { MainLayout } from "@/components/layout/MainLayout";
import type React from 'react';

// --- Data Types and Definitions ---
interface Step {
  icon: React.ElementType;
  title: string;
  description: string;
  details?: string[];
}

const steps: Step[] = [
    {
        icon: UserPlus,
        title: "Set Up Your Account & Team",
        description: "Getting started is simple. Sign up, invite your team members, and configure your company settings. Assign roles and permissions to ensure everyone has the access they need."
    },
    {
        icon: FileText,
        title: "Create Interview Templates",
        description: "Define a structured interview process by creating templates. Add specific questions, scoring rubrics, and competencies for different roles.",
        details: [
            "Define stages (e.g., Screening, Technical, Cultural Fit).",
            "Assign questions and skills to each stage.",
            "Set up scoring criteria for consistent evaluation."
        ]
    },
    {
        icon: CalendarCheck2,
        title: "Schedule & Invite Candidates",
        description: "Link job postings or manually add candidates. Send out invitations with clear instructions and scheduling options that work for them and your team."
    },
    {
        icon: MessageCircle,
        title: "Conduct Structured Interviews",
        description: "Use the platform to follow your template, access candidate information, guide the conversation with predefined questions, take notes, and score responses in real-time."
    },
    {
        icon: BarChartHorizontal,
        title: "Review & Analyze Results",
        description: "Collaboratively review scores and feedback. Compare candidates side-by-side based on objective data and generate reports to track hiring progress."
    },
    {
        icon: Settings,
        title: "Integrate (Optional)",
        description: "Connect our platform to your existing ATS or HRIS to automatically sync candidate data, interview status, and feedback for a seamless workflow."
    }
];

// --- Animation Variants ---
const itemVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
};
const itemVariantsRight = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
};


export default function HowItWorksPage() {
  return (
    <MainLayout>
       <div className="container py-16 md:py-24 space-y-24">
            {/* --- Hero Section --- */}
            <motion.section
                className="text-center"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <div className="inline-block bg-primary/10 p-4 rounded-xl mb-6">
                    <Route className="w-10 h-10 text-primary" />
                </div>
                <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
                    How FortiTwin Works
                </h1>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                    A simple, step-by-step guide to leveraging our powerful interview platform for a seamless hiring process.
                </p>
            </motion.section>

            {/* --- Timeline Section --- */}
            <section className="relative">
                {/* The timeline line */}
                <div className="absolute left-1/2 top-0 h-full w-0.5 bg-border -translate-x-1/2" aria-hidden="true"></div>

                <div className="space-y-12">
                    {steps.map((step, index) => (
                        <motion.div
                            key={step.title}
                            className="relative flex items-center"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, amount: 0.3 }}
                            variants={index % 2 === 0 ? itemVariants : itemVariantsRight}
                        >
                            {/* Card positioning based on even/odd index */}
                            <div className={`w-1/2 ${index % 2 === 0 ? 'pr-8' : 'pl-8 ml-auto'}`}>
                                <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                                    <CardHeader>
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-primary/10 rounded-lg text-primary">
                                                <step.icon className="w-6 h-6"/>
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-primary">Step {index + 1}</p>
                                                <CardTitle>{step.title}</CardTitle>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-muted-foreground">{step.description}</p>
                                        {step.details && (
                                            <ul className="mt-4 list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                                {step.details.map(detail => <li key={detail}>{detail}</li>)}
                                            </ul>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                            
                            {/* The dot on the timeline */}
                            <div className="absolute left-1/2 top-1/2 h-4 w-4 rounded-full bg-primary border-4 border-background -translate-x-1/2 -translate-y-1/2" aria-hidden="true"></div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* --- Call to Action Section --- */}
            <motion.section
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.8 }}
            >
                <div className="text-center">
                    <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
                    <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                       Transform your hiring process today. Sign up and experience the future of interviewing.
                    </p>
                    <Button size="lg" asChild>
                        <Link href="/signup">
                            Get Started Now <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </motion.section>
       </div>
    </MainLayout>
  );
}

