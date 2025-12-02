import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { z } from "zod";

// --- GET all assessments ---
export async function GET() {
  const token = cookies().get("token");
  const payload = token ? await verifyJwt(token.value) : null;
  if (payload?.role.toUpperCase() !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const assessments = await prisma.assessment.findMany({
      orderBy: { createdAt: "desc" },
      // Include related data to show on the admin page
      include: {
        technicalAssessment: {
          include: {
            questions: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        candidate: {
          select: {
            name: true,
          }
        },
      },
    });
    return NextResponse.json(assessments);
  } catch (error) {
    console.error("GET /api/admin/assessments error:", error);
    return NextResponse.json({ error: "Failed to fetch assessments" }, { status: 500 });
  }
}


// --- Zod schema for creating an assessment ---
const createAssessmentSchema = z.object({
  candidateId: z.string().min(1, "A candidate must be selected."),
  questionIds: z.array(z.string()).min(1, "At least one question must be selected."),
});

// --- POST - create a new assessment ---
export async function POST(request: Request) {
  const token = cookies().get("token");
  const payload = token ? await verifyJwt(token.value) : null;
  if (!payload || payload.role.toUpperCase() !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const adminId = payload.id;

  const body = await request.json();
  const validation = createAssessmentSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
  }

  const { candidateId, questionIds } = validation.data;

  try {
    // Use a Prisma transaction to ensure both records are created or neither are.
    const newAssessment = await prisma.$transaction(async (tx) => {
      // 1. Create the main Assessment record
      const assessment = await tx.assessment.create({
        data: {
          candidateId: candidateId,
          hrId: adminId, // The logged-in admin is creating this
          status: "PENDING", // Initial status
        },
      });

      // 2. Create the associated TechnicalAssessment record
      await tx.technicalAssessment.create({
        data: {
          assessmentId: assessment.id,
          status: "NOT_STARTED",
          // Connect the selected questions
          questions: {
            connect: questionIds.map((id) => ({ id })),
          },
        },
      });

      return assessment;
    });

    return NextResponse.json(newAssessment, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/assessments error:", error);
    return NextResponse.json({ error: "Failed to create assessment" }, { status: 500 });
  }
}

