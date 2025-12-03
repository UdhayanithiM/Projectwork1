import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { z } from "zod";
import { Difficulty } from "@prisma/client"; // Import the Enum

// --- GET all coding questions ---
export async function GET() {
  const token = cookies().get("token");
  const payload = token ? await verifyJwt(token.value) : null;

  // Allow ADMIN and HR to view the question bank
  if (!payload || (payload.role !== "ADMIN" && payload.role !== "HR")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const questions = await prisma.codingQuestion.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(questions, { status: 200 });
  } catch (error) {
    console.error("GET /api/admin/questions error:", error);
    return NextResponse.json({ error: "Failed to fetch coding questions" }, { status: 500 });
  }
}

// --- Zod schema for validation ---
const questionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  // Map string input to Enum values (EASY, MEDIUM, HARD)
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]), 
  testCases: z.array(z.any()).min(1, "At least one test case is required"),
});

// --- POST - create a new coding question ---
export async function POST(req: Request) {
  const token = cookies().get("token");
  const payload = token ? await verifyJwt(token.value) : null;
  
  // Strict Admin Only
  if (payload?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const validation = questionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
    }

    const { title, description, difficulty, testCases } = validation.data;

    const newQuestion = await prisma.codingQuestion.create({
      data: { 
        title, 
        description, 
        difficulty: difficulty as Difficulty, // Ensure type safety
        testCases 
      },
    });

    return NextResponse.json(newQuestion, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/questions error:", error);
    return NextResponse.json({ error: "Failed to create coding question" }, { status: 500 });
  }
}