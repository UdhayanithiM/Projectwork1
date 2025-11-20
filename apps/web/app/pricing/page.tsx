'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from "@/components/ui/badge"; // <--- FIX: Added missing import

import { CheckCircle, ArrowRight, Tag, HelpCircle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";

// --- Data Types and Definitions ---
interface Tier {
    name: string;
    price: { monthly: string; annually: string };
    description: string;
    features: string[];
    featured?: boolean;
}

const tiers: Tier[] = [
  {
    name: 'Basic Interviewer',
    price: { monthly: '19', annually: '15' },
    description: 'Perfect for individuals or small teams getting started.',
    features: [ 'Up to 10 interviews/month', 'Standard question library', 'Basic reporting', 'Email support' ],
  },
  {
    name: 'Pro Recruiter',
    price: { monthly: '49', annually: '39' },
    description: 'Ideal for growing teams needing more features.',
    features: [ 'Up to 50 interviews/month', 'Custom question library', 'AI-powered feedback (basic)', 'Advanced reporting', 'Priority email support', 'ATS Integration (basic)' ],
    featured: true,
  },
  {
    name: 'Enterprise Hiring',
    price: { monthly: 'Custom', annually: 'Custom' },
    description: 'For large organizations requiring tailored solutions.',
    features: [ 'Unlimited interviews', 'Advanced AI feedback & bias detection', 'Custom branding', 'Dedicated account manager', 'Premium support (24/7)', 'Full API access & integrations' ],
  },
];

const faqs = [
  { question: "Can I try the platform before committing?", answer: "Absolutely! We offer a free trial period for you to explore the features of our Pro Recruiter plan. No credit card is required to start." },
  { question: "How are interviews counted towards the monthly limit?", answer: "Each completed interview session with a candidate counts towards your monthly limit. You can monitor your usage in the dashboard." },
  { question: "What if I need more interviews than my plan allows?", answer: "You can easily upgrade your plan at any time. For very high volume needs, our Enterprise plan offers unlimited interviews and custom solutions." },
  { question: "What kind of support is included?", answer: "All plans include email support. The Pro Recruiter plan comes with priority support, and the Enterprise plan includes a dedicated account manager and premium 24/7 support." }
];

// --- Animation Variants ---
const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};
const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);

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
                <Tag className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
                Find the Perfect Plan
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Choose the plan that best fits your hiring needs and scale with confidence as you grow.
            </p>
        </motion.section>

        {/* --- Pricing Section --- */}
        <section>
            <div className="flex justify-center items-center gap-4 mb-12">
                <Label htmlFor="billing-cycle">Monthly</Label>
                <Switch id="billing-cycle" checked={isAnnual} onCheckedChange={setIsAnnual} />
                <Label htmlFor="billing-cycle">Annually</Label>
                <Badge variant="secondary" className="animate-pulse">Save 20%</Badge>
            </div>
            
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start"
            >
                {tiers.map((tier) => (
                    <motion.div variants={itemVariants} key={tier.name}>
                        <Card className={cn(
                            "flex flex-col h-full",
                            tier.featured && "border-primary border-2 relative shadow-2xl shadow-primary/10"
                        )}>
                            {tier.featured && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                    <Badge>Most Popular</Badge>
                                </div>
                            )}
                            <CardHeader className="text-center">
                                <CardTitle className="text-2xl">{tier.name}</CardTitle>
                                <div className="text-4xl font-bold my-4">
                                    {tier.price.monthly === 'Custom' ? 'Custom' : `$${isAnnual ? tier.price.annually : tier.price.monthly}`}
                                    {tier.price.monthly !== 'Custom' && <span className="text-sm font-normal text-muted-foreground">/month</span>}
                                </div>
                                <CardDescription>{tier.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <ul className="space-y-3">
                                    {tier.features.map((feature) => (
                                        <li key={feature} className="flex items-start">
                                            <CheckCircle className="w-5 h-5 text-primary mr-3 mt-1 shrink-0" />
                                            <span className="text-muted-foreground">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button size="lg" className="w-full" variant={tier.featured ? 'default' : 'outline'} asChild>
                                    <Link href={tier.price.monthly === 'Custom' ? '#contact' : '/signup'}>
                                        {tier.price.monthly === 'Custom' ? 'Contact Sales' : 'Get Started'}
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    </motion.div>
                ))}
            </motion.div>
        </section>

        {/* --- FAQ Section --- */}
        <motion.section 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto"
        >
             <div className="text-center mb-12">
                <div className="inline-block bg-primary/10 p-4 rounded-xl mb-6">
                    <HelpCircle className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold">Frequently Asked Questions</h2>
            </div>
            <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                        <AccordionTrigger className="text-left font-semibold text-lg">{faq.question}</AccordionTrigger>
                        <AccordionContent className="text-base text-muted-foreground">{faq.answer}</AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </motion.section>

        {/* --- CTA Section --- */}
        <motion.section
            id="contact"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.5 }}
        >
            <Card className="bg-gradient-to-r from-primary to-purple-600 text-primary-foreground text-center p-8 md:p-12">
                <h2 className="text-3xl font-bold mb-4">Ready to Revolutionize Your Hiring?</h2>
                <p className="text-lg text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
                    Start your free trial today or get in touch to discuss a custom solution for your enterprise.
                </p>
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                    <Button size="lg" variant="secondary" asChild>
                        <Link href="/signup">Start Free Trial <ArrowRight className="ml-2 h-4 w-4" /></Link>
                    </Button>
                    <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground/50 hover:bg-primary-foreground/10 text-primary-foreground" asChild>
                        <Link href="#">Contact Sales</Link>
                    </Button>
                </div>
            </Card>
        </motion.section>
      </div>
    </MainLayout>
  );
}