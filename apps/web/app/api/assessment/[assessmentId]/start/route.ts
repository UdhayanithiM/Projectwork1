import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose"; // Edge-compatible auth
import { cookies } from "next/headers";
import { AIService } from "@/lib/ai-service";
import { AssessmentStatus } from "@prisma/client";

// Ensure this matches your .env
const JWT_SECRET = process.env.JWT_SECRET || "default-dev-secret-please-change";
const secretKey = new TextEncoder().encode(JWT_SECRET);

export async function POST(
  request: Request,
  { params }: { params: { assessmentId: string } }
) {
  console.log(`🚀 [API] Starting Session: ${params.assessmentId}`);

  try {
    // 1. Auth Check
    const token = cookies().get("token")?.value;
    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let userId: string;
    try {
        const { payload } = await jwtVerify(token, secretKey);
        userId = payload.id as string;
    } catch (err) {
        return NextResponse.json({ error: "Invalid Token" }, { status: 403 });
    }

    const assessmentId = params.assessmentId;

    // 2. Fetch Assessment & Candidate Details
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        candidate: {
            select: { id: true, name: true, profileData: true } // Fetch profile for context
        },
      }
    });

    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    // 🛡️ Security: Ownership Check
    if (assessment.candidateId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3. Update Status
    await prisma.assessment.update({
      where: { id: assessmentId },
      data: { status: AssessmentStatus.IN_PROGRESS }
    });

    // 4. Initialize AI Engine
    // Pass rich context so the AI knows who it's talking to
    const aiResponse = await AIService.startSession({
      session_id: assessment.id,
      candidate_id: userId,
      candidate_name: assessment.candidate.name, // "Hi Alex..."
      job_title: "Full Stack Developer", // Default for now
      company: "FortiTwin Tech",         // Default for now
      personality: "Professional Recruiter"
    });

    return NextResponse.json(aiResponse);

  } catch (error: any) {
    console.error("🔥 Start Interview Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to start interview session" },
      { status: 500 }
    );
  }
}