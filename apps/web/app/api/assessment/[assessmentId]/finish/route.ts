import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AIService } from "@/lib/ai-service";
import { AssessmentStatus } from "@prisma/client"; 

export async function POST(
  request: Request,
  { params }: { params: { assessmentId: string } }
) {
  try {
    const { assessmentId } = params;

    console.log(`📊 [API] Finishing Assessment: ${assessmentId}`);

    // 1. Call Python Scoring Engine
    let aiResult;
    try {
        aiResult = await AIService.endSession(assessmentId);
    } catch (err) {
        console.error("⚠️ AI Scoring Failed, falling back to defaults:", err);
        aiResult = { scores: { Notes: "AI Scoring Service Unavailable" } };
    }
    
    // Default to empty object if undefined
    const scores = aiResult.scores || {};

    // 2. Fetch assessment to get candidateId
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      select: { candidateId: true }
    });

    if (!assessment) {
        return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    // 3. Create Interview Report
    const report = await prisma.report.create({
      data: {
        candidate: { connect: { id: assessment.candidateId } },
        assessment: { connect: { id: assessmentId } },

        // Summary Analysis
        summary: scores.Notes || "Interview completed successfully.",

        // Quantitative Scores
        technicalScore: scores["Technical Skills"] ?? 0,
        
        // ✅ CORRECT: Store all specific scores (Role Fit, Honesty, etc.) 
        // inside this JSON field.
        behavioralScores: scores, 

        // Qualitative Analysis (Arrays)
        strengths: scores.Strengths ?? [],
        areasForImprovement: scores.Weaknesses ?? [],
        
        // ❌ REMOVED: These fields do not exist in your schema.
        // roleFitScore: scores["Role Fit"] ?? 0,
        // cultureFitScore: scores["Culture Fit"] ?? 0,
        // honestyScore: scores["Honesty"] ?? 0,
      },
    });

    // 4. Mark Assessment as COMPLETED
    await prisma.assessment.update({
      where: { id: assessmentId },
      data: { status: AssessmentStatus.COMPLETED }
    });

    console.log(`✅ [API] Report Generated: ${report.id}`);

    return NextResponse.json({
      success: true,
      reportId: report.id,
    });

  } catch (error: any) {
    console.error("🔥 Finish Interview Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate report" },
      { status: 500 }
    );
  }
}