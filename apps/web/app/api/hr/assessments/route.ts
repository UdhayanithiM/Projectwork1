// in app/api/hr/assessments/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { z } from "zod";

const createAssessmentSchema = z.object({
  candidateId: z.string().min(1, "A candidate must be selected."),
  questionIds: z.array(z.string()).min(1, "At least one question must be selected."),
});

export async function POST(request: Request) {
  const token = cookies().get("token");
  const payload = token ? await verifyJwt(token.value) : null;

  if (!payload || (payload.role.toUpperCase() !== "HR" && payload.role.toUpperCase() !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const hrId = payload.id;

  try {
    const body = await request.json();
    const validation = createAssessmentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
    }
    const { candidateId, questionIds } = validation.data;

    // Use a Prisma transaction to ensure all related records are created together
    await prisma.$transaction(async (tx) => {
      // 1. Create the main Assessment record
      const assessment = await tx.assessment.create({
        data: {
          candidateId: candidateId,
          hrId: hrId,
          status: "PENDING",
        },
      });

      // 2. Create the associated TechnicalAssessment record
      await tx.technicalAssessment.create({
        data: {
          assessmentId: assessment.id,
          status: "NOT_STARTED",
          questions: { connect: questionIds.map((id) => ({ id })) },
        },
      });

      // --- THIS IS THE PERMANENT FIX ---
      // 3. Create the BehavioralInterview record at the same time.
      //    This guarantees it exists and prevents the "record not found" error.
      await tx.behavioralInterview.create({
        data: {
            assessmentId: assessment.id,
            status: "NOT_STARTED",
        }
      });
      // --- END OF FIX ---
    });

    return NextResponse.json({ message: "Assessment created successfully" }, { status: 201 });
  } catch (error) {
    console.error("POST /api/hr/assessments error:", error);
    return NextResponse.json({ error: "Failed to create assessment" }, { status: 500 });
  }
}

