// app/api/admin/questions/[questionId]/route.ts

import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { z } from "zod";

// --- Zod schema for validation ---
const updateQuestionSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().min(1, "Description is required").optional(),
  difficulty: z.enum(["Easy", "Medium", "Hard"]).optional(),
  testCases: z.array(z.any()).min(1, "At least one test case is required").optional(),
});

// --- NEW PUT function ---
export async function PUT(
  request: NextRequest,
  { params }: { params: { questionId: string } }
) {
  const token = cookies().get("token");
  const payload = token ? await verifyJwt(token.value) : null;
  if (payload?.role.toUpperCase() !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { questionId } = params;
  const body = await request.json();
  const validation = updateQuestionSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
  }

  try {
    const updatedQuestion = await prisma.codingQuestion.update({
      where: { id: questionId },
      data: validation.data,
    });
    return NextResponse.json(updatedQuestion, { status: 200 });
  } catch (error) {
    console.error("PUT /api/admin/questions/[questionId] error:", error);
    return NextResponse.json({ error: "Failed to update question" }, { status: 500 });
  }
}

// --- Your existing DELETE function ---
export async function DELETE(
  request: NextRequest,
  { params }: { params: { questionId: string } }
) {
  const token = cookies().get("token");
  const payload = token ? await verifyJwt(token.value) : null;
  if (payload?.role.toUpperCase() !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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