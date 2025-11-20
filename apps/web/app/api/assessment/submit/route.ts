// in app/api/assessment/submit/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJwt } from '@/lib/auth';
import { cookies } from 'next/headers';
import { z } from 'zod';

// Zod schema for validating the incoming submission data
const submissionSchema = z.object({
  assessmentId: z.string().min(1, "Assessment ID is required"),
  technicalAssessmentId: z.string().min(1, "Technical Assessment ID is required"),
  code: z.string(), // Allow empty code, it will just fail evaluation
  language: z.string().min(1, "Language is required"),
  questionIds: z.array(z.string()).min(1, "Question IDs are required"),
});

// Helper function to call your own evaluation API securely on the server-side
async function evaluateCodeOnServer(questionIds: string[], code: string, language: string) {
  const url = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}/api/assessment/evaluate`
    : `http://localhost:3000/api/assessment/evaluate`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ questionIds, code, language }),
  });

  if (!response.ok) {
    throw new Error('Internal code evaluation failed.');
  }
  return response.json();
}

export async function POST(request: Request) {
  const token = cookies().get("token");
  const payload = token ? await verifyJwt(token.value) : null;

  if (!payload) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validation = submissionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
    }

    const { assessmentId, technicalAssessmentId, code, language, questionIds } = validation.data;

    // --- Securely re-evaluate the code on the server ---
    const evaluationData = await evaluateCodeOnServer(questionIds, code, language);
    const evaluationResults = evaluationData.results[0].testCases;

    // --- Calculate Final Score ---
    const passedTestCases = evaluationResults.filter((r: any) => r.status === 'passed').length;
    const totalTestCases = evaluationResults.length;
    const score = totalTestCases > 0 ? (passedTestCases / totalTestCases) * 100 : 0;

    // --- Update Database in a Transaction ---
    await prisma.$transaction(async (tx) => {
      // 1. Update the TechnicalAssessment
      await tx.technicalAssessment.update({
        where: { id: technicalAssessmentId },
        data: {
          code,
          language,
          score,
          evaluationResults: evaluationResults, // Prisma handles JSON casting
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      // 2. Update the parent Assessment status to show it's done
      await tx.assessment.update({
        where: { id: assessmentId },
        data: {
          status: 'COMPLETED',
        },
      });
    });

    return NextResponse.json({ message: 'Assessment submitted successfully!', score: score }, { status: 200 });

  } catch (error) {
    console.error('POST /api/assessment/submit error:', error);
    return NextResponse.json({ error: 'Failed to submit assessment.' }, { status: 500 });
  }
}