import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";

// GET all users with the 'STUDENT' role to act as candidates
export async function GET() {
  const token = cookies().get("token");
  const payload = token ? await verifyJwt(token.value) : null;
  if (payload?.role.toUpperCase() !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const candidates = await prisma.user.findMany({
      where: {
        role: "STUDENT",
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: {
        name: "asc",
      },
    });
    return NextResponse.json(candidates);
  } catch (error) {
    console.error("GET /api/admin/candidates error:", error);
    return NextResponse.json({ error: "Failed to fetch candidates" }, { status: 500 });
  }
}

