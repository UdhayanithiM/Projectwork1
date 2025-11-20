'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info, Linkedin, CheckCircle, Users } from 'lucide-react';
import { MainLayout } from "@/components/layout/MainLayout";

// --- Data interfaces (no change) ---
interface AboutSection {
  title: string;
  content: string | string[];
}

interface TeamMember {
  name: string;
  role: string;
  bio: string;
  image: string;
  linkedin: string;
}

// --- Data definitions (Updated) ---
const teamMembers: TeamMember[] = [
    {
        name: "Udhayanithi M",
        role: "Full Stack Developer",
        bio: "Dedicated developer focused on building robust and user-friendly web applications.", // Placeholder
        image: "/placeholder-user.jpg", // Placeholder - Add a real image path
        linkedin: "#" // Placeholder - Add a real LinkedIn URL
    },
    {
        name: "Naveen Kumar E",
        role: "AIML Architect",
        bio: "Full-stack developer with expertise in React and Node.js. Passionate about creating scalable web applications.",
        image: "https://media.licdn.com/dms/image/v2/D4D03AQGNX8JJiNq4RA/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1697901763919?e=1752105600&v=beta&t=AjkzANCQXK6xUAyR626Ow3CaIaC3LGE_NNSQhdLnvjM",
        linkedin: "https://www.linkedin.com/in/naveen-kumar-e-979880297/"
    },
    {
        name: "Prasanth U",
        role: "Assistant Full Stack Developer",
        bio: "Eager to learn and contribute to creating efficient and modern web solutions.", // Placeholder
        image: "/placeholder-user.jpg", // Placeholder - Add a real image path
        linkedin: "#" // Placeholder - Add a real LinkedIn URL
    },
];

const aboutSections: AboutSection[] = [
    {
        title: "Our Mission",
        content: "At Fortitwin, our mission is to reshape the hiring landscape by delivering an AI-powered interviewing platform that champions fairness, transparency, and integrity. We are committed to eliminating unconscious bias and preventing dishonest practices, ensuring that every candidate is evaluated purely on merit. With Fortitwin, organizations can build stronger, more diverse teams—backed by ethical, intelligent technology."
    },
    {
        title: "Why Choose Us?",
        content: [
            "Unbiased Evaluations: Fortitwin's AI assesses candidates based on skills and responses—without influence from gender, background, or other biases.",
            "Advanced Anti-Cheating Measures: We use behavioral monitoring and intelligent response tracking to detect inconsistencies and prevent cheating.",
            "Smart Analytics: Get real-time insights into candidate performance and decision-making metrics to support fair hiring.",
            "Scalable Screening: Interview hundreds or thousands of applicants efficiently, without sacrificing accuracy.",
            "Customizable Workflows: Tailor interviews to match your role requirements, cultural values, and assessment needs.",
            "Security First: Fortitwin ensures secure handling of sensitive data with compliance to modern privacy standards."
        ]
    }
];


// --- Animation Variants ---
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.2,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
        },
    },
};


export default function AboutPage() {
  return (
    <MainLayout>
      <div className="container py-16 md:py-24 space-y-24">

        {/* --- Page Header --- */}
        <motion.section
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-block bg-primary/10 p-4 rounded-xl mb-6">
            <Info className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            About FortiTwin
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover our mission to create a fair, intelligent, and unbiased hiring process for everyone.
          </p>
        </motion.section>


        {/* --- Mission & Features Section --- */}
        <motion.section
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid md:grid-cols-2 gap-8 items-start"
        >
            {aboutSections.map((section) => (
                <motion.div variants={itemVariants} key={section.title}>
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>{section.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {typeof section.content === 'string' ? (
                                <p className="text-muted-foreground leading-relaxed">{section.content}</p>
                            ) : (
                                <ul className="space-y-4">
                                    {section.content.map((item, itemIndex) => (
                                        <li key={itemIndex} className="flex items-start">
                                            <CheckCircle className="w-5 h-5 text-primary mr-3 mt-1 flex-shrink-0" />
                                            <span className="text-muted-foreground">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            ))}
        </motion.section>

        {/* --- Team Section --- */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
            <div className="text-center mb-16">
                 <div className="inline-block bg-primary/10 p-4 rounded-xl mb-6">
                    <Users className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold">Meet Our Team</h2>
                <p className="text-lg text-muted-foreground mt-2">The minds behind the innovation.</p>
            </div>
          
            <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
                {teamMembers.map((member) => (
                    <motion.div variants={itemVariants} key={member.name}>
                        <Card className="text-center h-full flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                            <CardHeader className="p-0">
                                <div className="aspect-square relative">
                                    <Image 
                                        src={member.image} 
                                        alt={member.name}
                                        fill
                                        className="object-cover object-center"
                                    />
                                </div>
                            </CardHeader>
                            
                            <CardContent className="p-6 flex-grow">
                                <CardTitle className="text-xl mb-2">{member.name}</CardTitle>
                                <Badge variant="secondary" className="mb-4">{member.role}</Badge>
                                <p className="text-sm text-muted-foreground">{member.bio}</p>
                            </CardContent>

                            <CardFooter className="p-4 bg-muted/50">
                                <Button asChild className="w-full">
                                    <a href={member.linkedin} target="_blank" rel="noopener noreferrer">
                                        <Linkedin size={16} className="mr-2"/>
                                        LinkedIn
                                    </a>
                                </Button>
                            </CardFooter>
                        </Card>
                    </motion.div>
                ))}
            </motion.div>
        </motion.section>

        {/* --- CTA Section --- */}
         <div className="text-center">
            <Button size="lg" variant="outline" asChild>
              <Link href="/features">Explore Our Features</Link>
            </Button>
          </div>
      </div>
    </MainLayout>
  );
}