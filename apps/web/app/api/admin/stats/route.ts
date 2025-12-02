// app/api/admin/stats/route.ts

import { NextResponse, type NextRequest } from "next/server"; // Import NextRequest
import { PrismaClient } from "@prisma/client";
import { verifyJwt } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) { // Use NextRequest to access cookies
  try {
    // CORRECTED: Read the token from the httpOnly cookie
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized: No token provided" }, { status: 401 });
    }

    const decoded = await verifyJwt(token);

    if (!decoded || decoded.role !== 'ADMIN') {
        return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const totalUsers = await prisma.user.count();
    const totalQuestions = await prisma.codingQuestion.count();
    const totalAssessments = await prisma.assessment.count();
    const totalSubmissions = totalAssessments; 

    return NextResponse.json({
      totalUsers,
      totalQuestions,
      totalAssessments,
      totalSubmissions,
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

