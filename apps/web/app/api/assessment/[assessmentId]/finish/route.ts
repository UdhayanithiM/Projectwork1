import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AIService } from "@/lib/ai-service";

export async function POST(
  request: Request,
  { params }: { params: { assessmentId: string } }
) {
  try {
    const { assessmentId } = params;

    console.log(`📊 Generating scores for ${assessmentId}...`);

    // 1. Call Python scoring engine
    const aiResult = await AIService.endSession(assessmentId);
    const scores = aiResult.scores || {};

    // 2. Fetch assessment to get candidateId
    const assessment = await prisma.assessment.findUniqueOrThrow({
      where: { id: assessmentId },
      select: { candidateId: true }
    });

    // 3. Create interview report
    const report = await prisma.report.create({
      data: {
        // --- RELATIONS ---
        candidate: { connect: { id: assessment.candidateId } },
        assessment: { connect: { id: assessmentId } },

        // --- SUMMARY ---
        summary: scores.Notes || "Interview completed successfully.",

        // --- SCORES ---
        roleFitScore: scores["Role Fit"] ?? 0,
        cultureFitScore: scores["Culture Fit"] ?? 0,
        honestyScore: scores["Honesty"] ?? 0,
        technicalScore: scores["Technical Skills"] ?? 0,

        // --- STRUCTURED DATA ---
        strengths: scores.Strengths ?? [],
        areasForImprovement: scores.Weaknesses ?? [],
        behavioralScores: scores,
      },
    });

    // 4. Mark the assessment as finished
    await prisma.assessment.update({
      where: { id: assessmentId },
      data: { status: "COMPLETED" }
    });

    return NextResponse.json({
      success: true,
      reportId: report.id,
    });

  } catch (error: any) {
    console.error("Finish Interview Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate report" },
      { status: 500 }
    );
  }
}
