import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "default-dev-secret-please-change";
const secretKey = new TextEncoder().encode(JWT_SECRET);

export async function GET(
  request: Request,
  { params }: { params: { assessmentId: string } }
) {
  // 1. Auth Check
  const token = cookies().get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let userId: string;
  try {
      const { payload } = await jwtVerify(token, secretKey);
      userId = payload.id as string;
  } catch (err) {
      return NextResponse.json({ error: "Invalid Token" }, { status: 403 });
  }

  try {
    const { assessmentId } = params;

    // 3. Fetch Assessment
    // We strictly filter by `candidateId: userId` to prevent IDOR attacks.
    const assessment = await prisma.assessment.findUnique({
      where: {
        id: assessmentId,
        candidateId: userId, 
      },
      include: {
        technicalAssessment: {
          include: {
            // Fetch the actual coding questions linked to this session
            questions: {
                select: {
                    id: true,
                    title: true,
                    description: true,
                    difficulty: true,
                    testCases: true // Frontend needs this for local validation
                }
            },
          },
        },
      },
    });

    if (!assessment) {
      return NextResponse.json(
        { error: "Assessment not found or permission denied." },
        { status: 404 }
      );
    }

    return NextResponse.json(assessment, { status: 200 });

  } catch (error) {
    console.error("GET /api/assessment/[id] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}