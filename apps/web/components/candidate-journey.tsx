"use client"

import { UserCircle, Calendar, MessageSquare, Video, FileText, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"

interface CandidateJourneyProps {
  activeStep: number
  setActiveStep: (step: number) => void
}

const steps = [
    { id: 1, name: "Candidate Setup", icon: UserCircle, description: "Complete your profile" },
    { id: 2, name: "Scheduling", icon: Calendar, description: "Choose your time slot" },
    { id: 3, name: "Text Interview", icon: MessageSquare, description: "Written responses" },
    { id: 4, name: "Video Component", icon: Video, description: "Face-to-face interaction" },
    { id: 5, name: "Skills Assessment", icon: FileText, description: "Technical evaluation" },
    { id: 6, name: "Results & Feedback", icon: CheckCircle, description: "Review your performance" },
]

export function CandidateJourney({ activeStep, setActiveStep }: CandidateJourneyProps) {
  return (
    <Card>
        <CardHeader>
            <CardTitle>Your Journey</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="relative space-y-8">
                {/* Timeline Connector Line */}
                <div className="absolute left-4 top-4 h-[calc(100%-2rem)] w-0.5 bg-border" />

                {steps.map((step) => {
                    const isActive = step.id === activeStep
                    const isCompleted = step.id < activeStep

                    return (
                        <button
                            key={step.id}
                            className="w-full flex items-start text-left relative"
                            onClick={() => setActiveStep(step.id)}
                            disabled={!isCompleted && !isActive}
                        >
                            {/* Step Icon and Circle */}
                            <div className="z-10 flex h-8 w-8 items-center justify-center rounded-full shrink-0"
                                 style={{
                                     backgroundColor: isCompleted || isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
                                     color: isCompleted || isActive ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))'
                                 }}>
                                {isCompleted ? <CheckCircle className="h-5 w-5" /> : <step.icon className="h-5 w-5" />}
                            </div>

                            {/* Step Details */}
                            <div className="ml-4">
                                <h3 className={cn(
                                    "font-semibold",
                                    isActive ? "text-primary" : "text-foreground"
                                )}>
                                    {step.name}
                                </h3>
                                <p className="text-sm text-muted-foreground">{step.description}</p>
                            </div>
                        </button>
                    )
                })}
            </div>
        </CardContent>
    </Card>
  )
}

