import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";
import { AssessmentType, AssessmentStatus, Difficulty } from "@prisma/client";

// Ensure this matches your .env
const JWT_SECRET = process.env.JWT_SECRET || "default-dev-secret-please-change";
const secretKey = new TextEncoder().encode(JWT_SECRET);

export async function POST(req: NextRequest) {
  console.log("🚀 [API] Auto-Generating Assessment...");

  // 1. Authentication Check
  const token = req.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let userId: string;
  try {
    const { payload } = await jwtVerify(token, secretKey);
    userId = payload.id as string;
  } catch (err) {
    return NextResponse.json({ error: "Invalid Token" }, { status: 401 });
  }

  try {
    // 2. Fetch User Profile & Check Existing Assessments
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, profileData: true } // Only fetch what we need
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user already has a pending or in-progress assessment
    const existingAssessment = await prisma.assessment.findFirst({
      where: {
        candidateId: userId,
        status: { in: [AssessmentStatus.PENDING, AssessmentStatus.IN_PROGRESS] }
      }
    });

    if (existingAssessment) {
      console.log("ℹ️ [API] Assessment already exists. Returning existing ID.");
      return NextResponse.json({ 
        success: true, 
        assessmentId: existingAssessment.id,
        status: existingAssessment.status,
        message: "Resuming existing session" 
      });
    }

    // 3. Determine Difficulty from Profile Data
    // Default to EASY if no profile data exists
    let targetDifficulty: Difficulty = Difficulty.EASY;
    let skills: string[] = [];

    if (user.profileData && typeof user.profileData === 'object') {
      const profile = user.profileData as any; // Cast to access dynamic fields
      const seniority = profile.seniority?.toLowerCase() || "";
      
      if (seniority.includes("senior")) targetDifficulty = Difficulty.HARD;
      else if (seniority.includes("mid")) targetDifficulty = Difficulty.MEDIUM;
      
      skills = profile.skills || [];
      console.log(`🧠 [API] Profile Analysis: ${seniority} -> Setting Difficulty: ${targetDifficulty}`);
    } else {
      console.log("⚠️ [API] No profile data found. Defaulting to EASY mode.");
    }

    // 4. Select Questions from Question Bank
    // Strategy: Get 3 random questions matching the difficulty
    // (In a real app, you'd filter by 'skills' too, e.g., only React questions)
    const questions = await prisma.codingQuestion.findMany({
      where: { difficulty: targetDifficulty },
      take: 3, // Limit to 3 questions per assessment
    });

    // Fallback: If no questions found for that difficulty, fetch ANY questions
    let finalQuestions = questions;
    if (questions.length === 0) {
      console.warn(`⚠️ [API] No questions found for difficulty ${targetDifficulty}. Fetching EASY fallbacks.`);
      finalQuestions = await prisma.codingQuestion.findMany({
        where: { difficulty: Difficulty.EASY },
        take: 3
      });
    }

    if (finalQuestions.length === 0) {
      return NextResponse.json({ error: "System Error: Question Bank is empty. Please contact admin." }, { status: 500 });
    }

    const questionIds = finalQuestions.map(q => q.id);

    // 5. Create Assessment & Technical Module Transaction
    // We use a transaction to ensure both records are created or neither
    const newAssessment = await prisma.$transaction(async (tx) => {
      // A. Create Parent Assessment
      const assessment = await tx.assessment.create({
        data: {
          candidateId: userId,
          type: AssessmentType.PRACTICE,
          status: AssessmentStatus.PENDING,
          difficulty: targetDifficulty,
          title: `AI-Generated ${targetDifficulty} Assessment`
        }
      });

      // B. Create Technical Module linked to Questions
      await tx.technicalAssessment.create({
        data: {
          assessmentId: assessment.id,
          status: "PENDING",
          questionIds: questionIds // Link the selected question IDs
        }
      });

      return assessment;
    });

    console.log(`✅ [API] Assessment Created: ${newAssessment.id} with ${questionIds.length} questions.`);

    return NextResponse.json({
      success: true,
      assessmentId: newAssessment.id,
      difficulty: targetDifficulty,
      questionCount: questionIds.length,
      message: "New simulation generated successfully"
    });

  } catch (error: any) {
    console.error("🔥 [API] Auto-Generate Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}