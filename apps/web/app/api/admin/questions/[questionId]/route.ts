import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { z } from "zod";
import { Difficulty } from "@prisma/client";

// --- Zod schema for validation ---
const updateQuestionSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().min(1, "Description is required").optional(),
  // Match Prisma Enum values
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
  testCases: z.array(z.any()).min(1, "At least one test case is required").optional(),
});

// --- PUT: Update Question ---
export async function PUT(
  request: NextRequest,
  { params }: { params: { questionId: string } }
) {
  const token = cookies().get("token");
  const payload = token ? await verifyJwt(token.value) : null;
  
  if (payload?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { questionId } = params;
  
  try {
    const body = await request.json();
    const validation = updateQuestionSchema.safeParse(body);

    if (!validation.success) {
        return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
    }

    // Prepare update data, explicitly casting difficulty if present
    const updateData: any = { ...validation.data };
    if (updateData.difficulty) {
        updateData.difficulty = updateData.difficulty as Difficulty;
    }

    const updatedQuestion = await prisma.codingQuestion.update({
      where: { id: questionId },
      data: updateData,
    });
    return NextResponse.json(updatedQuestion, { status: 200 });
  } catch (error) {
    console.error("PUT /api/admin/questions/[questionId] error:", error);
    return NextResponse.json({ error: "Failed to update question" }, { status: 500 });
  }
}

// --- DELETE: Remove Question ---
export async function DELETE(
  request: NextRequest,
  { params }: { params: { questionId: string } }
) {
  const token = cookies().get("token");
  const payload = token ? await verifyJwt(token.value) : null;
  
  if (payload?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { questionId } = params;

  try {
    await prisma.codingQuestion.delete({
      where: { id: questionId },
    });
    return NextResponse.json({ message: "Question deleted successfully." }, { status: 200 });
  } catch (error) {
    console.error("Failed to delete question:", error);
    return NextResponse.json({ error: "Could not delete question." }, { status: 500 });
  }
}