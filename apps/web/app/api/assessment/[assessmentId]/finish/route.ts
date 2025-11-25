import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AIService } from "@/lib/ai-service";

export async function POST(
  request: Request,
  { params }: { params: { assessmentId: string } }
) {
  try {
    const { assessmentId } = params;

    // 1. Call Python to calculate scores based on the transcript
    console.log(`📊 Generating scores for ${assessmentId}...`);
    const aiResult = await AIService.endSession(assessmentId);
    const scores = aiResult.scores; // Expecting: { "Role Fit": 8, "Culture Fit": 7, ... }

    // 2. Create the Report in MongoDB
    // We map the flexible JSON from Python to your Prisma schema
    const report = await prisma.report.create({
      data: {
        assessmentId: assessmentId,
        // Assuming you have candidateId available or fetch it from assessment first
        // For safety, let's connect it via the assessment relation if possible, 
        // but Prisma requires the direct ID for the 'candidate' relation.
        // Let's fetch the assessment first to get the candidateId.
        candidate: { 
            connect: { 
                id: (await prisma.assessment.findUniqueOrThrow({ where: { id: assessmentId } })).candidateId 
            } 
        },
        assessment: { connect: { id: assessmentId } },
        
        summary: scores.Notes || "Interview completed successfully.",
        
        // Map the specific scores
        roleFitScore: scores["Role Fit"] || 0,
        cultureFitScore: scores["Culture Fit"] || 0,
        honestyScore: scores["Honesty"] || 0,
        technicalScore: scores["Technical Skills"] || 0, // If provided by AI
        
        // Store the complex data structures
        strengths: scores.Strengths || [], 
        areasForImprovement: scores.Weaknesses || [],
        behavioralScores: scores // Store the raw JSON for future proofing
      }
    });

    // 3. Mark Assessment as COMPLETED
    await prisma.assessment.update({
      where: { id: assessmentId },
      data: { status: "COMPLETED" }
    });

    return NextResponse.json({ success: true, reportId: report.id });

  } catch (error: any) {
    console.error("Finish Interview Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate report" },
      { status: 500 }
    );
  }
}