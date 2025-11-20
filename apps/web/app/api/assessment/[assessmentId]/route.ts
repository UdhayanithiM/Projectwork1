// apps/web/app/api/assessment/[assessmentId]/route.ts

import { NextResponse } from "next/server"; // <--- UNCOMMENT THIS LINE
import { prisma } from "@/lib/prisma";
import { verifyJwt } from "@/lib/auth";
import { cookies } from "next/headers";

/**
 * API Route to securely fetch the full details for a specific assessment,
 * including all of its assigned coding questions, for the logged-in candidate.
 */
export async function GET(
  request: Request,
  { params }: { params: { assessmentId: string } }
) {
  // 1. Get the user's token from the cookies
  const token = cookies().get("token");
  const payload = token ? await verifyJwt(token.value) : null;

  // 2. If no valid token, the user is not authenticated
  if (!payload) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { assessmentId } = params;

    // 3. Fetch the assessment from the database
    const assessment = await prisma.assessment.findUnique({
      where: {
        id: assessmentId,
        // 4. CRITICAL SECURITY CHECK:
        // Ensure the person fetching this assessment is the assigned candidate.
        candidateId: payload.id,
      },
      include: {
        technicalAssessment: {
          include: {
            // Include the full details of all assigned questions
            questions: true,
          },
        },
      },
    });

    // 5. If no assessment matches BOTH the ID and the candidate, return not found.
    if (!assessment) {
      return NextResponse.json(
        { error: "Assessment not found or you do not have permission to view it." },
        { status: 404 }
      );
    }

    return NextResponse.json(assessment, { status: 200 });
  } catch (error) {
    console.error("GET /api/assessment/[assessmentId] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch assessment details" },
      { status: 500 }
    );
  }
}