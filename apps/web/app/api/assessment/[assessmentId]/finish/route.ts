import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AIService } from "@/lib/ai-service";

export async function POST(
  request: Request,
  { params }: { params: { assessmentId: string } }
) {
  try {
    const { assessmentId } = params;

    // 1. FETCH DB DATA FIRST
    // We get the candidateId NOW so we don't have to query the DB again 
    // after the long AI wait, reducing the risk of connection timeouts.
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      select: { candidateId: true, status: true }
    });

    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    // 2. CALL AI SERVICE (This might take time)
    console.log(`📊 Generating scores for ${assessmentId}...`);
    let aiResult;
    try {
      aiResult = await AIService.endSession(assessmentId);
    } catch (aiError) {
      console.error("AI Scoring failed, falling back to default:", aiError);
      // Fallback if AI crashes so the user isn't stuck
      aiResult = {
        scores: {
          "Role Fit": 0,
          "Culture Fit": 0,
          "Honesty": 0,
          "Communication": 0,
          "Notes": "AI scoring service timed out. Please review transcript manually."
        }
      };
    }

    const scores = aiResult.scores || {};

    // 3. RE-CONNECT & SAVE REPORT
    // We create the report using the candidateId we fetched at the start.
    const report = await prisma.report.create({
      data: {
        assessmentId: assessmentId,
        candidateId: assessment.candidateId, // Use the ID we fetched in Step 1
        summary: scores.Notes || "Assessment completed.",
        
        // Map Scores (Default to 0 if missing)
        roleFitScore: Number(scores["Role Fit"]) || 0,
        cultureFitScore: Number(scores["Culture Fit"]) || 0,
        honestyScore: Number(scores["Honesty"]) || 0,
        technicalScore: Number(scores["Technical Skills"]) || 0,
        
        // Store complex JSON data
        strengths: scores.Strengths || [],
        areasForImprovement: scores.Weaknesses || [],
        behavioralScores: scores
      }
    });

    // 4. UPDATE STATUS
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