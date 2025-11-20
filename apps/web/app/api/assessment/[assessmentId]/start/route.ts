// apps/web/app/api/assessment/[assessmentId]/start/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwt } from "@/lib/auth";
import { cookies } from "next/headers";
import { AIService } from "@/lib/ai-service";

export async function POST(
  request: Request,
  { params }: { params: { assessmentId: string } }
) {
  try {
    // 1. Auth Check
    const cookieStore = cookies();
    const token = cookieStore.get("token");
    const user = await verifyJwt(token?.value || "");

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const assessmentId = params.assessmentId;

    // 2. Fetch Assessment & Job Details
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        // Assuming you have relation to Job/Candidate. 
        // If not, we fallback to defaults. Adjust based on your schema.
        candidate: true,
      }
    });

    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    // 3. Update Status in MongoDB
    await prisma.assessment.update({
      where: { id: assessmentId },
      data: { status: "IN_PROGRESS" }
    });

    // 4. Initialize AI Engine (Python)
    // We pass the MongoDB ID so Python can sync with it
    const aiResponse = await AIService.startSession({
      session_id: assessment.id,
      candidate_id: user.id,
      job_title: "Software Engineer", // Replace with assessment.jobTitle if available
      company: "Tech Corp",           // Replace with assessment.company if available
      personality: "Default Manager"  // Can be dynamic
    });

    return NextResponse.json(aiResponse);

  } catch (error) {
    console.error("Start Interview Error:", error);
    return NextResponse.json(
      { error: "Failed to start interview session" },
      { status: 500 }
    );
  }
}