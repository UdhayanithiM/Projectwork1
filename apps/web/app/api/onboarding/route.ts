import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "default-dev-secret-please-change";
const secretKey = new TextEncoder().encode(JWT_SECRET);

// Use 127.0.0.1 to avoid Docker/Next.js networking issues with 'localhost'
const AI_ENGINE_URL = process.env.AI_ENGINE_URL || "http://127.0.0.1:8000";

export async function POST(req: NextRequest) {
  console.log("🚀 [API] Starting Resume Onboarding...");

  // 1. Auth Check
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let userId: string;
  try {
    const { payload } = await jwtVerify(token, secretKey);
    userId = payload.id as string;
  } catch (err) {
    return NextResponse.json({ error: "Invalid Token" }, { status: 403 });
  }

  // 2. Parse Form
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

  try {
    // 3. Send to Python
    const aiFormData = new FormData();
    aiFormData.append("file", file);

    console.log(`📡 [API] Sending to Python: ${AI_ENGINE_URL}/api/parse-resume`);
    
    const aiRes = await fetch(`${AI_ENGINE_URL}/api/parse-resume`, {
      method: "POST",
      body: aiFormData,
    });

    if (!aiRes.ok) throw new Error("AI Service failed to parse resume");

    const aiData = await aiRes.json();
    console.log("🧠 [API] Analysis Result:", aiData);

    // 4. Update DB
    await prisma.user.update({
      where: { id: userId },
      data: { profileData: aiData },
    });

    console.log("💾 [API] DB Updated Successfully");

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("🔥 Onboarding Error:", error);
    return NextResponse.json({ error: error.message || "Server Error" }, { status: 500 });
  }
}