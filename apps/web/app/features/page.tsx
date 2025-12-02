'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Settings, BarChart2, Users, Smile, Database, ArrowRight, Star } from 'lucide-react';
import type React from 'react';
import { MainLayout } from "@/components/layout/MainLayout";

// --- Data Types and Definitions ---
interface Feature {
  icon: React.ElementType;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: MessageSquare,
    title: 'Seamless Interview Experience',
    description: 'Conduct smooth, structured interviews with our intuitive platform. Guide conversations, take notes, and score candidates consistently.',
  },
  {
    icon: Settings,
    title: 'Customizable Question Libraries',
    description: 'Build and manage your own question sets tailored to specific roles and competencies. Ensure fairness and relevance in every interview.',
  },
  {
    icon: BarChart2,
    title: 'Insightful Analytics & Reporting',
    description: 'Track key hiring metrics, compare candidates objectively, and identify bottlenecks in your process with comprehensive dashboards.',
  },
  {
    icon: Users,
    title: 'Collaborative Hiring Tools',
    description: 'Invite team members, share feedback asynchronously, and make collective hiring decisions faster and more efficiently.',
  },
  {
    icon: Smile,
    title: 'Enhanced Candidate Experience',
    description: 'Provide a professional and engaging interview experience for candidates, reflecting positively on your employer brand.',
  },
  {
    icon: Database,
    title: 'Simple ATS Integration',
    description: 'Connect seamlessly with your existing Applicant Tracking System to streamline workflows and keep all candidate data synchronized.',
  },
];


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


export default function FeaturesPage() {
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
                    <Star className="w-10 h-10 text-primary" />
                </div>
                <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
                    Powerful Features, Seamless Experience
                </h1>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                    Explore the core functionalities that make our interview platform the perfect choice for modern hiring teams.
                </p>
            </motion.section>

            {/* --- Features Grid --- */}
            <motion.section
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
                {features.map((feature) => (
                    <motion.div variants={itemVariants} key={feature.title}>
                        <Card className="h-full text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-2">
                            <CardHeader>
                                <div className="mx-auto h-14 w-14 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                                    <feature.icon className="h-8 w-8 text-primary" />
                                </div>
                                <CardTitle>{feature.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">{feature.description}</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </motion.section>

            {/* --- Call to Action Section --- */}
            <motion.section
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.8 }}
            >
                <Card className="bg-gradient-to-r from-primary to-purple-600 text-primary-foreground text-center p-8 md:p-12">
                    <h2 className="text-3xl font-bold mb-4">
                        Ready to Streamline Your Interviews?
                    </h2>
                    <p className="text-lg text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
                        Experience the difference with a structured and collaborative hiring process.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                        <Button size="lg" variant="secondary" asChild>
                            <Link href="/signup">
                                Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                        <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground/50 hover:bg-primary-foreground/10 text-primary-foreground" asChild>
                            <Link href="/pricing">View Pricing</Link>
                        </Button>
                    </div>
                </Card>
            </motion.section>
        </div>
    </MainLayout>
  );
}

