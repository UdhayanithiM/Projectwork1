import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma"; // ✅ Import Prisma

// Force dynamic to prevent caching of "null" user states
export const dynamic = "force-dynamic";

const JWT_SECRET = process.env.JWT_SECRET || "default-dev-secret-please-change";
const secretKey = new TextEncoder().encode(JWT_SECRET);

export async function GET(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Verify Token
    const { payload } = await jwtVerify(token, secretKey);
    const userId = payload.id as string;

    // 2. ✅ CRITICAL FIX: Fetch Fresh Data from DB
    // Do NOT return payload.user, because it is stale (doesn't have the new profileData)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profileData: true, // ✅ Ensure we get the AI analysis results
         // If you have this field
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });

  } catch (e) {
    return NextResponse.json({ error: "Invalid Token" }, { status: 401 });
  }
}