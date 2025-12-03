import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "default-dev-secret-please-change";
const secretKey = new TextEncoder().encode(JWT_SECRET);

export async function GET() {
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

  try {
    // 2. Fetch Assessments for Candidate
    // We include nested relations so the Dashboard can show progress bars/scores
    const assessments = await prisma.assessment.findMany({
      where: {
        candidateId: userId,
      },
      orderBy: {
        createdAt: "desc", // Newest first
      },
      include: {
        technicalAssessment: {
          select: {
            status: true,
            score: true,
          },
        },
        behavioralInterview: {
          select: {
            status: true,
          },
        },
        report: {
          select: {
            id: true,
            technicalScore: true,
            behavioralScores: true,
          },
        },
      },
    });

    return NextResponse.json(assessments, { status: 200 });

  } catch (error) {
    console.error("GET /api/candidate/assessments Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch assessments" },
      { status: 500 }
    );
  }
}