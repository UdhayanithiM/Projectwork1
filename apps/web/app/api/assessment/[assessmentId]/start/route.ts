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

    // 2. Fetch Assessment Details
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        candidate: true,
      }
    });

    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    // 🛡️ Authorization: Ensure the logged-in user owns this assessment
    if (assessment.candidateId !== user.id) {
      return NextResponse.json({ error: "Forbidden: This assessment does not belong to you." }, { status: 403 });
    }

    // 3. Update Status in MongoDB
    await prisma.assessment.update({
      where: { id: assessmentId },
      data: { status: "IN_PROGRESS" }
    });

    // 4. Initialize AI Engine (Python)
    // We wait for this to complete so the session exists before the frontend connects via WebSocket
    const aiResponse = await AIService.startSession({
      session_id: assessment.id,
      candidate_id: user.id,
      job_title: "Software Engineer", // TODO: Pull from Assessment -> Job relation in future
      company: "Tech Corp",           // TODO: Pull from Assessment -> Company relation in future
      personality: "Default Manager"
    });

    return NextResponse.json(aiResponse);

  } catch (error: any) {
    console.error("Start Interview Error:", error);
    
    // Return specific error message to help frontend debug
    return NextResponse.json(
      { error: error.message || "Failed to start interview session" },
      { status: 500 }
    );
  }
}