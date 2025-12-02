// in app/api/hr/candidates/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJwt } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const token = cookies().get('token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const payload = await verifyJwt(token);
  if (!payload || (payload.role !== 'HR' && payload.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }

  try {
    const candidates = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        takenAssessments: {
          orderBy: { createdAt: 'desc' },
          // The `include` block tells Prisma to also fetch related data
          include: {
            technicalAssessment: {
              select: { score: true }
            },
            // --- THIS IS THE FIX ---
            // We are now telling Prisma to also include the report
            // that is linked to this assessment.
            report: {
              select: { id: true } // We only need the report's ID for the link
            }
            // --- END OF FIX ---
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(candidates);
  } catch (error) {
    console.error('Failed to fetch HR candidates data:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching candidate data.' },
      { status: 500 }
    );
  }
}