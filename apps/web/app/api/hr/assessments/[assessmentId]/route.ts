// in app/api/hr/assessments/[assessmentId]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJwt } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function DELETE(
  request: Request,
  { params }: { params: { assessmentId: string } }
) {
  const token = cookies().get("token");
  const payload = token ? await verifyJwt(token.value) : null;
  if (!payload || (payload.role.toUpperCase() !== 'HR' && payload.role.toUpperCase() !== 'ADMIN')) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const { assessmentId } = params;
    await prisma.$transaction([
      prisma.report.deleteMany({ where: { assessmentId } }),
      prisma.behavioralInterview.deleteMany({ where: { assessmentId } }),
      prisma.technicalAssessment.deleteMany({ where: { assessmentId } }),
      prisma.assessment.delete({ where: { id: assessmentId } }),
    ]);
    return NextResponse.json({ message: 'Assessment deleted successfully.' }, { status: 200 });
  } catch (error) {
    console.error("DELETE assessment error:", error);
    return NextResponse.json({ error: "Failed to delete assessment" }, { status: 500 });
  }
}