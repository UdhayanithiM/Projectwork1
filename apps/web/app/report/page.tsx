// app/report/page.tsx

"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { motion } from "framer-motion"
import { Download, Share, ArrowLeft, TrendingUp, Target, Star, Trophy } from "lucide-react"
import { ReportChart } from "@/components/report-chart"
import { useRef, useState } from "react"
import { toast } from "sonner" // <-- FIX: Using sonner for toasts
import html2canvas from 'html2canvas'; // <-- FIX: Corrected import
import jsPDF from 'jspdf';

// RadialProgress component remains the same
const RadialProgress = ({ value }: { value: number }) => {
    const circumference = 2 * Math.PI * 45;
    const offset = circumference - (value / 100) * circumference;
    return (
        <div className="relative h-40 w-40">
            <svg className="transform -rotate-90" width="100%" height="100%" viewBox="0 0 100 100">
                <circle className="text-muted" strokeWidth="10" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
                <motion.circle
                    className="text-primary"
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="45"
                    cx="50"
                    cy="50"
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold">{value}</span>
                <span className="text-sm text-muted-foreground">%</span>
            </div>
        </div>
    );
};


export default function ReportPage() {
  const reportRef = useRef<HTMLDivElement>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const generatePDF = async () => {
    if (!reportRef.current) return
    
    setIsGenerating(true)
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: window.getComputedStyle(document.body).getPropertyValue('background') || '#ffffff',
      })
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save('FortiTwin_Report.pdf')
      
      toast.success("Success!", {
        description: "Your report has been downloaded.",
      })
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast.error("Error", {
        description: "Failed to generate PDF. Please try again.",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
        <div className="container mx-auto max-w-5xl py-12 md:py-16">
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
            >
                <div>
                    <Button variant="ghost" size="sm" asChild className="-ml-4 mb-2">
                        <Link href="/dashboard">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Link>
                    </Button>
                    <h1 className="text-3xl md:text-4xl font-bold">Interview Report</h1>
                    <p className="text-muted-foreground">Analysis from your session on August 26, 2025</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={generatePDF} disabled={isGenerating}>
                        <Download className="mr-2 h-4 w-4" />
                        {isGenerating ? 'Generating...' : 'Download'}
                    </Button>
                    <Button variant="outline">
                        <Share className="mr-2 h-4 w-4" /> Share
                    </Button>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                ref={reportRef}
                className="bg-background p-8 rounded-xl shadow-sm"
            >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* --- Strengths and Growth Areas --- */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><TrendingUp className="text-primary"/> Key Strengths</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <p><strong>Problem Solving:</strong> Demonstrated strong analytical thinking.</p>
                                    <p><strong>Adaptability:</strong> Showed flexibility when facing challenges.</p>
                                    <p><strong>Communication:</strong> Clear and concise expression of complex ideas.</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><Target className="text-destructive"/> Growth Areas</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <p><strong>Emotional Regulation:</strong> Consider techniques for managing stress.</p>
                                    <p><strong>Delegation:</strong> Opportunity to trust team members more.</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* --- Personality Profile --- */}
                        <Card>
                             <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Star className="text-primary"/> Personality Profile</CardTitle>
                                <CardDescription>Based on communication style and responses.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-80 w-full"><ReportChart /></div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-8">
                        <Card className="text-center">
                            <CardHeader>
                                <CardTitle className="flex items-center justify-center gap-2"><Trophy className="text-primary"/> Overall Score</CardTitle>
                                <CardDescription>Based on all assessment criteria.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex justify-center">
                                <RadialProgress value={87} />
                            </CardContent>
                        </Card>
                          <Card>
                            <CardHeader><CardTitle>Final Assessment</CardTitle></CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    You demonstrated strong communication skills and problem-solving abilities. Your responses showed depth of thought and self-awareness. With some focus on the identified growth areas, you have excellent potential for leadership roles that require both empathy and analytical thinking.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </motion.div>
        </div>
    </div>
  )
}

