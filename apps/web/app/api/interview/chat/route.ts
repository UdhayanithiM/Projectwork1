// apps/web/app/api/interview/chat/route.ts
import { NextResponse } from "next/server";
import { AIService } from "@/lib/ai-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages, assessmentId } = body;

    if (!assessmentId) {
      return NextResponse.json({ error: "Assessment ID is required" }, { status: 400 });
    }

    // Get the last user message
    const lastUserMessage = messages[messages.length - 1]?.text || "";

    // Call Python AI Engine
    const aiResponse = await AIService.nextTurn({
      session_id: assessmentId,
      candidate_answer: lastUserMessage,
    });

    // Return the AI's question to the frontend
    return NextResponse.json({ 
      reply: aiResponse.question,
      hints: aiResponse.hints 
    });

  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { error: "AI Service unavailable" },
      { status: 500 }
    );
  }
}