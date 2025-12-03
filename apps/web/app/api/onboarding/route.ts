import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";

// Ensure this matches your .env
const JWT_SECRET = process.env.JWT_SECRET || "default-dev-secret-please-change";
const secretKey = new TextEncoder().encode(JWT_SECRET);

// The internal URL for the Python Service
const AI_ENGINE_URL = process.env.AI_ENGINE_URL || "http://127.0.0.1:8000";

export async function POST(req: NextRequest) {
  console.log("🚀 [API] Starting Resume Onboarding...");

  // 1. Authentication Check
  const token = req.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized: No token found" }, { status: 401 });
  }

  let userId: string;
  try {
    const { payload } = await jwtVerify(token, secretKey);
    userId = payload.id as string; // Ensure your login route saves 'id' in the token payload
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
  }

  // 2. File Extraction
  let formData;
  try {
    formData = await req.formData();
  } catch (error) {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File;
  if (!file) {
    return NextResponse.json({ error: "No resume file provided" }, { status: 400 });
  }

  console.log(`📄 [API] Received file: ${file.name} (${file.size} bytes)`);

  try {
    // 3. Forward to Python AI Engine
    // We create a new FormData stream to pass the file along
    const aiFormData = new FormData();
    aiFormData.append("file", file);

    console.log(`📡 [API] Forwarding to AI Engine: ${AI_ENGINE_URL}/api/parse-resume`);
    
    const aiResponse = await fetch(`${AI_ENGINE_URL}/api/parse-resume`, {
      method: "POST",
      body: aiFormData,
      // Note: Do NOT set Content-Type header here; fetch sets it automatically with the boundary for FormData
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("❌ [API] AI Engine Error:", errorText);
      return NextResponse.json(
        { error: "AI Analysis Failed", details: errorText }, 
        { status: 502 }
      );
    }

    const aiData = await aiResponse.json();
    console.log("🧠 [API] AI Analysis Complete:", aiData);

    // Expected aiData structure:
    // { 
    //   "skills": ["React", "Python"], 
    //   "experience_years": 3, 
    //   "seniority": "Mid-Level", 
    //   "suggested_difficulty": "MEDIUM" 
    // }

    // 4. Update User Profile in Database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        profileData: aiData, // Saves the JSON analysis
      },
    });

    console.log("💾 [API] User Profile Updated in DB");

    return NextResponse.json({ 
      success: true, 
      data: updatedUser.profileData,
      redirect: "/dashboard" 
    });

  } catch (error: any) {
    console.error("🔥 [API] Critical Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message }, 
      { status: 500 }
    );
  }
}