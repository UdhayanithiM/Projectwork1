import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose'; // Use jose for Edge compatibility
import { cookies } from 'next/headers';
import { z } from 'zod';
import { Prisma, AssessmentStatus } from '@prisma/client'; // ✅ Imported AssessmentStatus


// Ensure this matches your .env
const JWT_SECRET = process.env.JWT_SECRET || "default-dev-secret-please-change";
const secretKey = new TextEncoder().encode(JWT_SECRET);

// Zod schema for validating input
const submissionSchema = z.object({
  assessmentId: z.string().min(1, "Assessment ID is required"),
  technicalAssessmentId: z.string().min(1, "Technical Assessment ID is required"),
  code: z.string(), 
  language: z.string().min(1, "Language is required"),
  questionIds: z.array(z.string()).min(1, "Question IDs are required"),
});

// --- HELPER: Mock Code Evaluation ---
// In a real app, this would call Judge0 or Piston.
async function evaluateCodeOnServer(questionIds: string[], code: string, language: string) {
  console.log(`🤖 [Mock Runner] Evaluating ${language} code...`);
  
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  if (!code.trim() || code.includes("// Start writing")) {
    return {
      results: [{ testCases: [{ status: "failed", message: "Empty code submitted." }] }]
    };
  }

  // MOCK SUCCESS: Assume they passed everything
  return {
    results: [{
      testCases: [
        { status: "passed", expected: "2", actual: "2" },
        { status: "passed", expected: "[0,1]", actual: "[0,1]" }
      ]
    }]
  };
}

export async function POST(request: Request) {
  console.log("🚀 [API] Submitting Assessment...");

  // 1. Auth Check
  const token = cookies().get("token")?.value;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await jwtVerify(token, secretKey);
  } catch (err) {
    return NextResponse.json({ error: 'Invalid Token' }, { status: 403 });
  }

  try {
    // 2. Validation
    const body = await request.json();
    const validation = submissionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
    }

    const { assessmentId, technicalAssessmentId, code, language, questionIds } = validation.data;

    // 3. Execution (Mock)
    const evaluationData = await evaluateCodeOnServer(questionIds, code, language);
    const evaluationResults = evaluationData.results[0].testCases;

    // 4. Score Calculation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const passedTestCases = evaluationResults.filter((r: any) => r.status === 'passed').length;
    const totalTestCases = evaluationResults.length;
    const score = totalTestCases > 0 ? (passedTestCases / totalTestCases) * 100 : 0;
    
    // Threshold to proceed to interview
    const PASSED_THRESHOLD = 70;
    const isPassed = score >= PASSED_THRESHOLD;

    console.log(`📊 [API] Score: ${score}% (Passed: ${isPassed})`);

    // 5. Database Transaction (Critical State Change)
    // ✅ Explicitly typing tx as Prisma.TransactionClient fixes the implicit any error
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      
      // A. Update Technical Module
      await tx.technicalAssessment.update({
        where: { id: technicalAssessmentId },
        data: {
          code,
          language,
          score,
          evaluationResults: evaluationResults,
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      // B. Update Parent Assessment Logic
      if (isPassed) {
        // ✅ PASSED: Advance to Stage 2 (Behavioral)
        // Now valid because we updated the Schema Enum
        await tx.assessment.update({
          where: { id: assessmentId },
          data: { status: AssessmentStatus.PASSED_TECH } 
        });

        // Auto-Create Behavioral Session so Mirror Room works
        // Check if exists first to avoid duplicates
        const existingInterview = await tx.behavioralInterview.findUnique({
            where: { assessmentId }
        });

        if (!existingInterview) {
            await tx.behavioralInterview.create({
                data: {
                    assessmentId: assessmentId,
                    status: 'PENDING',
                }
            });
            console.log("🎤 [API] Behavioral Interview Session Created");
        }

      } else {
        // ❌ FAILED: Mark as failed
        await tx.assessment.update({
          where: { id: assessmentId },
          data: { status: AssessmentStatus.FAILED }
        });
      }
    });

    return NextResponse.json({ 
      success: true, 
      score: score, 
      passed: isPassed,
      nextStage: isPassed ? `/take-interview/${assessmentId}/intro` : null,
      message: isPassed ? 'Assessment Passed! Moving to Interview...' : 'Assessment Failed.' 
    }, { status: 200 });

  } catch (error) {
    console.error('🔥 POST /api/assessment/submit error:', error);
    return NextResponse.json({ error: 'Submission processing failed.' }, { status: 500 });
  } 
}