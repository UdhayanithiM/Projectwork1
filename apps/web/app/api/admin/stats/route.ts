import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";

// 🚨 Force dynamic execution to prevent static generation issues
export const dynamic = "force-dynamic";

export async function GET() {
  const token = cookies().get("token")?.value;
  
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await verifyJwt(token);
    const role = payload?.role?.toUpperCase();

    // Allow both ADMIN and HR to view stats
    if (role !== "ADMIN" && role !== "HR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Run parallel queries for efficiency
    const [totalUsers, totalQuestions, totalAssessments, totalSubmissions] = await Promise.all([
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.codingQuestion.count(),
      prisma.assessment.count(),
      prisma.technicalAssessment.count({ where: { status: "COMPLETED" } }),
    ]);

    return NextResponse.json({
      totalUsers,
      totalQuestions,
      totalAssessments,
      totalSubmissions,
    });

  } catch (error) {
    console.error("GET /api/admin/stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}