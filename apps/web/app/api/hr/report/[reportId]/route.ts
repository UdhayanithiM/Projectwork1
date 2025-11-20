// in app/api/hr/report/[reportId]/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJwt } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(
  request: Request,
  { params }: { params: { reportId: string } }
) {
  // 1. Authenticate the user and ensure they are HR or ADMIN
  const token = cookies().get("token");
  const payload = token ? await verifyJwt(token.value) : null;

  if (!payload || (payload.role.toUpperCase() !== 'HR' && payload.role.toUpperCase() !== 'ADMIN')) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { reportId } = params;

    // 2. Fetch the specific report from the database
    const report = await prisma.report.findUnique({
      where: {
        id: reportId,
      },
      include: {
        // Include the candidate's name and email for display
        candidate: {
          select: {
            name: true,
            email: true,
          },
        },
        // Include the original assessment date
        assessment: {
            select: {
                createdAt: true,
            }
        }
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found." }, { status: 404 });
    }

    return NextResponse.json(report, { status: 200 });
  } catch (error) {
    console.error("GET /api/hr/report/[reportId] error:", error);
    return NextResponse.json({ error: "Failed to fetch report details" }, { status: 500 });
  }
}